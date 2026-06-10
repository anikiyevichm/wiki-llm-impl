# Tool Surfaces Technical Plan

## Purpose

Expose the LLM Wiki engine to humans, agents, and automations. The same core library should power local MCP tools, CLI commands, library APIs, and optional skill packaging.

## Technology Choices

- Node CLI for the first command surface.
- Local MCP server over stdio JSON-RPC, thinly wrapping core service functions.
- TypeScript library API as the stable internal contract.
- Optional SDK-based MCP server later if it does not become a required core dependency.

## Responsibilities

- Provide a CLI for initialization, ingest, search, read, retrieval, writeback, audit, and index rebuild.
- Provide a local MCP server with agent-callable tools.
- Provide a library API for embedding in other applications.
- Provide optional skill wrapper documentation for agents that load skills.
- Keep tool names stable and agent-friendly.
- Preserve offline defaults.

## Public Interfaces

CLI commands:

- `wiki-llm init`
- `wiki-llm ingest <path>`
- `wiki-llm compile <source-id>`
- `wiki-llm search <query>`
- `wiki-llm read <page-id>`
- `wiki-llm retrieve <question>`
- `wiki-llm writeback <run-id>`
- `wiki-llm audit`
- `wiki-llm rebuild-index`

MCP tools:

- `wiki_search`
- `wiki_read_page`
- `wiki_follow_links`
- `wiki_ingest_source`
- `wiki_write_page`
- `wiki_write_correction`
- `wiki_retrieve_evidence`
- `wiki_audit_memory`

## Data Model

Tool requests and responses should use the same core DTOs as internal modules:

- `PageRef`
- `SourceRef`
- `EvidencePacket`
- `WritebackProposal`
- `ErrorEntry`
- `AuditReport`

## Implementation Milestones

1. Build CLI around Storage Core and Source Ingestion.
2. Add search/read/retrieve commands.
3. Add MCP server with read-only tools.
4. Add MCP write tools behind explicit configuration.
5. Add skill wrapper instructions and examples.
6. Add installation and packaging docs.

## Tests

- CLI commands run against fixture workspace.
- MCP tools return schema-valid responses.
- Read-only mode prevents writes.
- Offline mode does not attempt network access.
- Tool responses include citations and uncertainty when relevant.

## Risks

- Too many tool variants can fragment behavior. Keep surfaces thin over core.
- Write tools can mutate memory unexpectedly. Make write permissions explicit.
- Agents need stable schemas more than clever command names.
