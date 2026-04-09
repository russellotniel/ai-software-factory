# Learning Database

The institutional knowledge of the AI Software Factory.
Every lesson learned from tasks, failures, and reflections is stored here.

## Structure

Entries are stored in `knowledge/` with the following layout:
```
knowledge/
  patterns/                ← what works well — reusable approaches
  anti-patterns/           ← what consistently fails — avoid these
  postmortems/             ← root cause analyses from failures
  architecture-decisions/  ← ADRs and why decisions were made
  reusable-blueprints/     ← proven module/feature templates
```

## Entry format

```
KNOWLEDGE ENTRY
---------------
Date:       [YYYY-MM-DD]
Category:   [pattern / anti-pattern / postmortem / ADR / blueprint]
Topic:      [one-line title]
Source:     [task or failure that produced this lesson]

Lesson:     [what was learned]
Rule:       [the actionable rule derived from this lesson]
Context:    [when this rule applies]
Exception:  [when this rule does not apply, if any]
```

## Rules
- Any agent may add entries to the learning database
- Entries must be dated and attributed to the source task
- Entries must not duplicate existing entries — check before adding
- Entries that contradict existing knowledge must be flagged for human review
- The learning database is read by all agents during context loading (Layer 6)

## Senior agent responsibility
Senior agents (Adolescent and above) are responsible for ensuring
junior agents in their role read relevant knowledge entries before starting tasks.
The developer is not responsible for this — the senior agent is.
