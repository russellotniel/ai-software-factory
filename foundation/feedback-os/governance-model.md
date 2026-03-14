# Governance Model

Defines who controls what and how the system maintains integrity over time.

## Authority hierarchy

```
Developer (founder, strategic director, final approver)
      ↓
Foundation (the six-layer document set — law for all agents)
      ↓
Adult agents (self-managing within approved scope)
      ↓
Teen/Junior agents (delegated workflows with gate reviews)
      ↓
Child–Adolescent agents (supervised tasks)
      ↓
Born–Infant agents (observation and planning only)
```

## What humans control (always)
- Foundation file changes
- Maturity level promotions
- Production deployments
- Architecture changes affecting multiple modules
- New role creation
- Improvement proposal acceptance

## What agents control (within scope)
- Task execution within approved workflows
- Reflection and knowledge entries
- Improvement proposal submission (any level, horizontal)
- Junior nurturing (senior agents only)
- Standup agenda (Adult agents only)

## Improvement governance
- Any agent proposes → human approves or rejects
- No senior sign-off required before submission
- No agent self-applies foundation changes
- Approved changes are applied by any available agent and reviewed before merge

## Anti-drift rules
- Agents may never rewrite foundation files without human approval
- Agents may never expand their own scope without human approval
- Agents may never promote their own maturity level
- If an agent consistently operates outside its scope, its maturity level is reviewed downward
- Foundation audits are run at the start of every project and after every major release

## Standup governance (Adult agents)
Adult agents run standups independently.
Agenda is always:
  1. Completed work
  2. Lessons learned (reflection summary)
  3. Blockers
  4. Proposed next actions
Developer attends to approve proposed actions and set strategic direction.
Developer does not teach at standups — agents present, developer directs.
