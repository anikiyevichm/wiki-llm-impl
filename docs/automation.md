# Automation Notes

The project should automate every repeated wiki step as it becomes clear. The first scripts are intentionally small and local:

- `scripts/init-my-wiki.ps1`: create the local `my-wiki/` folder structure.
- `scripts/new-wiki-page.ps1`: create a Markdown page with metadata.
- `scripts/check-wiki.ps1`: validate required page metadata fields.

These scripts are a bridge to the future TypeScript CLI. Once Storage Core exists, the Node CLI should replace script internals while preserving the same workflow:

```powershell
.\scripts\init-my-wiki.ps1
.\scripts\new-wiki-page.ps1 -Title "New Topic" -Type synthesis
.\scripts\check-wiki.ps1
```

`my-wiki/` is intentionally ignored by Git. It is a local dogfood workspace and may contain personal memory.

## Dogfood Findings

Creating and updating `Mikita Working Style` through the CLI showed the next automation gaps:

- `wiki-llm link-page`: add links to `.meta.json` and optionally add Obsidian `[[Wiki Links]]` in Markdown.
- `wiki-llm writeback`: create or update a page from an evidence packet and record a run log.
- `wiki-llm backlinks`: rebuild backlinks from `.meta.json` links and Obsidian-style Markdown links.

Completed:

- `wiki-llm append-section`: append or replace a named Markdown section and update `updated_at`.
- `wiki-llm link-page`: add a machine link to `.meta.json`, update `updated_at`, and add an Obsidian `[[Wiki Link]]` when it is not already present.
- `wiki-llm seed-project`: create or update a non-work project seed page, add standard sections, and link it from owner/task pages without duplicate links.
- `wiki-llm add-source-ref`: attach a source reference to an existing page without duplicate refs.
- `wiki-llm-mcp`: local MCP server exposing wiki memory tools to Codex and other MCP clients.
- `wiki_list_pages`, `wiki_read_page`, and `wiki_search`: MCP/CLI read tools that let an external agent decide where memory belongs before calling `wiki_remember`.

The next useful CLI command is probably `record-research-source`, followed by `backlinks`. Those two would remove most remaining manual source-manifest and graph-maintenance edits from the research flow.

Dogfood also showed a reliability need:

- avoid parallel writes to the same page until Storage Core has file locks;
- add a batch mode for operations such as linking several pages from one source page;
- make CLI commands report workspace-relative paths consistently.
