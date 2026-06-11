# Adaptive Learning Architecture

## Goal

Build a local-first adaptive learning system on top of the LLM Wiki engine. The architecture should keep memory, pedagogy, scheduling, and chat connectors separate so each part can evolve without turning the core wiki into a monolithic bot.

## Components

| Component | Role | Owns Durable State |
| --- | --- | --- |
| Chloe agent | Conversational tutor, motivator, and orchestrator. | No, except optional persona files. |
| Hermes or agent runtime | Runs Chloe, routes messages, calls MCP tools. | Runtime config only. |
| `wiki-llm` MCP | Wiki memory, source evidence, page reads, page writes, links, retrieval, corrections. | Yes, wiki pages and metadata. |
| Learning Engine MCP | Goals, curricula, learner model, activity selection, mastery updates, review policy. | Yes, learning state files and logs. |
| Scheduler | Due events, review queue, check-ins, missed-session handling. | Yes, queue and event log. |
| Connectors | Telegram, desktop, CLI, email, calendar, or voice IO. | Minimal connector state. |

## Boundary Rules

- Chloe should not be the source of truth for memory. It should call tools.
- `wiki-llm` should not depend on Telegram, Hermes, or any hosted agent runtime.
- The learning engine should not store raw source documents. It should reference wiki pages, source refs, sessions, and concept IDs.
- The scheduler should wake the agent or emit events. It should not decide pedagogy.
- Connectors should translate messages and controls. They should not own learning state.
- Network connectors must be optional. Core memory and learning state must remain usable offline.

## Runtime Flow

### Interactive Session

```text
user message
  -> connector receives message
  -> Hermes routes to Chloe
  -> Chloe calls learning_get_next_activity
  -> learning engine reads learner state and relevant wiki refs
  -> Chloe calls wiki_read_page or wiki_retrieve_evidence as needed
  -> Chloe conducts activity
  -> Chloe calls learning_record_response
  -> learning engine returns state changes and writeback proposal
  -> Chloe calls wiki_write_page or wiki_write_correction
  -> Chloe calls scheduler_schedule_review
```

### Scheduled Review

```text
scheduler detects due item
  -> emits review_due event
  -> connector notifies user or wakes agent
  -> Chloe asks learning engine for review activity
  -> learner answers
  -> learning engine updates mastery and next review
  -> wiki records session and teaching notes
```

### Weekly Reflection

```text
scheduler emits weekly_reflection_due
  -> learning engine summarizes progress
  -> wiki-llm writes a weekly synthesis page
  -> Chloe asks the user to adjust goals or pace
```

## Data Ownership

Recommended folder shape inside a personal wiki workspace:

```text
.wiki-llm/
  pages/
    concept/
    synthesis/
    learning/
      goals/
      sessions/
      curricula/
      learner/
      misconceptions/
      reviews/
      teaching/
  indexes/
  runs/
    learning/
  schedules/
    review-queue.json
    events.jsonl
```

The exact paths can change when Storage Core matures, but the invariant is stable: user-readable Markdown pages plus sidecar metadata for machine state.

## Failure Handling

Learning failures are memory material:

- If Chloe gives a bad explanation, write an agent error entry.
- If the learner repeats a misunderstanding, promote it to a misconception page.
- If a review is missed, reschedule and record the missed event.
- If a mastery estimate disagrees with performance, mark the estimate as uncertain.
- If the system cannot cite a concept, mark the teaching material as inferred or needs verification.

## Architectural Invariants

- The system must be useful without network access, except optional connectors.
- Scheduled events must be inspectable and recoverable from files.
- Every durable learning claim should cite a session, source, page, or explicitly say it is inferred.
- Persona behavior should be configurable without changing memory schemas.
- A future desktop, CLI, or voice interface should be able to use the same learning state as Telegram.
