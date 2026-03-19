# Skill: reflect-task

Run after every substantive task completion.
This is Phase 6 (Feedback OS) in action — the mechanism by which agents improve over time.

Reference: `foundation/feedback-os/task-reflection.md`

---

## Purpose

Capture what happened, what was missing, and what should improve.
This is not optional. It is the memory of your AI organization.

---

## When to invoke

After every task that:
- Wrote or modified files
- Made an architectural decision
- Encountered a failure or blocker
- Produced output that was rejected and revised
- Took significantly longer than expected

---

## Reflection template

Generate and output this at the end of every qualifying task:

```
## Task reflection

**Task:** [one-sentence description]
**Role:** [which agent role performed this]
**Date:** [today's date]

**Expected outcome:** [what was supposed to happen]
**Actual outcome:** [what actually happened]
**Result:** [success / partial / failure]

**What went well:**
- [item]

**What failed or was missing:**
- [item — and why]

**Missing context (if any):**
- [what information was absent that caused difficulty or assumptions]

**Assumptions made:**
- [list any assumptions that were declared during the newborn gate]
- [note whether those assumptions proved correct]

**Recurring patterns:**
- [if this failure or gap has appeared before, note it]

**Proposed foundation improvement:**
- [if a rule is missing or weak, propose the specific addition]
- [format: "Add to [file]: [rule text]"]
- [this is a proposal only — humans review and approve before any foundation file changes]
```

---

## Writing the reflection

Ask the operator: "Should I write this reflection to `foundation/feedback-os/reflections/[date]-[task-slug].md`?"

On confirmation, write the file.

Reflections accumulate over time. They become the institutional memory of the AI Software Factory.

---

## What Claude must never do

- Auto-update foundation files based on reflections — propose only, never self-apply
- Skip this step because the task "went well" — even successful tasks have learning value
- Write vague reflections ("it worked fine") — every section must be specific and actionable
