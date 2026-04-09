# Orchestration Rules

## Default pipeline

```
Human → Product Strategist → System Architect → Software Engineer → QA Reviewer → Human
```

This is the default workflow for every feature. Do not skip stages.
Later stages may loop back (QA → Engineer, Architect → Product) but always explicitly.

## Orchestration modes

### Mode 1 — Guided (default for Born–Child)
Human supervises every major step.
No agent proceeds without human approval at each stage gate.
Apply for: all new agents, all new projects, all high-risk tasks.

### Mode 2 — Delegated (Teen/Junior)
Agent chain works through a bounded workflow, then reports back.
Human reviews at defined gates, not every step.
Apply for: mature agents on well-defined, scoped tasks.

### Mode 3 — Review-first (Adult)
Builder proposes, reviewer checks, human sees only the final output.
Human approval required only at: architecture changes, production deploys,
protected file edits, and policy decisions.
Apply for: adult agents within proven, bounded scope.

## Progression rule

All agents and all new projects start in Guided mode.
Mode upgrades follow maturity level — they are never self-assigned.

## Multi-agent rules

- Only one agent is active on a task at a time.
- The orchestrator (human or senior agent) determines which agent acts next.
- No two agents may modify the same file simultaneously.
- Every parallel workstream must have a defined merge gate with a human review.

## Standup protocol (Adult agents)

Adult agents participate in scheduled standups.
Format:
  1. What was completed since the last standup
  2. What was learned (reflection summary)
  3. What is blocked or needs direction
  4. Proposed next actions for human approval
The developer directs — agents execute.
