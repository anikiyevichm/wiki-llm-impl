# Technology Choices

## Baseline Stack

The first implementation should be boring, local, and easy to install:

- Language: Node.js 22+ with TypeScript for the core engine, CLI, deterministic tests, and first MCP server.
- Storage: ordinary files plus SQLite generated indexes.
- Wiki pages: Obsidian-compatible Markdown with small YAML-style Properties frontmatter.
- Durable metadata: sidecar `.meta.json` files with explicit schema versions and strict machine fields.
- Search: SQLite FTS5 when available, with a plain JSON lexical fallback.
- Tool protocol: local MCP over stdio JSON-RPC, implemented thinly over the core library.
- Packaging: `package.json` with optional packages for model providers and richer parsers.
- Tests: Vitest for unit and integration tests.

This stack is chosen because the project must run offline, remain inspectable, and be comfortable to build quickly. TypeScript gives us strong contracts for pages, claims, tools, and adapters while staying close to the MCP ecosystem. Optional adapters may use external packages, but the memory core should not require the internet, a hosted account, or a specific LLM provider.

## Rust Later

Rust is a strong later-stage fit, but not the first whole-project implementation target. Use Rust when there is a concrete need for:

- a single portable binary;
- very fast indexing or parsing;
- robust file locking and sync primitives;
- large-wiki graph traversal;
- native modules behind stable TypeScript interfaces.

The TypeScript core should define contracts cleanly enough that Rust can replace hot paths later without changing wiki files or MCP tools.

## Module Technology Matrix

| Module | First technology | Later options |
| --- | --- | --- |
| Storage Core | Node `fs/promises`, JSON parsing, atomic file writes, Markdown + sidecar `.meta.json` | Rust file core, file locks, content-addressed blobs |
| Source Ingestion | TypeScript parsers for `.txt`, `.md`, JSON conversation exports | PDF/docx/html parser plugins, Rust parsers |
| Wiki Compiler | Deterministic compiler plus adapter-based LLM extraction | Local grammar repair, stronger entity resolution |
| Graph and Index | SQLite FTS5, JSON graph/backlinks fallback | Rust/Tantivy/LanceDB/embeddings as optional indexes |
| Retrieval Engine | TypeScript service functions over search/read/follow tools | Model-assisted retrieval planning, Rust graph traversal |
| Memory Writeback | Patch/proposal JSON plus Markdown page writer | Human review UI, merge workflows |
| Error Book | Markdown/JSON entries in `error-book/` | Reports and repair queues |
| Model Adapters | TypeScript interfaces and subprocess/local HTTP adapters | Provider packages as optional installs |
| Tool Surfaces | Node CLI, stdio MCP JSON-RPC | SDK-based MCP server, desktop tray, web UI |
| Sync and Sharing | Zip/tar bundles, JSON privacy manifests | Git-backed sync, Rust conflict tooling |

## Page Format Decision

Use Obsidian-compatible Markdown plus sidecar metadata for version one:

```markdown
---
id: page_synthesis_example
type: synthesis
title: Example
status: draft
confidence: medium
---

# Example
```

The sibling `example.meta.json` holds strict machine metadata:

```json
{
  "id": "page_synthesis_example",
  "type": "synthesis",
  "title": "Example",
  "created_at": "2026-06-10T00:00:00Z",
  "updated_at": "2026-06-10T00:00:00Z",
  "confidence": "medium",
  "status": "draft",
  "sources": [],
  "links": []
}
```

This keeps pages pleasant in Obsidian while preserving strict JSON contracts for the engine.

## Offline Policy

Core commands must pass with network disabled:

- workspace initialization
- file ingestion
- page read/write
- index rebuild
- lexical search
- evidence retrieval over existing pages
- error entry creation
- export/import bundle

Network-capable features must be explicit optional adapters, never hidden default behavior.

## Next Implementation Step

Start by scaffolding the TypeScript package:

- `package.json`
- `tsconfig.json`
- `src/core/` for Storage Core types and page IO
- `src/cli/` for `wiki-llm init`, `wiki-llm check`, and `wiki-llm new-page`
- `src/mcp/` as an empty boundary for the local MCP server
- `tests/` with Vitest fixtures for `my-wiki`-style pages

The first code milestone is Storage Core plus CLI parity with the temporary scripts in `scripts/`, using `.md` pages plus `.meta.json` sidecars.

After that, introduce the orchestration service as a thin coordinator over existing core services rather than as a separate source of truth.
