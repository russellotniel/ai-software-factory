# /foundation:discover

Document the project's foundation standards through a structured conversation.
Run this at the start of every new project, or when onboarding AI Software
Factory onto an existing one.

Output: populated foundation documents + product-mission.md + design-os stubs.

---

## Step 1 — Introduction

Tell the user:
"I'm going to ask a series of questions to document your project's foundation.
This will populate your foundation and design-os documents, ensuring every AI
agent and team member starts from the same source of truth."

---

## Step 2 — Project Identity

Ask:

- What is this project called?
- What does it do in one sentence?
- Who are the primary users?
- Is this a new project or an existing one?

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

Ask:

- What are the things your team always does on every project?
- What decisions have caused the most rework in the past?
- Any security or compliance requirements specific to this project?

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

## Step 6 — Generate Documents

Based on the conversation, generate or confirm:

### foundation/product-mission.md

Fill every section using the conversation answers:

- Project name, description, status
- Primary and secondary users
- Problem statement
- Key use cases (3–5 concrete actions)
- Out of scope
- Technical context (multi-tenant, auth path, regulated, integrations)
- Definition of done

### foundation/tech-standards.md

Confirm or update:

- Auth decision: Supabase Auth or Keycloak + Supabase
- Any project-specific deviations from defaults (requires justification)

### foundation/auth-model.md

Confirm the auth path for this specific project.

### foundation/compliance-standards.md

Note any regulated requirements beyond the baseline.

### design-os/product-vision.md

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

- **If you have a Figma file or mockup images:** run `/design:import` to import your design into `design-os/screens/`
- **If you have no design yet:** run `/foundation:shape-spec` to spec your first feature and start building"

```
Next command: /design:import   (if you have a design)
         OR: /foundation:shape-spec  (if no design yet)
```
