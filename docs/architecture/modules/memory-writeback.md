# Memory Writeback Technical Plan

## Purpose

Convert useful agent work back into durable wiki memory. Writeback is how the wiki compounds: repeated answers become synthesis pages, corrections update old pages, and new links make future retrieval cheaper.

## Technology Choices

- JSON writeback proposals with explicit evidence refs.
- Markdown page writer from Storage Core for synthesis pages and updates.
- Append-first update policy for version one.
- Optional patch/diff review UI later.

## Responsibilities

- Create synthesis pages from answered questions.
- Update existing pages with new claims, sections, links, and citations.
- Record why a writeback happened and which evidence supported it.
- Preserve previous page versions or diffs.
- Route uncertain or disputed material to draft status.
- Avoid overwriting user-authored knowledge without traceability.

## Public Interfaces

- `propose_writeback(answer, evidence, options)`
- `write_synthesis_page(proposal)`
- `apply_page_update(page_id, patch)`
- `add_claim(page_id, claim)`
- `add_link(from_id, to_id, link_type)`
- `review_writeback(proposal)`

## Data Model

`WritebackProposal`:

- `id`
- `kind`: synthesis, page_update, correction, link_addition
- `target_page_id`
- `body_patch`
- `claims`
- `evidence_refs`
- `confidence`
- `review_status`: auto_applied, needs_review, rejected

## Implementation Milestones

1. Write synthesis pages from evidence packets.
2. Add append-only page updates with citations.
3. Add link writeback.
4. Add proposal review mode.
5. Add version/diff metadata.
6. Add policies for auto-apply versus manual review.

## Tests

- Creates synthesis page with citations.
- Refuses writeback without evidence refs.
- Keeps old page content recoverable.
- Marks low-confidence updates as draft or needs-review.
- Updates indexes after successful writeback.

## Risks

- Bad writeback can poison memory. Default to cited, reviewable, reversible writes.
- Agents may over-promote one-off answers. Require evidence and useful title/summary.
- Conflict handling will matter once shared wikis exist.
