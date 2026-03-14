# Improvement Proposals

Any agent at any level may submit an improvement proposal.
There is no hierarchy on who can propose — ideas are evaluated on merit, not seniority.

## Proposal format

```
IMPROVEMENT PROPOSAL
--------------------
Date:           [YYYY-MM-DD]
Proposed by:    [role] — maturity level [level]
Source:         [task or reflection that triggered this]

Layer to update:  [human-intent-os / agent-foundation-os / role-os /
                   design-os / build-os / feedback-os / knowledge-library /
                   project-specific]
File:           [specific file path]
Current state:  [quote or describe what exists today]
Proposed change:[what should be different]
Reason:         [why this improves the system — be specific]
Risk:           [what could break or regress if this change is made]
```

## Proposal lifecycle

```
Agent files proposal
      ↓
Proposal added to this queue
      ↓
Human reviews at next standup or asynchronously
      ↓
Accepted → agent (any level) applies the change, human approves the diff
Rejected → reason recorded, proposal archived
Deferred → revisit at next standup
```

## Rules
- Proposals are never self-applied — always require human approval
- Any agent may propose at any time — no senior sign-off required before submission
- Proposals that touch protected files require full escalation, not just proposal review
- Duplicate proposals are merged — check the queue before submitting
- Rejected proposals must include the rejection reason so agents learn from it

## Proposal queue
<!-- Active proposals are listed below. Completed proposals are archived. -->
