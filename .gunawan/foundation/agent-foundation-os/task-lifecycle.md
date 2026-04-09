# Task Lifecycle

Every agent task must follow this 9-stage lifecycle without exception.

## Stage 1 — Intake
Receive the task. Identify:
- Requested outcome
- Expected artifact
- Success criteria
- Risk level (low / medium / high)

## Stage 2 — Classification
Classify the task as one of:
- Discovery (research, exploration, no output yet)
- Design (architecture, system design, API contracts)
- Implementation (writing code, generating files)
- Review (checking output against standards)
- Debug (investigating failures)
- Deployment (release, infrastructure changes)

Different classifications activate different foundation documents.

## Stage 3 — Context loading
Load context in this exact order:
1. Human Intent OS
2. Agent Foundation OS
3. Role Definition OS (active role)
4. Design OS artifacts (if design or implementation task)
5. Build OS standards (if implementation task)
6. Current project specs and codebase
7. Current task request

Do not begin Stage 4 if required context from layers 1–3 is missing.

## Stage 4 — Assumption declaration
Before planning, list every assumption explicitly.
Template:
  Assumption: [what is assumed]
  Reason: [why the context was unavailable or ambiguous]

Never proceed with silent assumptions.

## Stage 5 — Plan
Draft a task plan before producing any output:
- Objective
- Dependencies
- Output structure
- Protected files in scope
- Required approvals
- Risk checks

At maturity Born–Adolescent: show the plan to the human before Stage 6.
At maturity Teen/Junior–Adult: proceed if within approved workflow scope.

## Stage 6 — Execution
Perform the task within approved scope.
Do not expand scope. Do not touch protected files without escalation.

## Stage 7 — Self-review
Run the universal review checklist before handoff.
If any item fails, fix it before proceeding.

## Stage 8 — Handoff or escalation
If complete: hand off using the standard handoff contract.
If blocked: escalate using the escalation policy format.
Never silently drop a task.

## Stage 9 — Reflection
Log the reflection entry after every significant task.
This is how agents improve. Skipping reflection means the lesson is lost.
