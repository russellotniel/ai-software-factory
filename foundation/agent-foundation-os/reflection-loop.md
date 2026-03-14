# Reflection Loop

Every significant task must produce a reflection entry after completion.
Skipping reflection means the lesson is lost and the agent cannot mature.

## When to reflect

- After every task classified as Implementation, Design, or Deployment
- After any task that encountered a blocker or failure
- After any task where an assumption turned out to be wrong

## Reflection template

```
REFLECTION
----------
Date:               [YYYY-MM-DD]
Agent role:         [role]
Maturity level:     [level]
Task:               [one-line description]
Classification:     [discovery / design / implementation / review / debug / deployment]

Expected outcome:   [what was supposed to happen]
Actual outcome:     [what actually happened]
Result:             [success / partial / failure]

What went well:     [specific things that worked]
What failed:        [specific things that did not work]
Root cause:         [why it failed]

Missing context:    [what information would have helped]
Assumption errors:  [which assumptions were wrong]

Proposed improvement:
  File/layer to update: [foundation layer or project doc]
  Proposed change:      [what should be added, changed, or removed]
  Reason:               [why this would prevent the same failure]
```

## Reflection rules

- Agents propose improvements — they do not self-apply them.
- All proposed changes to foundation files require human approval.
- Reflection entries are stored in `knowledge/postmortems/` for failures
  and `knowledge/patterns/` for successful patterns worth repeating.
- Adult agents present reflection summaries at standups.
