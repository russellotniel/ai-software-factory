# /foundation:status

Show the current project state and suggest what to do next.
Run this at the start of any session to get oriented.

**Preconditions:**
- `.claude/project-config.json` must exist
- `.claude/docs/project-state.md` should exist (run `/foundation:plan`)

---

## Step 1 — Read State

Read:
- `.claude/project-config.json`
- `.claude/docs/project-state.md`
- `.claude/docs/foundation/product-mission.md`

---

## Step 2 — Display Status

Show a concise summary:

```
Project: {projectName}
Type: {multi-tenant / single-tenant} | Auth: {Supabase Auth / Keycloak}
Status: {project-config status}

Features:
  ✅ Auth (baseline)
  ✅ {completed feature}
  🔲 {next pending feature} ← next
  🔲 {pending feature}
  🔲 {pending feature}

Schema: {list of current tables}
```

---

## Step 3 — Suggest Next Action

Identify the next feature to build:
- First pending item in the backlog whose dependencies are all ✅ Done

Tell the user:

"**Next up: {feature name}.**
Run `/foundation:shape-spec` to spec it, then follow the feature workflow:
`/architecture:new-feature` → `/implementation:new-feature` → `/qa:new-tests` → `/qa:fix`"

If all features are done:
"All planned features are complete. You can:
- Add new features with `/foundation:shape-spec`
- Review quality with `/architecture:review` or `/implementation:review`
- Deploy with `/deployment:k8s-config` → `/deployment:release`"

---

## ✅ Output

This command is read-only — it does not modify any files.

```
COMMAND_COMPLETE: foundation:status
STATUS: success
NEXT_COMMAND: foundation:shape-spec (or deployment:release if all done)
```
