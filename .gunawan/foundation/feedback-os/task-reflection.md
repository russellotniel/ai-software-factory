# Task Reflection

Every task — regardless of outcome — must produce a reflection entry upon completion.
Reflection is not optional. It is the mechanism by which agents mature.

## When to reflect
After every task, without exception.

## Reflection template

```
TASK REFLECTION
---------------
Date:               [YYYY-MM-DD]
Agent role:         [role]
Maturity level:     [level]
Task:               [one-line description]
Classification:     [discovery / design / implementation / review / debug / deployment]

Expected outcome:   [what was supposed to happen]
Actual outcome:     [what actually happened]
Result:             [success / partial / failure]

What went well:     [specific things that worked — be concrete]
What failed:        [specific things that did not work — be concrete]
Root cause:         [why it failed, or why it nearly failed]

Missing context:    [what information would have helped]
Assumption errors:  [which assumptions were wrong, if any]
Rule gaps:          [which foundation rule was missing, weak, or unclear]

Proposed improvement:
  Layer:   [human-intent-os / agent-foundation-os / role-os / design-os / build-os / feedback-os / project-knowledge]
  Change:  [what should be added, changed, or removed]
  Reason:  [why this would prevent the same outcome next time]
```

## Storage
- Successes and patterns → `knowledge/patterns/`
- Failures and root causes → `knowledge/postmortems/`
- Proposed improvements → `feedback-os/improvement-proposals.md` queue

## Rules
- Agents propose — they do not self-apply changes to foundation files
- If the reflection surfaces a learning gap, the agent requests guidance
  from the senior agent in its role — not from the developer
- Adult agents summarise reflection trends at standups
