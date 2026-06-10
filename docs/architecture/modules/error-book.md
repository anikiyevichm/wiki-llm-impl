# Error Book Technical Plan

## Purpose

Make mistakes durable and useful. The Error Book stores failed retrievals, wrong links, stale claims, contradictions, bad citations, compiler errors, and user corrections so the system can repair itself over time.

## Technology Choices

- Markdown plus JSON frontmatter entries under `error-book/entries/`.
- JSON issue index generated from entries for filtering and reports.
- Error entries link to page IDs, claim IDs, source spans, and run IDs.
- Repair proposals reuse Memory Writeback proposal format.

## Responsibilities

- Record retrieval failures and missing evidence.
- Record user corrections and contradicted claims.
- Track broken links, stale pages, duplicate pages, and bad provenance.
- Connect error entries to affected pages, claims, and sources.
- Support repair tasks and status tracking.
- Feed high-value corrections back into Memory Writeback.

## Public Interfaces

- `write_error_entry(entry)`
- `list_errors(filter)`
- `read_error(error_id)`
- `mark_error_status(error_id, status)`
- `link_error_to_page(error_id, page_id)`
- `propose_repairs(error_id)`

## Data Model

`ErrorEntry`:

- `id`
- `type`: missing_evidence, wrong_answer, stale_claim, broken_link, contradiction, duplicate, bad_citation
- `description`
- `observed_during`: run id or user report
- `affected_refs`: pages, claims, sources, links
- `severity`: low, medium, high
- `status`: open, investigating, fixed, wont_fix
- `repair_refs`

## Implementation Milestones

1. Store manual error entries.
2. Automatically record retrieval misses.
3. Automatically record broken links from index health.
4. Link errors to pages and claims.
5. Add repair proposal generation.
6. Add reports for repeated failure patterns.

## Tests

- Writes and reads error entries.
- Links errors to affected pages.
- Retrieval miss creates an error entry when configured.
- Fixed errors reference concrete repairs.
- Error reports group recurring issue types.

## Risks

- Too many low-value entries create noise. Add severity and deduplication.
- Error entries must not replace actual page corrections. They are a repair queue and memory of failure.
- User corrections should be treated as high-signal but still tracked with context.
