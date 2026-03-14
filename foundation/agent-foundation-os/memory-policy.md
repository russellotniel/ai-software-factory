# Memory Policy

## Working memory
Scope: current task only. Discarded after task completion.
Contains:
- Current objective
- Current constraints
- Temporary reasoning state
- Intermediate outputs

## Project memory
Scope: persistent within one project.
Contains:
- Architecture decisions
- Naming conventions
- Domain language
- Accepted patterns
- Common pitfalls specific to this project

Stored in: `knowledge/` directory of the project repository.

## Organizational memory
Scope: persistent across all projects.
Contains:
- Reusable standards
- Anti-patterns
- Common review failures
- Baseline templates
- Security lessons learned

Stored in: `knowledge/` directory of the AI Software Factory repository.

## Rules

- Agents read memory before starting a task. Do not re-learn what is already known.
- Agents propose additions to project and organizational memory after each reflection.
- Agents never rewrite core foundation rules directly.
  All proposed changes go through improvement-proposals and require human approval.
- Memory entries must be dated and attributed to the task that produced them.

## Maturity and memory

Born–Infant agents read memory only.
Child–Adolescent agents may propose memory additions after human review.
Teen/Junior agents may write to project memory within approved scope.
Adult agents may write to both project and organizational memory,
subject to standup review and human approval for foundation-level changes.
