# Adaptive Learning Data Model

## Purpose

Define the durable records needed for personal learning: goals, curricula, sessions, concept mastery, misconceptions, teaching notes, reviews, and event logs.

The model should stay readable in Markdown while preserving enough structured metadata for tools to select activities, schedule reviews, and audit progress.

## Core Types

### Learning Goal

Represents an outcome the learner wants to reach.

Markdown path:

```text
pages/learning/goals/<goal-slug>.md
pages/learning/goals/<goal-slug>.meta.json
```

Metadata:

```json
{
  "id": "goal_...",
  "type": "learning_goal",
  "title": "Learn Rust for CLI tools",
  "status": "active",
  "created_at": "2026-06-11T00:00:00Z",
  "target_outcome": "Build and explain a useful local CLI in Rust.",
  "time_horizon": "8 weeks",
  "related_pages": ["page_..."],
  "active_curriculum_id": "curriculum_...",
  "confidence": "medium"
}
```

Markdown sections:

- `# Goal`
- `## Why This Matters`
- `## Target Outcome`
- `## Current State`
- `## Constraints`
- `## Linked Concepts`
- `## Progress Log`

### Curriculum

Represents a plan that can change as evidence accumulates.

Metadata fields:

- `id`
- `type`: `learning_curriculum`
- `goal_id`
- `status`: `draft | active | paused | completed | retired`
- `modules`
- `prerequisites`
- `review_policy`
- `adaptation_notes`

Each module should reference concept pages where possible.

### Learning Session

Append-only record of a study interaction.

Metadata:

```json
{
  "id": "session_...",
  "type": "learning_session",
  "goal_id": "goal_...",
  "started_at": "2026-06-11T18:00:00Z",
  "ended_at": "2026-06-11T18:35:00Z",
  "mode": "diagnostic | lesson | review | exercise | reflection",
  "concept_refs": ["concept_..."],
  "activity_ids": ["activity_..."],
  "outcomes": [
    {
      "concept_id": "concept_...",
      "from": "introduced",
      "to": "fragile",
      "evidence": "response_..."
    }
  ]
}
```

Markdown sections:

- `# Learning Session`
- `## Goal`
- `## Activities`
- `## Learner Responses`
- `## Misconceptions`
- `## State Changes`
- `## Teaching Notes`
- `## Next Review`

### Learner Profile

Represents stable preferences, strengths, failure modes, and teaching policies.

Recommended path:

```text
pages/learning/learner/profile.md
pages/learning/learner/profile.meta.json
```

Sections:

- `# Learner Profile`
- `## Current Goals`
- `## Preferred Learning Patterns`
- `## Strong Techniques`
- `## Known Failure Modes`
- `## Motivation Notes`
- `## Review Policy`
- `## Human Preferences`

This page should be updated cautiously. It can easily become stale or overfit. Prefer evidence-backed notes with session refs.

### Concept Mastery

Can be represented as sections in concept pages or as separate machine state.

Allowed states:

- `unknown`
- `introduced`
- `fragile`
- `usable`
- `strong`
- `stale`
- `disputed`

Example metadata entry:

```json
{
  "concept_id": "concept_backpropagation",
  "state": "fragile",
  "last_practiced_at": "2026-06-11T18:20:00Z",
  "last_result": "partial_recall",
  "confidence_self_report": 0.45,
  "confidence_system": 0.55,
  "evidence_refs": ["session_...#response_..."],
  "next_review_at": "2026-06-13T18:00:00Z"
}
```

### Misconception

Represents a recurring or important misunderstanding.

Metadata:

- `id`
- `type`: `learning_misconception`
- `status`: `active | improving | resolved | needs_review`
- `concept_refs`
- `first_seen_session_id`
- `last_seen_session_id`
- `evidence_refs`
- `correction_page_id`

Markdown sections:

- `# Misconception`
- `## Observed Pattern`
- `## Evidence`
- `## Corrective Explanation`
- `## Practice Plan`
- `## Resolution Criteria`

### Teaching Note

Represents what worked or failed in the delivery.

Metadata:

- `id`
- `type`: `teaching_note`
- `scope`: `global | goal | concept | session`
- `worked`
- `did_not_work`
- `next_time`
- `evidence_refs`

Teaching notes should not be hidden in prompts. If they matter for future sessions, write them into the wiki.

### Review Item

Machine-readable scheduled practice item.

```json
{
  "id": "review_...",
  "concept_id": "concept_...",
  "goal_id": "goal_...",
  "due_at": "2026-06-13T18:00:00Z",
  "priority": "normal",
  "activity_type": "retrieval_prompt",
  "reason": "fragile concept after partial recall",
  "attempt_count": 0,
  "status": "scheduled"
}
```

## Event Log

Use JSON Lines for append-only learning events:

```text
runs/learning/events.jsonl
```

Event types:

- `goal_created`
- `session_started`
- `activity_started`
- `response_recorded`
- `mastery_updated`
- `review_scheduled`
- `review_completed`
- `review_missed`
- `misconception_created`
- `teaching_note_added`
- `weekly_reflection_written`

## Provenance Rules

- A mastery update must reference a learner response, review result, exercise result, or human override.
- A teaching preference must reference at least one session or be marked `inferred`.
- A misconception must include evidence text or a session ref.
- A curriculum change should include a reason.
- A generated explanation can be stored, but it must be marked as generated unless backed by a source page.
