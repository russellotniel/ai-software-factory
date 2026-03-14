# /design:import

Import a design into the factory. Accepts three sources:

1. **Figma** — read a frame via Figma MCP (requires Figma MCP configured)
2. **Image** — read a mockup image (PNG, JPG, screenshot) from docs/designs/
3. **Manual** — structured Q&A to document a design that exists only in someone's head

Output: populates `design-os/screens/{feature-name}.md` and optionally
`design-os/design-system.md` if design tokens are found.

---

## Step 1 — Identify Source

Ask: "Do you have a Figma link, an image file, or should we describe the design together?"

**If Figma link:**

- Use Figma MCP to read the frame
- Extract: layout structure, component names, color values, spacing, typography
- Proceed to Step 3

**If image file:**

- Ask for the file path (or accept an image dropped into the conversation)
- Read the image
- Extract: layout structure, visible UI elements, apparent component types
- Note what cannot be determined from the image (exact spacing, colors)
- Proceed to Step 3

**If manual:**

- Proceed to Step 2

---

## Step 2 — Manual Design Capture

Ask these questions to document a design that doesn't exist as a file yet:

- What is the page/screen called and what route does it live at?
- Describe the layout: what's the main structure?
  (e.g. "full-width table with a header row containing a title and add button")
- What are the main interactive elements? (buttons, forms, modals)
- What states does the screen have? (loading, empty, error, success)
- What data does it display and where does it come from?
- Are there any animations or transitions?

---

## Step 3 — Extract Design System Tokens

If the source contains color, typography, or spacing information:

- Map colors to CSS custom property names following `design-os/design-system.md`
- Identify font choices and sizes
- Note any Shadcn component variants that appear

Ask: "Should I update design-os/design-system.md with these tokens?"
If yes, merge into the existing file — do not overwrite existing decisions.

---

## Step 4 — Generate Screen Spec

Generate a screen spec using `design-os/screens/_template.md` format.

For each screen or feature area in the design:

- Map the layout to ASCII sketch or prose
- Identify Shadcn components for each UI element
- Document all states (loading, empty, error, success)
- List interactions
- Note data requirements

---

## Step 5 — Confirm and Write

Show the generated screen spec(s).
Ask: "Should I write these to design-os/screens/?"

On confirmation, write `design-os/screens/{feature-name}.md`.

After writing:

- If this is the first design import for the project, suggest running
  `/design:system` to document the full design system
- Suggest running `/foundation:shape-spec` for each screen to create
  the corresponding implementation spec

---

## ✅ What's Next

Tell the user:

"Design imported. Choose your next step:

- **If this is the first design import:** run `/design:system` to document the full design system tokens
- **If design system is already documented:** run `/foundation:shape-spec` to spec your first feature using this design"

```
Next command: /design:system        (if first import — document design tokens)
         OR: /foundation:shape-spec  (if design system already documented)
```
