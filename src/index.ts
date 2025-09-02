import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import express, { type Request, type Response } from "express";
import { config } from "dotenv";
import { MCPServer } from "./server.js";

// Load environment variables from .env file
config({ quiet: true });


let PORT = 8123;

// Parse command-line arguments for --port=XXXX
for (let i = 2; i < process.argv.length; i++) {
	const arg = process.argv[i];
	if (arg.startsWith("--port=")) {
		const value = parseInt(arg.split("=")[1], 10);
		if (!isNaN(value)) {
			PORT = value;
		} else {
			console.error("Invalid value for --port");
			process.exit(1);
		}
	}
}

const server = new MCPServer(
	new Server(
		{
			name: "mcp-server",
			version: "1.0.0",
		},
		{
			capabilities: {
				tools: {},
				logging: {},
			},
		},
	),
);

const app = express();
app.use(express.json());

const router = express.Router();

// single endpoint for the client to send messages to
const MCP_ENDPOINT = "/";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post(MCP_ENDPOINT, async (req: Request, res: Response) => {
	await server.handlePostRequest(req, res);
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get(MCP_ENDPOINT, async (req: Request, res: Response) => {
	await server.handleGetRequest(req, res);
});

app.use("/", router);

app.listen(PORT, () => {
	console.log(`MCP Streamable HTTP Server listening on port ${PORT}`);
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("SIGINT", async () => {
	console.log("Shutting down server...");
	await server.cleanup();
	process.exit(0);
});
