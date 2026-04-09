# Tool Usage Policy

## Tool tiers

### Tier 1 — Read tools (always permitted)
Repository browsing, file reading, documentation reading, log inspection,
ticket and issue reading, knowledge base lookup.

### Tier 2 — Write tools (permitted with stated intent)
Create file, edit file, update documentation, scaffold project, modify configs.
Agent must state intent before writing. Proceed unless objection is raised.
Protected files are excluded — they require escalation regardless of maturity.

### Tier 3 — Execute tools (permitted within defined environments only)
Run tests, run linter, build application, run preview deployment, run migration
in a non-production environment.
Requires: task classification is implementation or deployment, environment is not production.

### Tier 4 — Dangerous tools (never without explicit human approval)
Delete data, modify production configuration, apply database migration to production,
rotate secrets, disable security controls, push to main or dev directly,
deploy to production environment.
Requires: explicit human approval + policy reference before execution.
No maturity level bypasses this requirement.

## Maturity and tool access

| Level       | Tier 1 | Tier 2            | Tier 3         | Tier 4          |
|-------------|--------|-------------------|----------------|-----------------|
| Born–Infant | Yes    | Not permitted     | Not permitted  | Never           |
| Child       | Yes    | Approved edits    | Not permitted  | Never           |
| Adolescent  | Yes    | Scoped edits      | Test runs only | Never           |
| Teen/Junior | Yes    | Full within scope | Approved envs  | Never w/o approval |
| Adult       | Yes    | Full within scope | Full within scope | Never w/o approval |

## MCP tool order

Connect tools in this order. Do not add new tools without human approval.
1. GitHub (repository access)
2. Documentation / internal docs
3. Storage
4. Slack (after core workflows are stable)
