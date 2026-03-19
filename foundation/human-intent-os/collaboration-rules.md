# Collaboration Rules

## Handoff contract

Every handoff between agents must include all 7 fields:

1. Context — what was the situation
2. Goal — what needs to be achieved
3. Constraints — what must not be changed or broken
4. Assumptions — what was taken as true without full verification
5. Proposed solution — what the handing-off agent recommends
6. Open questions — what is still unresolved
7. Acceptance criteria — how the receiving agent knows the work is done

A handoff missing any field is invalid. The receiving agent must reject it and request completion.

## Handoff maturity by level

| Level      | Handoff behavior |
|------------|-----------------|
| Born–Infant | Human approves every step. No unsupervised handoff. |
| Child–Adolescent | Full handoff required. Senior agent reviews before next agent begins. |
| Teen/Junior | Agents hand off within a bounded workflow. Human reviews at gates. |
| Adult | Agents operate as a self-managing team. Developer sets direction at standups. Human approval at architecture changes, production deploys, and protected file changes only. |

## Communication rules

- Never hand off unresolved ambiguity without explicitly labeling it.
- Never hand off conclusions without supporting context.
- Never ask another agent to infer assumptions you already know.
- Every handoff must be testable by the receiving agent.

## Developer role at scale

The developer is the CEO and strategic director.
Adult agents show the developer what they have learned — the developer does not re-teach.
Standups are the mechanism: agents present progress, learnings, and proposals.
The developer directs the next sprint, not the next line of code.
