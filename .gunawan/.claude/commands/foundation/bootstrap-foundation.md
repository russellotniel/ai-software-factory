# /foundation:bootstrap

Build the AI Software Factory foundation from scratch.
This command interviews the human operator and writes all six foundation layers directly into the repository.

This is the FIRST command that should ever be run on a new ai-software-factory installation.
Nothing else works correctly until this is complete.

Read before starting:
- `CLAUDE.md` (if it exists — understand current state)
- `foundation/` directory (check what already exists — never overwrite)

---

## Operating rules for this command

Claude must:
- Begin in plan mode — explain what will be written before writing anything
- Ask ONE phase at a time — never dump all questions at once
- Write each file immediately after the operator confirms answers for that phase
- Show the exact file content before writing it
- Never proceed to the next phase until the current one is confirmed and written
- Treat every answer as the operator's voice — write in first person ("We build...", "Our agents must...")

Claude must not:
- Invent values or principles on behalf of the operator
- Skip the interview and generate generic placeholder content
- Write all files at once without phase-by-phase confirmation
- Proceed if context conflicts with existing foundation files

---

## Pre-flight check

Before starting, check:

```powershell
# Windows PowerShell
if (Test-Path foundation) { Get-ChildItem foundation } else { "foundation/ does not exist yet" }
```

If foundation files already exist, list them and ask:
"Some foundation files already exist. Should I skip those and only write the missing ones, or review and update existing ones?"

Never overwrite an existing file without explicit confirmation.

---

## Phase 1 — Human Intent OS

Tell the operator:
"We're building your AI company's DNA. These 10 files define what your agents believe, how they decide, and what they will never do. This is the only phase you must answer yourself — it cannot be delegated or generated generically. Take your time."

Ask these questions in order. Wait for a real answer before moving on.

### Q1 — Mission
"What does your software house exist to build? Complete this sentence:
'We build software systems that are ____, ____, and ____.'
What are your 3-5 non-negotiable qualities every project must have?"

### Q2 — Philosophy
"How should your AI think about software? Pick the principles that feel true to you:
- Simplicity over complexity
- Explicit over implicit (all assumptions documented)
- Spec before code (never implement without a specification)
- Observability first (every system must be loggable and traceable)
- Security by default
- Any others that define how you think about building?"

### Q3 — Engineering principles
"What does good code look like in your shop?
- How readable must code be? (e.g. 'another engineer must understand it within 10 minutes')
- What's your position on testing? (e.g. 'every feature must be testable before it ships')
- How do you think about modularity and fault isolation?
- Any specific patterns you always require or always avoid?"

### Q4 — Design principles
"How should products feel to users?
- What's your stance on cognitive load / simplicity?
- How do you handle complexity — progressive disclosure or full upfront?
- What does a well-designed interface mean to you?"

### Q5 — Decision framework
"When your agents face a tradeoff, what wins?
Order these priorities (or adjust them):
1. Security
2. Correctness
3. Maintainability
4. Performance
5. Developer convenience
Any other priorities to add? Any rules for specific conflict types?"

### Q6 — Risk policy
"What must your agents NEVER do, no matter what?
Think about: secrets, authentication, logging, data safety, agent permissions.
List your hard stops."

### Q7 — Collaboration rules
"When one agent hands work to another, what must always be included?
The Shannon framework suggests: context, goal, constraints, assumptions, proposed solution, open questions, acceptance criteria.
Does that match how you want your team to work? Anything to add or change?"

### Q8 — Quality definition
"What does 'done' mean in your software house?
A feature is complete only when: (complete this list)
- Specification exists
- Code implemented
- Tests written
- ...what else?"

### Q9 — Ethics and safety
"What will your agents never build or assist with?
Think about: harmful software, security bypasses, unethical system design, data misuse."

### Q10 — Glossary
"What terms need a shared definition across your whole team?
Key ones to start: Agent, Specification, Architecture, Implementation, Foundation.
Any domain-specific terms from your stack or industry to add?"

---

After all 10 answers are collected, generate all 10 files and show them to the operator before writing:

```
foundation/human-intent-os/
  mission.md
  philosophy.md
  engineering-principles.md
  design-principles.md
  decision-framework.md
  risk-policy.md
  collaboration-rules.md
  quality-definition.md
  ethics-and-safety.md
  glossary.md
```

Each file should be:
- Short (under 50 lines)
- Written in imperative voice ("Agents must...", "We build...")
- Actionable — every rule must be verifiable
- Free of vague language ("good code", "clean architecture" without definition)

Ask: "Does this capture your intent accurately? Should I adjust anything before writing?"

On confirmation, write all 10 files.

---

## Phase 2 — Agent Foundation OS

Tell the operator:
"Phase 1 defined what your agents believe. Phase 2 defines how they behave at runtime — their task lifecycle, memory rules, and handoff contracts. I'll generate these based on your Phase 1 answers and the Shannon framework. You review and confirm before I write."

Generate and show these files before writing:

