# Agent Soul: wiki-llm-impl

## Project North Star

We are building an implementation of the LLM Wiki idea associated with Andrej Karpathy's 2026 wiki-memory direction: an agent should not treat knowledge as disposable prompt stuffing or flat RAG chunks. It should compile knowledge into a durable, inspectable, interlinked wiki that improves with use.

The project is a bet that tokens spent on understanding can become capital. Each useful ingest, answer, correction, and link should make future reasoning cheaper, more grounded, and easier to audit.

This is an open-source, local-first project. It should be installable on any personal computer and able to run without internet access. The intended shape is not a hosted service but a portable memory body: a local skill, local MCP server, CLI, or library that any agent and any LLM can use to create and maintain a local, personal, and optionally shared LLM wiki.

## What The Idea Means Here

The core pattern is:

- Documents and conversations become structured wiki pages, not anonymous embedding chunks.
- Pages link to each other bidirectionally so agents can traverse knowledge instead of only retrieving top-k snippets.
- Retrieval is a reasoning loop: search, read, follow links, decide whether evidence is sufficient, then answer.
- The wiki evolves: good answers can become synthesis pages, external findings can be written back into entity pages, and mistakes can be captured in an error book.
- The system must preserve provenance, uncertainty, contradictions, and corrections. A confident stale wiki is worse than a smaller honest one.

## Source Notes

- Karpathy's LLM Wiki paradigm is described by follow-on work as a 2026 proposal for persistent, structured knowledge layers that break the assumption that every task has independent context cost.
- "Knowledge Compounding" frames the economic point: INGEST can be amortized across many future retrievals, high-value answers can feed back into synthesis pages, and external search can be written back into entity pages.
- "Retrieval as Reasoning" gives an implementation-shaped formulation: compile documents into structured pages with bidirectional links, expose search/read/link-following tools, and keep an Error Book for semantic and structural self-correction.
- "Memory as Metabolism" emphasizes the personal/companion version: memory should mirror the user's working vocabulary and structure while compensating for epistemic failure modes such as entrenchment and suppressed contradictory evidence.

Reference URLs:

- https://arxiv.org/abs/2604.11243
- https://arxiv.org/abs/2605.25480
- https://arxiv.org/abs/2604.12034

## Product Shape

This repo should grow into a minimal but real LLM Wiki engine:

1. Ingest source material into wiki pages with stable identifiers.
2. Extract entities, claims, links, summaries, and provenance.
3. Provide agent tools for search, read, follow links, write, correct, and audit.
4. Keep an Error Book for failed retrievals, wrong links, stale claims, contradictions, and bad page structure.
5. Promote repeated useful answers into synthesis pages.
6. Measure knowledge compounding: future tasks should need less raw context and fewer repeated searches.

The system architecture is split into modules in [docs/architecture/overview.md](docs/architecture/overview.md):

- Storage Core
- Source Ingestion
- Wiki Compiler
- Graph and Index
- Retrieval Engine
- Memory Writeback
- Error Book
- Model Adapters
- Tool Surfaces
- Sync and Sharing

## Distribution Model

The project should spread as a small open-source tool people can own:

- Local-first package: installable on a laptop, workstation, or private server.
- Offline-capable runtime: no required internet calls during normal operation.
- Agent-neutral interface: usable from any coding agent, chat agent, local LLM, hosted LLM client, or automation runner.
- Skill/MCP body: expose the wiki as tools such as search, read, follow links, write page, write correction, ingest source, and audit memory.
- Portable wiki folder: the user's memory should live in ordinary files that can be backed up, synced, inspected, forked, or shared.
- Optional sharing: support a personal wiki by default, with a path toward shared local/team wikis without turning the project into a centralized service.
- Model-agnostic design: do not assume a single LLM provider. The engine owns structure and provenance; models provide reading, extraction, synthesis, and judgment.

## Non-Negotiable Design Principles

- Inspectability over magic. The wiki should be readable by a human without needing the model's hidden state.
- Structure over blobs. Prefer pages, sections, claims, links, citations, and corrections over opaque text dumps.
- Provenance by default. Every durable claim should know where it came from or admit that it is inferred.
- Corrections are first-class. The system should remember how it was wrong, not only what it thinks is right now.
- Retrieval is interactive. The agent should be able to traverse, compare, and stop when evidence is enough.
- Offline ownership over cloud dependency. The wiki must remain useful without network access and without a hosted account.
- Interoperability over lock-in. Any agent should be able to call the same local tools and read the same wiki files.
- Small core, sharp edges. Build the minimal engine that proves the loop before adding platform complexity.

## Current Implementation Bias

Start with a local-first, file-backed prototype unless the codebase clearly evolves elsewhere. Markdown pages plus machine-readable frontmatter are enough for the first version. A simple index can come before embeddings; graph links and provenance matter more than fancy retrieval on day one.

The first public distribution target should be a local MCP server plus a thin CLI. A skill wrapper can come with it so agents that understand skills can load the project as a body of behavior, while agents that understand MCP can call it as a tool server.

Good early directories:

- `wiki/` for generated and curated pages.
- `my-wiki/` for the local dogfood personal wiki. It is gitignored by design.
- `sources/` for ingested raw material or source manifests.
- `error-book/` for persistent mistakes and correction notes.
- `mcp/` for the local tool server surface.
- `skills/` for optional agent skill packaging.
- `cli/` for local install, ingest, inspect, and maintenance commands.
- `scripts/` for temporary workflow automation before the TypeScript CLI owns those commands.
- `src/` for the engine and agent tools.
- `tests/` for fixtures that prove ingest, linking, retrieval, and correction behavior.

## Agent Operating Rules

When working in this repo:

- Read this file and `README.md` first.
- Preserve the LLM Wiki thesis: durable structured memory, not just a chatbot with RAG.
- Prefer changes that make the system more inspectable and measurable.
- Keep the project installable and useful as a local open-source tool.
- Do not introduce required network dependencies into core memory operations.
- Treat `my-wiki/` as local personal memory: read it when useful for this workspace, but do not commit it.
- Prefer automating repeated manual steps in `scripts/` first, then migrate stable workflows into the CLI.
- Do not hide important knowledge only in prompts. If it matters later, write it into the wiki or docs.
- Track uncertainty explicitly. Use "unknown", "inferred", or "needs verification" rather than smoothing over gaps.
- Add tests around behavior that could silently corrupt memory, links, provenance, or correction history.
- Keep implementation choices boring until the core loop works end to end.

## First Milestone

The first convincing demo should answer a multi-hop question from a small corpus by:

1. Ingesting the corpus into linked wiki pages.
2. Searching for a starting page.
3. Reading and following links across at least two pages.
4. Producing an answer with citations.
5. Writing a useful synthesis page or correction back into the wiki.

If that loop works, the project has a soul and a pulse.
