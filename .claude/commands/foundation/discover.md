# /foundation:discover

Document the project's foundation standards through a structured conversation.
Run this at the start of every new project, or when onboarding AI Software
Factory onto an existing one.

Output: completes product-mission.md stub (written by /foundation:init) + populates all other foundation docs + design-os stubs.

---

## Step 1 — Introduction

Tell the user:
"I'm going to ask a series of questions to document your project's foundation.
This will populate your foundation and design-os documents, ensuring every AI
agent and team member starts from the same source of truth."

---

## Step 2 — Project Identity

Read `.claude/docs/foundation/product-mission.md` — it was written by `/foundation:init`
and already contains the project name and init mode. Do not ask for these again.

Confirm to the user: "I can see this project is named **{name}** and was initialized as a
{New / Existing} project. Let's complete the rest of the foundation."

Ask:

- What does this project do in one sentence?
- Who are the primary users?

---

## Step 3 — Technical Decisions

Ask:

- Does this project connect to Active Directory or LDAP?
  (Determines Keycloak vs Supabase Auth only)
- Is this a multi-tenant application?
- Are there regulated industry requirements? (healthcare, finance, pharma)
- What environments will this run in? (AKS / OCP / vanilla Kubernetes)
- What ingress controller does the cluster use?

---

## Step 4 — Standards Discovery

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
- Any compliance requirements beyond the baseline? (healthcare, pharma, finance, etc.)

---

## Step 5 — Design Context

Ask:

- Do you have a Figma file for this project?
  (If yes: run /design:import after this command)
- Do you have static mockups (images)?
  (If yes: note the paths for /design:import)
- If neither: do you have a rough description of the intended UI?
  (Capture key layout decisions now)

---

## Step 6 — Complete Documents

`product-mission.md` was already created as a stub by `/foundation:init`.
Extend it — fill every section that is still marked "_To be completed_" or "_To be determined_".
Do not overwrite the **Name**, **Init mode**, or stub header.

### .claude/docs/foundation/product-mission.md

Fill every remaining section using the conversation answers:

- One-line description, status (set to "Active development")
- Primary and secondary users
- Problem statement
- Key use cases (3–5 concrete actions)
- Out of scope
- Technical context: multi-tenant (yes/no), auth path, regulated (yes/no + which), integrations

### .claude/docs/foundation/tech-standards.md

Confirm or update:

- Auth decision: Supabase Auth or Keycloak + Supabase
- Any project-specific deviations from defaults (requires justification)

### .claude/docs/foundation/auth-model.md

Confirm the auth path for this specific project.

### .claude/docs/foundation/compliance-standards.md

Note any regulated requirements beyond the baseline.

### .claude/docs/design-os/product-vision.md

Populate from design context gathered in Step 5:

- Product summary
- User personas (from Step 2)
- Core user journeys
- Feature areas (map to src/features/ domains)

---

## Step 7 — Confirm and Write

Show a summary of what will be written.
Ask the user to confirm.

On confirmation:

- Write all generated documents
- Remind: commit these files before starting development

After writing, suggest next steps:

- "If you have Figma or mockups, run /design:import next"
- "Otherwise, run /foundation:shape-spec to spec your first feature"

---

## ✅ What's Next

Tell the user:

"Foundation documented. Choose your next step:

- **If you have a Figma file or mockup images:** run `/design:import` to import your design into `.claude/docs/design-os/screens/`
- **If you have no design yet:** run `/foundation:shape-spec` to spec your first feature and start building"

```
Next command: /design:import   (if you have a design)
         OR: /foundation:shape-spec  (if no design yet)
```
