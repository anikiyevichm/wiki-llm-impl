# Scheduler And Connectors Technical Plan

## Purpose

The scheduler and connectors make the learning system show up at the right time in the right place. They should remain replaceable shells around the local learning state.

The scheduler owns due events. Connectors deliver messages and collect responses. Neither should own pedagogy or durable wiki knowledge.

## Scheduler Responsibilities

- Store review queue and event log.
- Emit due events such as `review_due` and `weekly_reflection_due`.
- Reschedule missed reviews.
- Support quiet hours and user availability.
- Wake the agent runtime or notify through a connector.
- Keep enough local state to recover after restart.

## Scheduler Non-Responsibilities

- Decide what teaching technique to use.
- Store lesson content.
- Rewrite wiki pages.
- Depend on one specific connector.

## Event Types

- `review_due`
- `goal_checkin_due`
- `weekly_reflection_due`
- `stale_topic_detected`
- `missed_review`
- `new_source_ready_for_learning`
- `misconception_followup_due`

## Queue File

Recommended path:

```text
.wiki-llm/schedules/review-queue.json
```

Example:

```json
{
  "version": 1,
  "items": [
    {
      "id": "review_...",
      "goal_id": "goal_...",
      "concept_id": "concept_...",
      "due_at": "2026-06-13T18:00:00Z",
      "priority": "normal",
      "activity_type": "retrieval_prompt",
      "status": "scheduled",
      "reason": "partial recall in session_..."
    }
  ]
}
```

## Event Log

Recommended path:

```text
.wiki-llm/schedules/events.jsonl
```

Events should be append-only so missed or duplicated notifications can be audited.

## MCP Tools

### `scheduler_schedule_review`

Creates or updates a review item.

### `scheduler_get_due_events`

Returns events due as of a timestamp.

### `scheduler_mark_sent`

Marks that an event was handed to a connector.

### `scheduler_mark_completed`

Marks that a review or check-in was completed.

### `scheduler_reschedule`

Moves an event with a reason.

## Telegram Connector

The Telegram connector should be optional. It can make the first real experience pleasant, but the learning system must still run through CLI or desktop without it.

Responsibilities:

- receive messages;
- send messages;
- send quick reply buttons;
- map button callbacks to structured events;
- identify the local learner profile;
- respect quiet hours and notification settings.

Non-responsibilities:

- decide mastery;
- store full learning history;
- mutate wiki pages directly.

## Telegram Button Events

Useful callback values:

- `confidence:low`
- `confidence:medium`
- `confidence:high`
- `difficulty:easy`
- `difficulty:good`
- `difficulty:hard`
- `action:hint`
- `action:explain_differently`
- `action:skip`
- `action:review_later`
- `action:save_insight`
- `action:show_sources`

These should become structured inputs to Chloe or the Learning Engine MCP.

## Offline Behavior

When network connectors are unavailable:

- reviews remain in the queue;
- CLI can list due reviews;
- local desktop can continue sessions;
- missed connector sends are logged;
- no core state is lost.

## Implementation Milestones

1. File-backed review queue.
2. CLI command to list due reviews.
3. Scheduler MCP tools.
4. Local wake loop or cron-compatible command.
5. Telegram connector proof of concept.
6. Quiet hours and missed-review policy.
7. Connector-neutral notification API.

## Tests

- Due event selection is deterministic.
- Missed events are not lost.
- Completed reviews are not re-sent.
- Rescheduling records a reason.
- Telegram callback payloads map to valid structured events.
- Core scheduler tests run without network access.
