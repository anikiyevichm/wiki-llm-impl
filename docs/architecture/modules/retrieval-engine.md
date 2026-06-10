# Retrieval Engine Technical Plan

## Purpose

Turn wiki access into an evidence-gathering loop. Retrieval is not just top-k search; it should search, read, follow links, compare evidence, and stop with cited material that an agent can use.

## Technology Choices

- TypeScript service layer that composes Storage Core and Graph/Index functions.
- Deterministic search-read-follow retrieval planner for first demos.
- Optional Model Adapter planner for harder questions.
- JSON run logs and evidence packets for every retrieval.

## Responsibilities

- Run multi-step retrieval plans over local wiki tools.
- Search by query, page type, entity, source, and status.
- Read page sections and claims with citations.
- Follow outlinks and backlinks.
- Assemble evidence packets with provenance and uncertainty.
- Record retrieval run logs for audit and future improvement.

## Public Interfaces

- `retrieve(question, options)`
- `search_pages(query, options)`
- `read_page(page_id, options)`
- `follow_links(page_id, options)`
- `assemble_evidence(items)`
- `explain_retrieval(run_id)`

## Data Model

`EvidencePacket`:

- `question`
- `items`: page refs, claim refs, source span refs, snippets
- `coverage`: direct, partial, weak, missing
- `uncertainties`
- `contradictions`
- `suggested_next_steps`
- `citations`

## Implementation Milestones

1. Implement search-read-follow as explicit local functions.
2. Add a deterministic retrieval planner for simple questions.
3. Add model-assisted planning through Model Adapters.
4. Add evidence sufficiency checks.
5. Add retrieval run logs.
6. Add failure handoff to Error Book.

## Tests

- Answers retrieval fixtures with expected evidence pages.
- Follows links across at least two pages.
- Preserves citations in evidence packets.
- Marks missing evidence instead of inventing support.
- Writes run logs for audit.

## Risks

- Retrieval can become opaque if planning is only model-driven. Keep tool calls and evidence packets explicit.
- The engine should not produce final answers by itself unless called as an agent helper; its core output is evidence.
- Missing evidence must be a valid outcome.
