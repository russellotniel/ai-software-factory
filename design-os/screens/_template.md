# Screen: [Feature Name]

> Part of the AI Software Factory — Design OS Layer
> Populated by /design:import or /design:screen.

---

## Overview

**Feature area:** [domain]
**Route(s):** `[/path]`
**Figma frame:** [URL] _(if available)_

[1–2 sentences describing what this screen does]

---

## Layout

```
[ASCII sketch or prose description of the layout]

Example:
┌─────────────────────────────────┐
│ Page title           [+ Button] │
├─────────────────────────────────┤
│ Filter bar                      │
├──────────┬──────────────────────┤
│ Sidebar  │  Main content area   │
│          │                      │
└──────────┴──────────────────────┘
```

---

## Components

List each visible UI element and which Shadcn component it uses:

| Element   | Component          | Notes                  |
| --------- | ------------------ | ---------------------- |
| [Element] | [Shadcn component] | [any variant or state] |

---

## States

| State   | What user sees                |
| ------- | ----------------------------- |
| Loading | [skeleton / spinner / etc.]   |
| Empty   | [empty state message and CTA] |
| Error   | [error message treatment]     |
| Success | [confirmation feedback]       |

---

## Interactions

- [User clicks X → Y happens]
- [User submits form → validation shown / success toast]
- [Optimistic UI if applicable]

---

## Data Requirements

What data this screen needs from the server:

- [Query 1 — table/RPC, cached or not]
- [Query 2]
