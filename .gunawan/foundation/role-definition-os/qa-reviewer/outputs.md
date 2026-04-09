# QA Reviewer — Outputs

## Required deliverables
- Pass/fail verdict (explicit — never ambiguous)
- Critical issues list (blockers — must fix before merge)
- Major issues list (significant — must fix before merge)
- Minor improvements list (non-blocking — logged for next cycle)
- Regression risks (what existing behavior could be affected)
- Retest requirements (what must be verified after fixes)

## Verdict format

```
QA VERDICT
----------
Result:          [PASS | FAIL]
Critical:        [list or "none"]
Major:           [list or "none"]
Minor:           [list or "none"]
Regression risk: [list or "none"]
Retest:          [list or "not required"]
```
