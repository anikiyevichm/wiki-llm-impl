# wiki-llm-impl

A minimal implementation inspired by Andrej Karpathy's LLM Wiki idea: compile knowledge into a durable, inspectable, interlinked wiki that an LLM agent can search, read, traverse, correct, and improve over time.

The project is designed to be open-source, local-first, and offline-capable: a portable wiki memory body that can run as a local MCP server, skill, CLI, or library for any agent and any LLM.

The core loop keeps raw sources immutable, lets agents maintain generated Markdown wiki pages, and records navigation through a simple index, append-only log, provenance, corrections, and synthesis writebacks.

Start with [AGENTS.md](AGENTS.md) for the project soul, source notes, and first milestone.

Architecture starts in [docs/architecture/overview.md](docs/architecture/overview.md), with technical plans for each module in [docs/architecture/modules/](docs/architecture/modules/).

Technology choices are documented in [docs/architecture/technology.md](docs/architecture/technology.md).

Adaptive learning agent plans live in [docs/learning/overview.md](docs/learning/overview.md). This layer describes Chloe on Hermes, a learning-engine MCP, scheduling, Telegram-style connectors, and the self-improving study loop built on top of the wiki memory engine.

Local dogfood automation starts in [docs/automation.md](docs/automation.md). The `my-wiki/` workspace is intentionally gitignored because it can contain personal memory.

Implementation starts with Storage Core and CLI parity: `wiki-llm init`, `wiki-llm check`, and `wiki-llm new-page`.

Local MCP setup is documented in [docs/mcp.md](docs/mcp.md).
