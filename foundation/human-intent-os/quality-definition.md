# Quality Definition

A feature is complete only when all of the following are true:

1. Specification exists and was approved before coding began
2. Code is implemented and passes all linting rules
3. Naming conventions enforced — all variables, files, and functions are descriptive and consistent
4. Negative space / guard clauses applied throughout
5. Unit tests written and passing
6. Integration tests written and passing
7. Stress tests, load tests, and rate limiter tests pass at expected thresholds
8. No hardcoded secrets or credentials anywhere
9. RLS enabled on every new database table in the same migration
10. PR reviewed and approved — no direct pushes to main or dev
11. Every change (code, schema, API, config) is documented before the PR closes
12. No feature ships with a failing test in the suite

## Core rule

Never ship without tests. Never close a PR without documentation.
Quality is not a phase — it is a continuous requirement from spec to merge.
