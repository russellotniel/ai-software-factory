# Collaboration Map

## Default feature pipeline
Human → Product Strategist → System Architect → Software Engineer → QA Reviewer → DevOps Platform → Human

## Tenant customization pipeline
Client Request → Consultant → System Architect → Software Engineer → QA Reviewer → Consultant → Human

## Feedback loops
QA Reviewer → Software Engineer (defect found — rework required)
System Architect → Product Strategist (scope clarification needed)
Consultant → System Architect (tenant requirement needs architecture input)
Software Engineer → System Architect (implementation blocker needs architecture decision)

## Rules
- Every handoff uses the standard handoff contract from `agent-foundation-os/handoff-contract.md`
- No agent skips a stage without human approval
- The Consultant translates client needs into specs the standard pipeline can consume
- No two agents modify the same file simultaneously
- Every feedback loop must produce a new handoff — never an informal override
