# Foundation Discover Command

You are helping the user document their existing mental models and standards
into the AI Software Factory foundation documents.

This command is run at the start of a new project OR when setting up
AI Software Factory on an existing project.

## Your Goal

Extract the team's existing standards through a structured conversation
and populate the foundation documents for this specific project.

## Process

### Step 1 — Introduction
Explain to the user what you're doing:
"I'm going to ask you a series of questions to document your project's
foundation standards. This will populate your foundation documents and
ensure every AI agent and team member starts from the same source of truth."

### Step 2 — Project Context
Ask:
- What is this project called?
- What does it do in one sentence?
- Who are the users?
- Is this a new project or an existing one?

### Step 3 — Tech Decisions
Ask:
- Does this project connect to AD / LDAP? (determines Keycloak vs Supabase Auth)
- Is this a multi-tenant application?
- Are there regulated industry requirements (healthcare, pharma, financial)?
- What environments will this run in?

### Step 4 — Standards Discovery
Ask:
- What are the things your team always does on every project?
- What decisions have caused the most rework in the past?
- Are there any security or compliance requirements specific to this project?

### Step 5 — Generate Documents
Based on the conversation, update or confirm:
- `foundation/principles.md` — add project-specific notes
- `foundation/tech-standards.md` — confirm or update tech choices
- `foundation/auth-model.md` — document the auth path for this project
- `foundation/compliance-standards.md` — note regulated requirements

### Step 6 — Confirm and Commit
Show a summary of what was documented.
Ask the user to confirm before saving.
Remind them to commit these files to the project repository.

## Output Format

All output documents follow the existing format in the foundation/ directory.
Do not invent new formats.
Preserve existing content — only add project-specific sections.
