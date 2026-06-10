# Wiki Compiler Technical Plan

## Purpose

Transform source records into wiki pages, claims, links, summaries, and provenance. The compiler is where raw material becomes inspectable knowledge.

## Technology Choices

- Deterministic TypeScript compiler first: source page creation, heading extraction, simple link detection.
- Adapter-based LLM extraction for claims, summaries, entities, and link proposals.
- JSON schemas for compiler output, validated before Storage Core writes anything.
- Repair pass for malformed model output instead of trusting raw completions.

## Responsibilities

- Create draft pages from source records.
- Extract candidate entities, topics, claims, and relationships.
- Assign page types: source, entity, synthesis, correction.
- Attach citations to every durable claim.
- Detect uncertainty, contradictions, and missing provenance.
- Propose links between pages and claims.
- Emit structured compiler output that Storage Core can validate before writing.

## Public Interfaces

- `compile_source(source_id, options)`
- `compile_sources(source_ids, options)`
- `extract_claims(source_id)`
- `extract_links(page_draft)`
- `validate_compilation(compilation)`
- `write_compilation(compilation)`

## Data Model

Compiler output:

- `page_drafts`: pages with frontmatter, body, source refs.
- `claims`: addressable claim records.
- `links`: typed links between pages or claims.
- `warnings`: uncertainty, weak citations, duplicate pages, contradictions.
- `model_trace`: optional prompt/model metadata without hidden chain-of-thought.

## Implementation Milestones

1. Build a deterministic no-model compiler for source pages.
2. Add simple heading/entity extraction with local heuristics.
3. Add model-assisted claim extraction behind an adapter interface.
4. Add link proposals and backlink generation.
5. Add contradiction warnings and disputed status.
6. Add compiler repair pass for invalid model outputs.

## Tests

- Compiles one source into a readable source page.
- Extracts citations that point to valid source spans.
- Rejects claims without provenance.
- Produces stable output for deterministic mode.
- Records warnings for ambiguous or unsupported claims.

## Risks

- Model output can be fluent but structurally invalid. Validate everything before storage.
- Extraction quality should improve without changing the storage contract.
- Duplicate entity pages can fragment memory. Add merge suggestions early.
