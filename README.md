# wiki-llm-impl

A minimal implementation of the LLM Wiki idea: compile knowledge into a durable, inspectable, interlinked wiki that an LLM agent can search, read, traverse, correct, and improve over time.

The project is designed to be open-source, local-first, and offline-capable: a portable wiki memory body that can run as a local MCP server, skill, CLI, or library for any agent and any LLM.

Start with [AGENTS.md](AGENTS.md) for the project soul, source notes, and first milestone.

Architecture starts in [docs/architecture/overview.md](docs/architecture/overview.md), with technical plans for each module in [docs/architecture/modules/](docs/architecture/modules/).

Technology choices are documented in [docs/architecture/technology.md](docs/architecture/technology.md).

Local dogfood automation starts in [docs/automation.md](docs/automation.md). The `my-wiki/` workspace is intentionally gitignored because it can contain personal memory.
