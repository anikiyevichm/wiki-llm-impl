# Adaptive Learning Implementation Plan

## Goal

Build the learning layer in slices that preserve the core `wiki-llm` thesis: local-first, inspectable, evidence-backed, and agent-neutral.

This plan assumes `wiki-llm` Storage Core and basic CLI/MCP surfaces are being built in parallel. Early learning work can start with file-backed prototypes and migrate to the shared core library as it stabilizes.

## Phase 0: Documentation And Contracts

Status: planned.

Deliverables:

- Learning overview.
- Architecture boundaries.
- Data model.
- Learning Engine MCP tool contract.
- Chloe/Hermes orchestration notes.
- Scheduler and connector plan.

Acceptance:

- A developer can identify which component owns each responsibility.
- No required network dependency is introduced.
- The first demo path is explicit.

## Phase 1: File-Backed Learning State

Deliverables:

- Create learning folder structure in a wiki workspace.
- Create learner profile page.
- Create learning goal page.
- Create session page from a template.
- Create review queue JSON.
- Append learning events to JSONL.

Suggested commands:

```text
wiki-llm learning init
wiki-llm learning create-goal
wiki-llm learning start-session
wiki-llm learning close-session
wiki-llm learning due
```

Acceptance:

- A local workspace can hold goals, sessions, learner profile, and reviews as ordinary files.
- `wiki-llm check` or a learning-specific check validates required metadata.
- Generated files are readable in Markdown tools.

## Phase 2: Learning Engine Core

Deliverables:

- TypeScript DTOs for goals, sessions, activities, mastery, misconceptions, and reviews.
- Activity selector with deterministic first rules.
- Mastery updater with evidence refs.
- Review scheduler with simple interval policy.
- Writeback proposal generator.

Acceptance:

- Due reviews are selected before new material.
- Response results update concept mastery only with evidence.
- Review timing changes based on answer quality.
- Repeated errors create or update misconception records.
- Unit tests run offline.

## Phase 3: Learning Engine MCP

Deliverables:

- MCP server exposing learning tools.
- Schema validation for tool inputs and outputs.
- Read-only and write-enabled modes.
- Fixture workspace tests.

Initial tools:

- `learning_create_goal`
- `learning_start_session`
- `learning_get_next_activity`
- `learning_record_response`
- `learning_close_session`
- `learning_get_due_reviews`

Acceptance:

- An external agent can run a complete learning session through MCP calls.
- Tool outputs include wiki refs and evidence refs.
- Invalid state transitions are rejected.

## Phase 4: Chloe Agent Runtime Package

Deliverables:

- `agent-runtime/chloe/persona.md`
- `agent-runtime/chloe/teaching-policy.md`
- `agent-runtime/chloe/tool-routing.md`
- `agent-runtime/chloe/session-playbooks.md`
- Example Hermes configuration or adapter notes.

Acceptance:

- Chloe can start from a goal, ask the learning engine for an activity, conduct it, record the response, and close the session.
- Persona files affect tone, not durable truth.
- The same learning state can be used without Chloe.

## Phase 5: Scheduler

Deliverables:

- File-backed review queue.
- Due event selection.
- Event log.
- CLI command to list due events.
- Scheduler MCP tools.

Acceptance:

- Reviews can be scheduled, listed, completed, missed, and rescheduled.
- Missed events are auditable.
- Scheduler tests are deterministic with fixed timestamps.

## Phase 6: Telegram Connector

Deliverables:

- Optional Telegram connector package.
- Message receive/send functions.
- Quick reply buttons mapped to structured events.
- Quiet hours.
- Local config with secrets excluded from git.

Acceptance:

- Telegram can deliver a due review and receive a learner answer.
- Button callbacks become structured learning events.
- If Telegram is offline, due items remain in the local queue.

## Phase 7: Self-Improvement Loop

Deliverables:

- Teaching note writebacks.
- Weekly learning reflection synthesis.
- Strategy adaptation rules.
- Learner profile update proposals.
- Audit for stale or unsupported teaching assumptions.

Acceptance:

- The system can state what teaching strategy worked and cite sessions.
- The learner profile changes only with evidence or explicit human override.
- Repeated failed reviews alter future activity selection.
- Weekly reflection summarizes progress, weak concepts, and next focus.

## Phase 8: Quality And Safety

Deliverables:

- Tests around memory corruption, provenance, review scheduling, and misconception updates.
- Audit command for unsupported mastery or teaching notes.
- Exportable learning progress report.
- Optional manual review mode for profile changes.

Acceptance:

- No mastery update can be applied without evidence.
- Low-confidence generated teaching material is marked `needs verification`.
- Agent mistakes can be routed to the Error Book.
- Learning state can be backed up and restored from ordinary files.

## First Vertical Slice

Build this before the full product:

1. `wiki-llm learning init`
2. `wiki-llm learning create-goal`
3. `wiki-llm learning start-session`
4. Chloe or CLI runs one retrieval activity.
5. `wiki-llm learning record-response`
6. Mastery changes from `unknown` to `introduced` or `fragile`.
7. A session page is written.
8. A review item is scheduled.
9. `wiki-llm learning due` shows the future review.

This proves the loop without requiring Telegram or a full Hermes integration.

## Open Questions

- Should learning state live under `.wiki-llm/pages/learning/` or a top-level `learning/` folder in the personal wiki?
- Should Chloe be shipped as a skill first, a Hermes package first, or both?
- How strict should human review be for learner profile updates?
- Which concepts deserve separate pages versus sections on session pages?
- How should private learner state be separated from shareable knowledge pages?
