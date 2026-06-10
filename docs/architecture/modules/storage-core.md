# Storage Core Technical Plan

## Purpose

Own the portable wiki folder format. Storage Core is the lowest layer: it reads and writes pages, source manifests, indexes, run logs, and error entries without knowing which model or agent created them.

## Technology Choices

- TypeScript core module using Node `fs/promises`, `path`, `crypto`, temporary files, and atomic replace writes.
- Markdown files with JSON frontmatter for pages.
- JSON metadata for config, source manifests, run logs, and schema versioning.
- Generated SQLite/JSON indexes live outside durable page files and can be rebuilt.
- Rust can later replace low-level file and locking primitives behind the same TypeScript API.

## Responsibilities

- Initialize a `.wiki-llm/` workspace.
- Allocate stable IDs for pages, sources, claims, runs, and error entries.
- Read and write Markdown pages with structured frontmatter.
- Read and write JSON metadata files and generated indexes.
- Validate folder structure and required metadata fields.
- Provide migrations when the on-disk schema changes.
- Keep generated indexes separate from user-authored durable knowledge.

## Public Interfaces

- `init_workspace(path, options)`
- `load_workspace(path)`
- `write_page(page)`
- `read_page(page_id)`
- `list_pages(filter)`
- `write_source_manifest(source)`
- `write_error_entry(entry)`
- `write_index(name, data)`
- `validate_workspace()`
- `migrate_workspace(target_version)`

## Data Model

Core entities:

- `WorkspaceConfig`: schema version, wiki title, default language, privacy mode.
- `Page`: id, type, title, body, frontmatter, source refs, status.
- `SourceManifest`: id, origin, media type, checksum, raw path, extracted spans.
- `Claim`: id, page id, text, citations, confidence, status.
- `RunLog`: operation type, inputs, outputs, warnings, timestamps.

## Implementation Milestones

1. Define folder layout and schema version.
2. Implement workspace initialization.
3. Implement Markdown frontmatter parsing and writing.
4. Implement ID generation and checksum helpers.
5. Implement validation for required fields and broken local paths.
6. Implement schema migration skeleton.

## Tests

- Creates a workspace from scratch.
- Writes and reads a page without losing frontmatter.
- Rejects pages without required IDs or types.
- Rebuildable indexes are not treated as durable sources.
- Migration tests keep older fixture workspaces readable.

## Risks

- Loose frontmatter can silently corrupt memory. Use strict validation at write time.
- Generated files can be mistaken for user knowledge. Keep clear folder boundaries.
- File locking matters for concurrent agents. Start simple, then add lock files around writes.
