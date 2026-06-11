# Learning Engine MCP Technical Plan

## Purpose

The Learning Engine MCP owns pedagogical decisions and learning state. It decides what the learner should do next, records responses, updates mastery, schedules reviews, and emits writeback proposals for `wiki-llm`.

It should be usable by Chloe, a CLI, tests, or any other agent. It must not require Telegram, Hermes, or a hosted model provider.

## Responsibilities

- Create and maintain learning goals.
- Create adaptive curricula.
- Start and close learning sessions.
- Select the next activity based on goal, learner state, due reviews, and wiki evidence.
- Record learner responses and self-reported confidence.
- Update concept mastery and misconception state.
- Generate review items and scheduler requests.
- Produce writeback proposals for session notes, teaching notes, misconceptions, and concept updates.
- Keep an append-only event log.

## Non-Responsibilities

- Store raw source documents.
- Own the chat persona.
- Send Telegram messages.
- Execute cron jobs.
- Hide important state in prompts.
- Mutate wiki pages directly unless it is intentionally sharing the `wiki-llm` core library.

## MCP Tools

### `learning_create_goal`

Input:

```json
{
  "title": "Learn Rust for CLI tools",
  "target_outcome": "Build a local CLI and understand ownership well enough to debug it.",
  "time_horizon": "8 weeks",
  "constraints": ["30 minutes per weekday"],
  "prior_knowledge": "Some TypeScript, little Rust"
}
```

Output:

```json
{
  "goal_id": "goal_...",
  "created_pages": ["page_..."],
  "next_step": "diagnostic"
}
```

### `learning_start_session`

Input:

```json
{
  "goal_id": "goal_...",
  "mode": "diagnostic | lesson | review | exercise | reflection",
  "available_minutes": 30,
  "channel": "telegram"
}
```

Output:

```json
{
  "session_id": "session_...",
  "context_refs": ["page_..."],
  "recommended_opening": "Ask two diagnostic questions before teaching."
}
```

### `learning_get_next_activity`

Input:

```json
{
  "session_id": "session_...",
  "goal_id": "goal_...",
  "recent_context": "Learner partially recalled ownership rules.",
  "constraints": {
    "max_minutes": 10,
    "avoid": ["dense notation"]
  }
}
```

Output:

```json
{
  "activity_id": "activity_...",
  "type": "retrieval_prompt | socratic_question | explanation | exercise | reflection | transfer_task",
  "concept_refs": ["concept_..."],
  "prompt_seed": "Ask the learner to predict which variable is moved in a short Rust snippet.",
  "success_criteria": ["Identifies moved value", "Explains why borrow is invalid"],
  "hints": [
    {
      "level": 1,
      "text": "Look at which binding owns the value after assignment."
    }
  ],
  "writeback_policy": "record_response"
}
```

### `learning_record_response`

Input:

```json
{
  "session_id": "session_...",
  "activity_id": "activity_...",
  "response_text": "The second variable owns it now, so the first cannot be used.",
  "self_reported_confidence": 0.65,
  "hints_used": 0,
  "agent_assessment": {
    "result": "mostly_correct",
    "notes": "Understands move semantics in this example but did not mention Copy types."
  }
}
```

Output:

```json
{
  "state_changes": [
    {
      "concept_id": "concept_rust_ownership",
      "from": "introduced",
      "to": "fragile",
      "evidence_ref": "session_...#response_..."
    }
  ],
  "misconceptions": [],
  "reviews_to_schedule": [
    {
      "concept_id": "concept_rust_ownership",
      "due_at": "2026-06-13T18:00:00Z",
      "activity_type": "retrieval_prompt"
    }
  ],
  "writeback_proposal": {
    "kind": "learning_session_update",
    "target": "session_...",
    "summary": "Learner mostly recalled move semantics."
  }
}
```

### `learning_close_session`

Input:

```json
{
  "session_id": "session_...",
  "learner_reflection": "I get the move example but Copy types are still fuzzy.",
  "agent_teaching_notes": [
    "Concrete code prediction worked.",
    "Introduce Copy through contrast next time."
  ]
}
```

Output:

```json
{
  "session_page_id": "page_...",
  "writeback_proposals": [
    {
      "kind": "teaching_note",
      "status": "needs_review"
    }
  ],
  "next_due_at": "2026-06-13T18:00:00Z"
}
```

### `learning_get_due_reviews`

Input:

```json
{
  "as_of": "2026-06-13T18:00:00Z",
  "limit": 10,
  "goal_id": "goal_..."
}
```

Output:

```json
{
  "reviews": [
    {
      "review_id": "review_...",
      "concept_id": "concept_...",
      "priority": "normal",
      "reason": "fragile concept after partial recall"
    }
  ]
}
```

## Scheduling Policy

Version one can use simple rules:

- wrong or no recall: review in 1 day;
- partial recall: review in 2 days;
- correct with low confidence: review in 3 days;
- correct with high confidence: review in 7 days;
- repeated success: extend interval;
- missed review: keep priority high and reschedule soon.

Later versions can add a skill-level memory model, item difficulty, decay estimates, and per-concept forgetting curves.

## Tests

- Creates a goal and session files in a fixture workspace.
- Selects due review before new material.
- Records a response and updates mastery with evidence refs.
- Schedules future reviews from result quality.
- Creates misconception records for repeated errors.
- Refuses mastery updates without evidence or explicit human override.
- Runs without network access.
