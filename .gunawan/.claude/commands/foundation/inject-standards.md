# /foundation:inject-standards

Inject the standards most relevant to the current task into context.
Use this at the start of any session where you need to make sure the
right standards are loaded — especially for long implementation sessions
or when switching between feature areas.

Read `standards-index.yml` first.

---

## Process

Ask: "What are you working on right now?"
(Or infer from conversation context if already established.)

Using `standards-index.yml`:

1. Match the task description against keywords in each standard entry
2. Identify the 3–5 most relevant standard IDs
3. Read the files listed under those IDs
4. Confirm: "I've loaded standards for: [list]. Proceeding."

If the task involves a specific feature, also check:

- `specs/{feature-name}.md` — if a spec exists
- `design-os/screens/{feature-name}.md` — if a screen spec exists

---

## When to Use

- Start of a new implementation session
- Before `/architecture:new-feature` — loads schema + rpc + api-contracts
- Before `/implementation:new-feature` — loads implementation + design
- Before `/qa:new-tests` — loads testing standards
- Before `/deployment:release` — loads release + ci-cd standards

---

## ✅ What's Next

Tell the user:

"Standards loaded. Proceed with your current task."

```
Next command: continue with current task
```
