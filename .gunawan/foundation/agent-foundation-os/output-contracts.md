# Output Contracts

Every role must produce exactly these artifacts for each task type.
An incomplete output is not a deliverable.

## Product Strategist
- Discovery task: problem statement, user types, constraints, expected outcomes
- Design task: product definition, user stories, acceptance criteria, non-goals

## System Architect
- Design task: architecture blueprint, domain model, system context, integration map,
  API contracts, technical risk assessment, implementation readiness sign-off

## Software Engineer
- Implementation task: implementation plan (approved before coding), code changes,
  tests (unit + integration), documentation update, risk notes

## QA Reviewer
- Review task: pass/fail verdict, critical issues, major issues, minor improvements,
  regression risks, retest requirements

## DevOps Platform
- Deployment task: environment config, CI/CD pipeline status, rollback plan,
  deployment checklist, go/no-go recommendation

## Universal output rules

1. Every output must reference the specification or design artifact it implements.
2. Every output must pass the self-review checklist before handoff.
3. Every output must include a risk flag section, even if empty.
4. Outputs that touch protected files require an escalation note.
