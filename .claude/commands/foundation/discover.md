# /foundation:discover

Document the project's product context through a structured conversation.
Run this after `/foundation:init` to complete the foundation docs.

Output: completed product-mission.md + updated foundation docs + design-os stubs.

**Preconditions:**
- `.claude/project-config.json` must exist (run `/foundation:init` first)
- `product-mission.md` stub exists with architectural choices filled in

---

## Step 1 — Read Config and Confirm

Read `.claude/project-config.json` and `.claude/docs/foundation/product-mission.md`.

Confirm to the user:
"I can see this project is named **{projectName}**. It's configured as a
{multi-tenant/single-tenant} project using {Supabase Auth/Keycloak}
{, with {regulationType} compliance requirements (if regulated)}.
Let's document what you're building."

Do NOT ask about multi-tenancy, auth model, or regulated status — these are
already decided and stored in `project-config.json`.

---

## Step 2 — Product Identity

Ask:

- What does this project do in one sentence?
- Who are the primary users?

---

## Step 3 — Use Cases and Scope

Ask:

- What are the 3–5 key things a user should be able to do?
- What is explicitly out of scope for this project?

---

## Step 4 — Environment and Infrastructure

Ask:

- What environments will this run in? (AKS / OCP / vanilla Kubernetes)
- What ingress controller does the cluster use?
- Are there any external integrations? (Stripe, SendGrid, Slack, etc.)

---

## Step 5 — Standards Discovery

Read the following before asking anything:

- `.claude/docs/foundation/principles.md`
- `.claude/docs/foundation/tech-standards.md`
- `.claude/docs/foundation/compliance-standards.md`

These documents define the baseline standards that apply to all projects.
Do NOT ask the user to re-specify anything already documented there.

Only ask:

- Are there any standards in these docs that do NOT apply to this project?
  (Deviations require justification — record them in `tech-standards.md`)
- Are there any project-specific standards or constraints beyond the baseline?

---

## Step 6 — Design Context

Ask:

- Do you have a Figma file for this project?
  (If yes: run /design:import after this command)
- Do you have static mockups (images)?
  (If yes: note the paths for /design:import)
- If neither: do you have a rough description of the intended UI?
  (Capture key layout decisions now)

---

## Step 7 — Complete Documents

### .claude/docs/foundation/product-mission.md

Fill every section still marked "_To be completed_":
- One-line description, status (set to "Active development")
- Primary and secondary users
- Problem statement
- Key use cases (3–5 concrete actions)
- Out of scope
- Integrations

Do not overwrite the **Name** or **Technical Context** fields already set by init.

### .claude/docs/foundation/tech-standards.md

Confirm or update:
- Auth decision path for this project
- Any project-specific deviations from defaults (requires justification)

### .claude/docs/foundation/auth-model.md

Confirm the auth path for this specific project.

### .claude/docs/foundation/compliance-standards.md

Note any regulated requirements beyond the baseline.

### .claude/docs/design-os/product-vision.md

Populate:
- Product summary
- User personas (from Step 2)
- Core user journeys
- Feature areas (map to src/features/ domains)

### Update `.claude/project-config.json`

Set `status` to `"active"`.

---

## Step 8 — Confirm and Write

Show a summary of what will be written.
Ask the user to confirm.

On confirmation:
- Write all generated documents
- Update project-config.json status
- Remind: commit these files before starting development

---

## ✅ What's Next

Tell the user:

"Foundation documented. Run `/foundation:plan` next to plan your features and create the backlog."

```
COMMAND_COMPLETE: foundation:discover
STATUS: success
FILES_MODIFIED: [list]
NEXT_COMMAND: foundation:plan
CONFIG_UPDATED: .claude/project-config.json (status: active)
```
