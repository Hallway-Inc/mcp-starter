import { type Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
	CallToolRequestSchema,
	InitializeRequestSchema,
	type JSONRPCError,
	type JSONRPCNotification,
	ListToolsRequestSchema,
	type LoggingMessageNotification,
	type Notification,
} from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";
import { type Request, type Response } from "express";
import {
	getAlerts,
	getForecast,
	getAlertsToolDefinition,
	getForecastToolDefinition,
} from "./tools/weatherTools.js";

const SESSION_ID_HEADER_NAME = "mcp-session-id";
const JSON_RPC = "2.0";

function createErrorResponse(message: string): JSONRPCError {
	return {
		jsonrpc: "2.0",
		error: {
			code: -32000,
			message: message,
		},
		id: randomUUID(),
	};
}

function isInitializeRequest(body: unknown): boolean {
	const isInitial = (data: unknown) => {
		const result = InitializeRequestSchema.safeParse(data);
		return result.success;
	};
	if (Array.isArray(body)) {
		return body.some((request) => isInitial(request));
	}
	return isInitial(body);
}

function streamMessages(transport: StreamableHTTPServerTransport) {
	try {
		// based on LoggingMessageNotificationSchema to trigger setNotificationHandler on client
		const message: LoggingMessageNotification = {
			method: "notifications/message",
			params: { level: "info", data: "SSE Connection established" },
		};

		void sendNotification(transport, message);
	} catch (error) {
		console.error("Error sending message:", error);
	}
}

async function sendNotification(
	transport: StreamableHTTPServerTransport,
	notification: Notification,
) {
	const rpcNotificaiton: JSONRPCNotification = {
		...notification,
		jsonrpc: JSON_RPC,
	};
	await transport.send(rpcNotificaiton);
}

export class MCPServer {
	server: Server;

	// to support multiple simultaneous connections
	transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

	private getAlertsToolName = "get-alerts";
	private getForecastToolName = "get-forecast";

	constructor(server: Server) {
		this.server = server;
		this.setupTools();
	}

	async handleGetRequest(req: Request, res: Response) {
		// if server does not offer an SSE stream at this endpoint.
		// res.status(405).set('Allow', 'POST').send('Method Not Allowed')

		const sessionId = req.headers["mcp-session-id"] as string | undefined;
		if (!sessionId || !this.transports[sessionId]) {
			res
				.status(400)
				.json(
					createErrorResponse("Bad Request: invalid session ID or method."),
				);
			return;
		}

		console.log(`Establishing SSE stream for session ${sessionId}`);
		const transport = this.transports[sessionId];
		await transport.handleRequest(req, res);
		void streamMessages(transport);

		return;
	}

	async handlePostRequest(req: Request, res: Response) {
		const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
		let transport: StreamableHTTPServerTransport;

		try {
			// reuse existing transport
			if (sessionId && this.transports[sessionId]) {
				transport = this.transports[sessionId];
				await transport.handleRequest(req, res, req.body);
				return;
			}

			// create new transport
			if (!sessionId && isInitializeRequest(req.body)) {
				const transport = new StreamableHTTPServerTransport({
					sessionIdGenerator: () => randomUUID(),
				});

				await this.server.connect(transport);
				await transport.handleRequest(req, res, req.body);

				// session ID will only be available (if in not Stateless-Mode)
				// after handling the first request
				const sessionId = transport.sessionId;
				if (sessionId) {
					this.transports[sessionId] = transport;
				}

				return;
			}

			res
				.status(400)
				.json(
					createErrorResponse("Bad Request: invalid session ID or method."),
				);
			return;
		} catch (error) {
			console.error("Error handling MCP request:", error);
			res.status(500).json(createErrorResponse("Internal server error."));
			return;
		}
	}

	async cleanup() {
		await this.server.close();
	}

	private setupTools() {
		// Define available tools
		const setToolSchema = () =>
			this.server.setRequestHandler(ListToolsRequestSchema, () => {
				return {
					tools: [getAlertsToolDefinition, getForecastToolDefinition],
				};
			});

		setToolSchema();

		// handle tool calls
		this.server.setRequestHandler(
			CallToolRequestSchema,
			async (request, _extra) => {
				const args = request.params.arguments;
				const toolName = request.params.name;
				console.log("Received request for tool with argument:", toolName, args);

				if (!args) {
					throw new Error("arguments undefined");
				}

				if (!toolName) {
					throw new Error("tool name undefined");
				}

				if (toolName === this.getAlertsToolName) {
					const alertParams = args as {
						state: string;
					};
					const result = await getAlerts(alertParams);

					console.log("getAlertsTool result: ", result);

					return result;
				}

				if (toolName === this.getForecastToolName) {
					const forecastParams = args as {
						latitude: number;
						longitude: number;
					};
					const result = await getForecast(forecastParams);

					console.log("getForecastTool result: ", result);

					return result;
				}

				throw new Error("Tool not found");
			},
		);
	}
}
