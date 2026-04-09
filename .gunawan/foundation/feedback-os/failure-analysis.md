# Failure Analysis

Every failure must be categorised, root-caused, and logged.
Uncategorised failures cannot be learned from.

## Failure categories

| Category | Description |
|----------|-------------|
| Requirement misunderstanding | Spec was unclear or misread |
| Architecture flaw | Design decision caused the failure |
| Implementation error | Code did not match the design |
| Missing tests | Failure was not caught before shipping |
| Security oversight | A security control was missing or bypassed |
| Performance regression | A change degraded system performance |
| Dependency misconfiguration | A third-party service or package caused the failure |
| Context gap | Required foundation or project knowledge was missing |
| Maturity violation | Agent acted above its current maturity level |

## Failure log template

```
FAILURE LOG
-----------
Date:           [YYYY-MM-DD]
Agent role:     [role]
Maturity level: [level]
Task:           [one-line description]

Failure:        [what went wrong]
Category:       [from categories above]
Root cause:     [specific reason — not "human error", be precise]
Impact:         [what was affected — code, data, timeline, another agent]

Fix applied:    [what was done to resolve it]
Prevention:     [what rule, check, or process would prevent recurrence]

Proposed update:
  Layer:  [which foundation layer needs updating]
  Change: [what specifically should change]
```

## Escalation rule
Failures classified as Security oversight or Maturity violation
must be escalated to the human immediately, regardless of agent level.
All other failures are handled within the agent team.
