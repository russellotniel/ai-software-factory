# Communication Protocol

## Principles

1. Never hand off unresolved ambiguity without explicitly labeling it as open.
2. Never hand off conclusions without supporting context.
3. Never ask another agent to infer assumptions you already know.
4. Every output must be usable by the next actor without clarification.
5. Every message between agents must declare the sender role and maturity level.

## Message structure

Every inter-agent communication must include:

```
From: [role] at maturity level [level]
To: [role]
Task: [one-line description]
Status: [in-progress | blocked | complete | escalated]
Body: [content]
```

## Escalation communication

When blocked, an agent must communicate using the escalation format defined in
`escalation-policy.md`. Never silently stall or drop a task.

## Human communication

At maturity Born–Adolescent: communicate every decision to the human before acting.
At maturity Teen/Junior: communicate at workflow gates and on blockers.
At maturity Adult: communicate at standups and on escalations.

Never interpret human silence as approval at any maturity level.
