# Adaptive Learning Layer

## Purpose

The Adaptive Learning Layer turns `wiki-llm-impl` into the memory substrate for a personal learning agent. The agent does not merely answer questions or deliver lessons. It studies with the user, records what worked, tracks what is fragile, schedules reviews, and writes durable learning memory back into the wiki.

The first named product shape is Chloe: a teaching agent that can run on an agent runtime such as Hermes, talk through Telegram or other channels, and use local MCP tools for memory, pedagogy, scheduling, and notifications.

## Product Thesis

Learning should compound the same way wiki knowledge compounds:

- each session should leave inspectable traces;
- concepts should become linked pages;
- repeated misunderstandings should become misconception pages;
- useful explanations should be preserved;
- teaching strategies should improve from evidence;
- review timing should be computed by tools rather than guessed in the prompt;
- the learner should own the memory folder locally.

The agent persona is not the memory. Chloe is the conversational interface and orchestrator. `wiki-llm` owns durable knowledge. A learning engine owns pedagogical state and next-step decisions. A scheduler owns due events and reminders. Connectors such as Telegram are replaceable IO surfaces.

## System Shape

```text
Telegram / chat / voice / desktop
        |
        v
Chloe agent on Hermes or another runtime
        |
        | calls local tools
        v
wiki-llm MCP            learning-engine MCP
memory, pages,          goals, sessions,
links, evidence,        mastery, reviews,
writeback               teaching strategy
        |
        v
scheduler and connector tools
review_due, check-ins, reminders
```

## Learning Loop

1. The user defines a goal.
2. The learning engine diagnoses the current state.
3. Chloe teaches through a small activity: explanation, Socratic question, exercise, recall prompt, comparison, or reflection.
4. The learner responds.
5. The learning engine records performance, confidence, hints used, misconceptions, and fatigue signals.
6. `wiki-llm` writes durable memory: concepts, session notes, errors, teaching notes, and links.
7. The scheduler creates future review events.
8. Later sessions begin by reading the relevant learner state and past evidence.

## Evidence-Based Techniques To Encode

The layer should prefer techniques with strong learning-science support:

- retrieval practice: ask the learner to recall before re-explaining;
- distributed practice: schedule repeated sessions across time;
- interleaving: mix related problem types when the learner is ready;
- self-explanation: ask the learner to explain why a step works;
- elaborative interrogation: ask "why is this true" and "when would it fail";
- desirable difficulty: keep tasks effortful but not demoralizing;
- metacognitive reflection: ask the learner to rate confidence and name uncertainty;
- adaptive feedback: use hints and explanations based on the learner response;
- transfer practice: test whether the learner can use a concept in a new context.

The system should also guard against known failure modes:

- passive reading disguised as learning;
- overreliance on the assistant;
- shallow hint chasing;
- unverified agent explanations;
- repeated failures that are not promoted into durable correction material;
- stale mastery estimates.

## Documents

- [architecture.md](architecture.md): component boundaries and runtime flow.
- [data-model.md](data-model.md): learning pages, metadata, event records, and state files.
- [learning-engine-mcp.md](learning-engine-mcp.md): tool contract for pedagogical decisions.
- [chloe-hermes-agent.md](chloe-hermes-agent.md): agent orchestration and persona boundaries.
- [scheduler-and-connectors.md](scheduler-and-connectors.md): cron, review events, Telegram, and notifications.
- [implementation-plan.md](implementation-plan.md): phased technical plan.

## First Demo

The first convincing learning demo should:

1. Create a learning goal.
2. Run a short diagnostic session.
3. Teach one concept through retrieval or Socratic questioning.
4. Record the learner answer and mastery update.
5. Write a session page, concept update, misconception note, and teaching note into the wiki.
6. Schedule a future review.
7. Resume later and adapt the next activity from the stored learning memory.
