# Design System

> Part of the AI Software Factory — Design OS Layer
> Populated by /design:system or /design:import.
> Defines the visual language for this project.
> Implementation uses Tailwind 4 + Shadcn/ui.

---

## Color Tokens

Define as Tailwind CSS custom properties. Reference these in components —
never hardcode hex values.

```css
/* In globals.css */
:root {
  --color-primary: [hsl value];
  --color-primary-fg: [hsl value]; /* text on primary */
  --color-secondary: [hsl value];
  --color-secondary-fg: [hsl value];
  --color-accent: [hsl value];
  --color-destructive: [hsl value];
  --color-muted: [hsl value];
  --color-muted-fg: [hsl value];
  --color-border: [hsl value];
  --color-background: [hsl value];
  --color-foreground: [hsl value];
}
```

---

## Typography

| Element            | Tailwind class                  | Notes                    |
| ------------------ | ------------------------------- | ------------------------ |
| Page title (h1)    | `text-3xl font-bold`            |                          |
| Section title (h2) | `text-xl font-semibold`         |                          |
| Card title (h3)    | `text-base font-semibold`       |                          |
| Body               | `text-sm`                       | Default for most UI text |
| Caption / label    | `text-xs text-muted-foreground` |                          |

**Font:** [Font name] — imported via `next/font` in root layout.

---

## Shadcn Component Decisions

Record any Shadcn component variants or compositions decided for this project.
This prevents inconsistent component usage across features.

| Component | Variant / decision          | Notes              |
| --------- | --------------------------- | ------------------ |
| Button    | Default + Destructive only  | No outline variant |
| Table     | [decision]                  |                    |
| Dialog    | [decision]                  |                    |
| Form      | Always use `<Form>` wrapper | Never raw `<form>` |

**Rule:** Never edit files in `components/ui/`. Compose using `cn()` only.

---

## Application Shell

The top-level layout structure of the application:

```
[Describe the layout: sidebar + content, top nav + content, etc.]
[Reference the screen in design-os/screens/ if designed]
```

---

## Spacing and Radius

```
Border radius: rounded-[value] — [decision for this project]
Card padding:  p-[value]
Page padding:  px-[value] py-[value]
Section gap:   space-y-[value]
```
