# /design:system

Document or update the design system for this project. Sets the visual
language that all feature implementations will follow.

Read before starting:

- `design-os/design-system.md` — existing decisions (if any)
- `foundation/tech-standards.md` — Tailwind 4 + Shadcn confirmed

---

## Step 1 — Source

Ask: "Are we building the design system from a Figma file, an existing
implementation, or defining it from scratch?"

**From Figma:** Use Figma MCP to extract color styles, text styles, and
component variants from the design file.

**From existing code:** Scan `globals.css` and `tailwind.config.ts` for
existing token definitions.

**From scratch:** Proceed to Step 2.

---

## Step 2 — Colors

Walk through the color palette:

- Primary action color (buttons, links, focus rings)
- Secondary / neutral color
- Accent color (if any)
- Destructive (red / danger)
- Background and foreground
- Muted (secondary text, placeholders)
- Border color

Map each to HSL values for Tailwind CSS custom properties.

---

## Step 3 — Typography

- What font? (Google Font, system font, custom)
- Scale decisions: heading sizes, body size, caption size

---

## Step 4 — Shadcn Decisions

For each commonly used Shadcn component, ask:

- Which variants will this project use?
- Any composition patterns to standardise?

Focus on: Button, Card, Table, Dialog, Form, Badge, Sheet, Tabs.

---

## Step 5 — Generate and Write

Show the complete `design-os/design-system.md` content.
Ask: "Should I write this?"
On confirmation, write to `design-os/design-system.md`.

---

## ✅ What's Next

Tell the user:

"Design system documented. Run `/foundation:shape-spec` to spec your first (or next) feature."

```
Next command: /foundation:shape-spec
```
