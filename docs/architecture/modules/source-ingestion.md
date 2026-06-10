# Source Ingestion Technical Plan

## Purpose

Normalize local inputs into source records that the wiki compiler can process. Ingestion does not decide long-term wiki structure; it preserves raw evidence and records enough provenance to make later claims auditable.

## Technology Choices

- TypeScript ingestion for `.txt`, `.md`, and JSON conversation exports.
- Checksums through Node `crypto.createHash("sha256")`.
- Line-based spans for text formats in version one.
- Optional parser plugin interface for PDF, docx, HTML, browser exports, and chat exports.
- Rust parser modules are later options for large files or strict formats.

## Responsibilities

- Ingest local files, pasted text, conversation exports, and directories.
- Copy or reference raw source material according to workspace policy.
- Split sources into stable spans for citation.
- Compute checksums and detect duplicate inputs.
- Record origin, import time, media type, parser warnings, and privacy flags.
- Avoid network access in core ingestion.

## Public Interfaces

- `ingest_file(path, options)`
- `ingest_directory(path, options)`
- `ingest_text(text, metadata)`
- `ingest_conversation(messages, metadata)`
- `list_sources(filter)`
- `read_source(source_id)`
- `get_source_span(source_id, span_id)`

## Data Model

`SourceManifest` fields:

- `id`
- `origin`
- `origin_type`: file, text, conversation, generated
- `media_type`
- `checksum`
- `raw_path`
- `created_at`
- `spans`: id, byte range or line range, text preview
- `privacy`: personal, shared, sensitive
- `parser_warnings`

## Implementation Milestones

1. Support `.md` and `.txt` files.
2. Add deterministic line-based spans.
3. Add duplicate detection by checksum.
4. Add directory ingestion with ignore rules.
5. Add conversation ingestion format.
6. Add parser plugin interface for future PDFs, docs, and web exports.

## Tests

- Ingests text and files into source manifests.
- Produces stable span IDs across repeated runs.
- Detects duplicate content.
- Preserves raw source text.
- Does not require network access.

## Risks

- Over-splitting loses context; under-splitting weakens citations.
- Conversation imports can contain private data. Preserve privacy labels and avoid accidental exports.
- Parser plugins should not pollute the core with heavy dependencies.
