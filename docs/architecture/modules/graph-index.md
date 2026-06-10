# Graph and Index Technical Plan

## Purpose

Make wiki memory navigable. This module maintains local search indexes, page graph data, backlinks, entity lookup, and traversal helpers. Indexes are generated artifacts and must be rebuildable from durable files.

## Technology Choices

- SQLite FTS5 as the first serious local search index.
- JSON graph/backlink files as a transparent fallback and debugging artifact.
- Node SQLite access through a small adapter package, with JSON lexical fallback for zero-database mode.
- Optional later indexes for embeddings, Tantivy, or faster Rust graph search must remain rebuildable.

## Responsibilities

- Build text search index over page titles, body, aliases, claims, and source refs.
- Build graph index from links and citations.
- Maintain backlinks and orphan-page reports.
- Provide entity/title lookup and duplicate candidates.
- Rebuild indexes from scratch.
- Support incremental updates after page writes.

## Public Interfaces

- `rebuild_indexes()`
- `update_indexes(changed_ids)`
- `search(query, options)`
- `get_backlinks(page_id)`
- `get_outlinks(page_id)`
- `neighbors(page_id, depth)`
- `find_duplicates(page_id)`
- `index_health()`

## Data Model

Generated index files:

- `text.json`: lexical terms, titles, aliases, snippets.
- `graph.json`: nodes, edges, edge types.
- `backlinks.json`: page id to referring page ids.
- `entities.json`: normalized names, aliases, page ids.

## Implementation Milestones

1. Build JSON indexes from Markdown pages.
2. Implement simple lexical search with scoring.
3. Implement backlinks and outlinks.
4. Add graph traversal by depth and edge type.
5. Add index health checks for broken links and orphan pages.
6. Evaluate SQLite FTS or another local index when JSON becomes limiting.

## Tests

- Rebuild indexes from fixtures.
- Search returns expected pages.
- Backlinks match page links.
- Broken links are reported.
- Deleting generated indexes and rebuilding gives equivalent results.

## Risks

- Stale indexes can mislead agents. Track index timestamps and source page revisions.
- Search quality may be weak before embeddings. The first goal is correctness and inspectability.
- Large wikis may outgrow JSON. Keep index API stable so storage can change later.
