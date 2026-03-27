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
  emailCompany,
  emailCompanyToolDefinition,
} from "./tools/emailTools.js";

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
  transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  constructor(server: Server) {
    this.server = server;
    this.setupTools();
  }

  async handleGetRequest(req: Request, res: Response) {
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
      if (sessionId && this.transports[sessionId]) {
        transport = this.transports[sessionId];
        await transport.handleRequest(req, res, req.body);
        return;
      }

      if (!sessionId && isInitializeRequest(req.body)) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });

        await this.server.connect(transport);
        await transport.handleRequest(req, res, req.body);

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
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      return {
        tools: [emailCompanyToolDefinition],
      };
    });

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request, _extra) => {
        const args = request.params.arguments;
        const toolName = request.params.name;
        console.log("Tool call:", toolName, args);

        if (!args) {
          throw new Error("arguments undefined");
        }

        if (toolName === "email_company") {
          return await emailCompany(
            args as {
              character_id: string;
              visitor_message: string;
              conversation_summary: string;
              visitor_name: string;
              visitor_email: string;
            },
          );
        }

        throw new Error(`Unknown tool: ${toolName}`);
      },
    );
  }
}
