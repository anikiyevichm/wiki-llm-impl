# Model Adapters Technical Plan

## Purpose

Let different LLMs help with extraction, synthesis, retrieval planning, and repair without coupling the engine to one provider. The core must remain offline-capable; adapters are optional execution backends.

## Technology Choices

- TypeScript interfaces for model tasks.
- Deterministic stub adapter for tests and offline demos.
- Local subprocess adapter for tools such as local LLM CLIs.
- Optional provider adapters behind package extras; no provider dependency in core.

## Responsibilities

- Define model-neutral tasks: extract claims, summarize source, propose links, plan retrieval, synthesize answer, propose repair.
- Support local models and hosted models through the same interface.
- Record model metadata needed for reproducibility.
- Validate structured outputs before they reach Storage Core.
- Allow deterministic no-model fallbacks for core demos and tests.

## Public Interfaces

- `run_task(task_name, input, options)`
- `extract_claims(input, options)`
- `summarize(input, options)`
- `propose_links(input, options)`
- `plan_retrieval(input, options)`
- `synthesize(input, options)`
- `validate_model_output(schema, output)`

## Data Model

`ModelRun`:

- `id`
- `task_name`
- `adapter_name`
- `model_name`
- `input_refs`
- `output`
- `validation_status`
- `warnings`
- `created_at`

## Implementation Milestones

1. Define task schemas and adapter interface.
2. Implement deterministic stub adapter for tests.
3. Implement local command adapter for local LLM tools.
4. Add optional hosted adapter without making it a core dependency.
5. Add structured output validation and repair.
6. Add model run logging without storing hidden chain-of-thought.

## Tests

- Stub adapter returns valid fixtures.
- Invalid structured output is rejected.
- Core tests pass without network access.
- Hosted adapters can be disabled entirely.
- Model metadata is logged for audit.

## Risks

- Provider-specific features can leak into core. Keep adapters at the boundary.
- Hidden reasoning should not be stored. Store inputs, final structured outputs, warnings, and citations.
- Offline mode must be testable in CI.