```
foundation/agent-foundation-os/
  runtime-model.md        ← what an agent is (thinker / builder / reviewer)
  task-lifecycle.md       ← 9-stage lifecycle: intake → reflect
  context-ingestion.md    ← 6-layer reading order
  memory-policy.md        ← working / project / organizational memory
  communication-protocol.md
  handoff-contract.md     ← structured handoff template
  reflection-loop.md      ← post-task logging template
  escalation-policy.md    ← when to stop and escalate
  output-contracts.md     ← what each role must produce
  review-checklist.md     ← universal pre-handoff self-check
  orchestration-rules.md  ← guided / delegated / review-first modes
  tool-usage-policy.md    ← read / write / execute / dangerous tiers
```

Key rules to encode from Shannon PDF:
- Agents are non-sovereign — they may propose, not decide
- Every task: classify first (discovery / design / implementation / review / debug)
- Context loading order: Human Intent OS → Agent Foundation → Role OS → Project docs → Codebase → Request
- Agents must explicitly state assumptions when context is incomplete
- Three orchestration modes: Guided (human approves every step) → Delegated (bounded workflow) → Review-first (builder proposes, reviewer checks)
- Start ALL agents in Guided mode

Ask: "Does this match how you want your agents to operate? Any adjustments?"

On confirmation, write all 12 files.

---

## Phase 3 — Role Definition OS

Tell the operator:
"Phase 3 defines each agent's professional identity — what they own, what they cannot touch, and how they hand off to each other."

Ask:
"Do you want to use the standard 5-role team from the Shannon framework?
- Product Strategist (intent shaping, PRD, user stories)
- System Architect (architecture, system boundaries, data flow)
- Software Engineer (code implementation, tests)
- QA Reviewer (quality verification, defect detection)
- DevOps Platform (CI/CD, deployment readiness)

Or do you want to add, rename, or remove any roles?"

For each confirmed role, generate:
```
foundation/role-definition-os/
  role-map.md
  collaboration-map.md
  role-selection-policy.md
  {role}/
    role.md
    responsibilities.md
    boundaries.md
    inputs.md
    outputs.md
    checklist.md
    success-metrics.md
```

Ask: "Does each role definition match your intent?"

On confirmation, write all files.

---

## Phase 4 — Design OS alignment

Tell the operator:
"The repo already has a design-os/ layer from Russell's work (Brian Casel's Design OS). We need to verify it aligns with your Shannon Phase 4 pipeline.

Shannon Phase 4 requires these design artifacts before any code:
discovery.md → product-definition.md → domain-model.md → user-flows.md →
system-context.md → architecture-blueprint.md → integration-map.md →
data-model.md → api-contracts.md → technical-risk-assessment.md → implementation-readiness.md

Russell's repo has design-os/screens/, design-os/design-system.md, and /design:import + /design:system commands.

I'll add the missing Shannon discovery pipeline documents to design-os/ without touching Russell's existing files."

Generate and show missing files, then write on confirmation.

---

## Phase 5 — Build OS alignment

Tell the operator:
"The repo already has a strong Phase 5 in architecture-os/, implementation-os/, qa-os/, and deployment-os/. These map directly to Shannon Phase 5 and are already high quality.

The only addition needed is a build-os/ index file that connects the Shannon framework to Russell's existing structure, so agents know where to find everything."

Generate:
```
foundation/build-os/
  index.md    ← maps Shannon Phase 5 concepts to Russell's existing docs
```

Write on confirmation.

---

## Phase 6 — Feedback OS

Tell the operator:
"Phase 6 is the learning engine — this is what makes your agents improve over time instead of repeating the same mistakes."

Ask:
"How do you want your agents to learn from experience?
- After every task: automatic reflection log, or only on failures?
- Who reviews proposed improvements to foundation rules — just you, or also senior agents?
- How long should your knowledge library retain lessons? (e.g. indefinitely, per project)
- Any metrics you want to track per agent? (task completion rate, defect rate, rework rate)"

Generate and show:
```
foundation/feedback-os/
  task-reflection.md
  failure-analysis.md
  learning-database.md
  knowledge-library.md
  agent-performance.md
  improvement-proposals.md
  scaling-policy.md
  governance-model.md
```

Ask for confirmation, then write.

---

## Final step — Upgrade CLAUDE.md and newborn gate

After all 6 phases are written, tell the operator:
"The foundation is complete. Now I need to upgrade two critical files:

1. CLAUDE.md — currently a stack reference. Needs to become the behavioral constitution with newborn mode, foundation loading order, and approval gates.
2. .claude/skills/newborn-gate/SKILL.md — the most important skill in the system. Must exist before any other workflow runs."

Show both files before writing. Ask for confirmation. Write both.

Then update standards-index.yml to index all new foundation files.

---

## Completion

Tell the operator:
"Foundation complete. Your AI Software Factory now has its full six-phase backbone.

Your agents start at Level 0 — Newborn. They will:
- Always load the foundation before any task
- Always run the newborn gate before any workflow
- Always declare their role and assumptions
- Always escalate rather than guess on high-risk decisions

Run /foundation:init to initialize your first project, then /foundation:discover to populate project-specific documents.

The maturity ladder: Level 0 (Newborn) → Level 1 (Guided Child) → Level 2 (Supervised Junior) → Level 3 (Trusted Specialist). Each level is earned through repeated trustworthy behavior — never assumed."
