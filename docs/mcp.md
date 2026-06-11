# Local MCP Server

`wiki-llm-impl` exposes a local MCP server so agents can write to the local wiki through tools instead of raw file edits.

## Build

```powershell
npm run build
```

## Run

```powershell
$env:WIKI_LLM_PATH="C:\Users\Mikita\Documents\wiki-llm-impl\my-wiki"
node C:\Users\Mikita\Documents\wiki-llm-impl\dist\mcp\server.js
```

The server communicates over stdio. It is meant to be launched by an MCP client such as Codex, not used as an HTTP server.

## Tools

- `wiki_check`: validate the wiki workspace.
- `wiki_list_pages`: list pages so an agent can choose where memory belongs.
- `wiki_read_page`: read a page body and metadata.
- `wiki_search`: search candidate pages by query.
- `wiki_remember`: write context into a named section of a wiki page.
- `wiki_append_section`: append or replace a Markdown section.
- `wiki_link_page`: add machine links and Obsidian links between pages.
- `wiki_add_source_ref`: attach source refs to page metadata.
- `wiki_seed_project`: create/update a non-work project seed page.

## Codex MCP Config Sketch

Use the absolute repo path on this machine:

```json
{
  "mcpServers": {
    "wiki-llm-memory": {
      "command": "node",
      "args": [
        "C:\\Users\\Mikita\\Documents\\wiki-llm-impl\\dist\\mcp\\server.js"
      ],
      "env": {
        "WIKI_LLM_PATH": "C:\\Users\\Mikita\\Documents\\wiki-llm-impl\\my-wiki"
      }
    }
  }
}
```

## Example Tool Use

Ask an MCP-capable agent to call:

```json
{
  "tool": "wiki_remember",
  "arguments": {
    "page": "pages/project/gonka24.md",
    "heading": "New Note",
    "content": "Remember this context as Markdown.",
    "mode": "append"
  }
}
```

## Agent-Decided Remember Flow

For a user request like "remember this", the MCP server should not need its own embedded LLM. The calling agent already has reasoning ability and should use the MCP tools in this order:

1. `wiki_search` for likely pages.
2. `wiki_read_page` for the best candidates.
3. Decide the target page and heading.
4. Call `wiki_remember` with `mode: "append"` or `mode: "replace"`.
5. Optionally call `wiki_link_page` or `wiki_add_source_ref`.

If the target is unclear or the content may violate Memory Policy, the agent should ask before writing.

## Memory Policy

The local wiki is for non-work memory unless Mikita explicitly approves otherwise. The MCP server should be treated as a write-capable memory tool.
