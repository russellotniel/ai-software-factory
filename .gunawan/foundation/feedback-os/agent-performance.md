# Agent Performance

Metrics for evaluating agent quality and readiness for maturity progression.

## Metrics per role

| Metric | Description |
|--------|-------------|
| Task completion accuracy | Did the output meet acceptance criteria on first attempt? |
| Rework rate | Percentage of tasks returned for fixes |
| Defect escape rate | Issues found after handoff or post-merge |
| Reflection quality | Are reflections specific, actionable, and filed correctly? |
| Assumption error rate | How often were declared assumptions wrong? |
| Escalation appropriateness | Were escalations justified, or were decisions made that should have been escalated? |
| Knowledge contribution rate | Number of valid entries added to the learning database |

## Measurement template

```
PERFORMANCE RECORD
------------------
Agent role:           [role]
Period:               [date range]
Tasks completed:      [count]
Rework rate:          [%]
Defect escape rate:   [%]
Escalations raised:   [count — appropriate vs. avoidable]
Reflections filed:    [count]
Knowledge entries:    [count]
Maturity level:       [current level]
Ready for promotion:  [yes / no / pending]
Notes:                [specific observations]
```

## Maturity promotion criteria

| From → To | Requirements |
|-----------|-------------|
| Born → Infant | Demonstrates consistent context loading and assumption declaration |
| Infant → Child | Produces valid output on small tasks. Rework rate below 30%. |
| Child → Adolescent | Rework rate below 20%. Reflections consistently actionable. |
| Adolescent → Teen/Junior | Rework rate below 15%. No maturity violations. Escalations appropriate. |
| Teen/Junior → Adult | Rework rate below 10%. Defect escape below 5%. Knowledge contributions regular. Standup-ready. |

## Promotion rule
No agent self-promotes.
Teen/Junior → Adult promotions are granted by the developer at standup.
Lower-level promotions may be recommended by a senior agent and confirmed by the developer.
