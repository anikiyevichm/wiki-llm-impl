import { spawn } from "node:child_process";

const child = spawn("node", ["dist/mcp/server.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    WIKI_LLM_PATH: "my-wiki",
  },
  stdio: ["pipe", "pipe", "pipe"],
});

const responses = [];
let buffer = "";

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString("utf8");
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);
    if (line.length > 0) {
      responses.push(JSON.parse(line));
    }
  }
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

child.stdin.write(
  JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "wiki-llm-smoke", version: "0.1.0" },
    },
  }) + "\n",
);

await waitForResponse(1);

child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }) + "\n");

const toolsResponse = await waitForResponse(2);
const toolNames = toolsResponse.result.tools.map((tool) => tool.name).sort();

const expectedTools = ["wiki_check", "wiki_list_pages", "wiki_read_page", "wiki_search", "wiki_remember"];
const missingTools = expectedTools.filter((toolName) => !toolNames.includes(toolName));

if (missingTools.length > 0) {
  throw new Error(`Missing expected tools. Found: ${toolNames.join(", ")}`);
}

child.kill();
console.log(`MCP smoke passed: ${toolNames.join(", ")}`);

function waitForResponse(id) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const interval = setInterval(() => {
      const response = responses.find((message) => message.id === id);
      if (response) {
        clearInterval(interval);
        resolve(response);
      } else if (Date.now() - started > 5000) {
        clearInterval(interval);
        child.kill();
        reject(new Error(`Timed out waiting for response ${id}`));
      }
    }, 25);
  });
}
