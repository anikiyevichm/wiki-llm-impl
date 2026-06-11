# System Architecture

## Goal

`wiki-llm-impl` is a local-first LLM Wiki engine. It turns documents, conversations, and agent work into a durable wiki that can be searched, read, traversed, corrected, and improved by any agent or LLM through local tools.

The system is not a hosted knowledge service. It is a portable memory body: ordinary files plus local indexes plus tool surfaces such as MCP, CLI, and optional skill wrappers.

Technology choices are tracked in [technology.md](technology.md). The short version: TypeScript-first on Node.js 22+, Obsidian-compatible Markdown pages with sidecar `.meta.json` metadata, generated SQLite/JSON indexes, stdio MCP, optional model/provider adapters, and Rust later for hot paths or single-binary distribution.

## System Loop

1. Source material enters the local workspace through ingestion.
2. The wiki compiler extracts pages, claims, sections, links, provenance, and uncertainty.
3. Storage writes human-readable wiki files and machine-readable metadata.
4. Index and graph services build lookup, backlinks, and traversal structures.
5. Retrieval tools search, read, follow links, and assemble evidence.
6. Agents answer from evidence and can write back synthesis pages, corrections, and error notes.
7. Maintenance jobs audit stale links, contradictions, bad provenance, and repeated failures.

## Module Map

| Module | Purpose | Plan |
| --- | --- | --- |
| Storage Core | Own the portable wiki folder format, page IO, IDs, metadata, and migrations. | [storage-core.md](modules/storage-core.md) |
| Source Ingestion | Bring files, conversations, notes, and raw text into normalized source records. | [source-ingestion.md](modules/source-ingestion.md) |
| Wiki Compiler | Convert source records into structured wiki pages, claims, links, and provenance. | [wiki-compiler.md](modules/wiki-compiler.md) |
| Graph and Index | Maintain search indexes, backlinks, entity lookup, and graph traversal data. | [graph-index.md](modules/graph-index.md) |
| Retrieval Engine | Provide multi-step evidence gathering over search, reads, links, and citations. | [retrieval-engine.md](modules/retrieval-engine.md) |
| Memory Writeback | Promote answers, corrections, and summaries back into durable wiki pages. | [memory-writeback.md](modules/memory-writeback.md) |
| Error Book | Preserve retrieval failures, bad links, contradictions, stale claims, and fixes. | [error-book.md](modules/error-book.md) |
| Model Adapters | Let different LLMs perform extraction and synthesis without owning core data. | [model-adapters.md](modules/model-adapters.md) |
| Tool Surfaces | Expose the engine through local MCP, CLI, library APIs, and optional skills. | [tool-surfaces.md](modules/tool-surfaces.md) |
| Sync and Sharing | Support backup, sync, export, import, and optional shared local/team wikis. | [sync-sharing.md](modules/sync-sharing.md) |

## Extension Domains

Some product layers should compose the core engine rather than become part of the core memory substrate.

| Domain | Purpose | Plan |
| --- | --- | --- |
| Adaptive Learning Layer | Use the wiki as durable learning memory for Chloe, a personal tutor agent with a learning-engine MCP, scheduler, and optional Telegram connector. | [../learning/overview.md](../learning/overview.md) |

## First Vertical Slice

The first implementation should avoid building every module fully. Build a thin path through the whole loop:

1. `storage-core`: create a wiki workspace and read/write Markdown pages plus sidecar metadata.
2. `source-ingestion`: ingest local Markdown or plain text files into source records.
3. `wiki-compiler`: produce one page per source plus extracted links and claims.
4. `graph-index`: build a simple JSON index and backlinks file.
5. `retrieval-engine`: search text, read pages, follow backlinks/outlinks, return cited evidence.
6. `memory-writeback`: write one synthesis page after an answer.
7. `error-book`: write one correction/failure record.
8. `tool-surfaces`: expose the above through CLI first, then MCP.

## Build Order

Start with Storage Core before building an orchestration service. The orchestrator should compose stable local tools, not invent storage behavior itself.

Initial order:

1. Storage Core service: workspace init, page IO, metadata validation, workspace checks.
2. CLI parity: `wiki-llm init`, `wiki-llm check`, `wiki-llm new-page`.
3. Read-only retrieval primitives: list pages, read page, lexical search.
4. Orchestration service: coordinate ingest, compile, index, retrieve, writeback, and error-book flows.

## Data Folder Shape

The default local wiki should stay inspectable:

```text
.wiki-llm/
  config.json
  pages/
    entity/
    source/
    synthesis/
  sources/
    manifests/
    raw/
  indexes/
    text.json
    graph.json
    backlinks.json
  error-book/
    entries/
  runs/
    ingest/
    retrieval/
```

The exact paths can evolve, but the invariant is stable: user knowledge is ordinary files, while generated indexes are rebuildable.

## Shared Contracts

Every durable page should have sidecar metadata fields similar to this JSON object:

```json
{
  "id": "page_...",
  "type": "source | entity | synthesis | correction",
  "title": "Human Readable Title",
  "created_at": "2026-06-10T00:00:00Z",
  "updated_at": "2026-06-10T00:00:00Z",
  "sources": [
    {
      "source_id": "source_..."
    }
  ],
  "confidence": "high | medium | low | unknown",
  "status": "active | draft | stale | disputed",
  "links": [
    {
      "page_id": "page_..."
    }
  ]
}
```

Stored next to the Markdown page as `page-name.meta.json`.

The Markdown file keeps small Obsidian-friendly Properties frontmatter:

```markdown
---
id: page_...
type: synthesis
title: Human Readable Title
status: draft
confidence: medium
---

# Human Readable Title
```

Claims should be addressable and cite sources:

```json
{
  "id": "claim_...",
  "page_id": "page_...",
  "text": "The claim text.",
  "source_refs": ["source_...#span_..."],
  "confidence": "medium",
  "status": "active"
}
```

## Architectural Invariants

- Core memory operations must not require network access.
- Generated indexes must be rebuildable from wiki files and source manifests.
- Models may suggest structure, but the engine validates and stores it.
- Provenance and uncertainty are part of the data model, not commentary.
- MCP, CLI, and skills should call the same core library.
- A personal wiki is the default; shared wikis are an extension, not a requirement for the first release.

## Open Technical Questions

- How much model output should be accepted before validation and repair?
- How should shared wikis represent conflicts and authorship?
- How much metadata should be duplicated into Obsidian Properties versus kept only in `.meta.json`?
- Which optional parser plugins are worth supporting first after `.txt`, `.md`, and JSON conversation exports?
