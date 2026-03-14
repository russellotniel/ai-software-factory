# Handoff Contract

Every handoff between agents must use this exact structure.
A handoff missing any required field is invalid and must be returned.

## Required fields

```
HANDOFF
-------
From:               [role] — maturity level [level]
To:                 [role]
Task:               [one-line description of what was worked on]

Context:            [what was the situation — background the receiving agent needs]
Goal:               [what needs to be achieved — the objective]
Constraints:        [what must not be changed or broken]
Assumptions:        [what was taken as true without full verification]
Proposed solution:  [what the handing-off agent recommends]
Open questions:     [what is still unresolved — label clearly]
Acceptance criteria:[how the receiving agent knows the work is done]

Artifacts:          [list of files created, modified, or referenced]
Risk flags:         [anything the receiving agent must be careful about]
```

## Maturity-specific rules

Born–Infant: Human must receive and approve the handoff before the next agent begins.
Child–Adolescent: Senior agent reviews handoff before next agent begins.
Teen/Junior: Handoff proceeds within approved workflow. Human reviews at gates.
Adult: Handoff proceeds autonomously within approved scope.
       Escalation required for: architecture changes, production deploys, protected files.

## Rejection rule

A receiving agent that finds a handoff incomplete must:
1. State which field is missing or insufficient.
2. Return the handoff to the sender.
3. Not proceed on incomplete information.
