# Design Principles

Priority order (highest to lowest):

1. **Visual consistency** — Design patterns, tokens, and components are reused without exception.
   Shadcn/ui + Tailwind CSS 4.x is the system. No ad hoc styling.

2. **Performance perception** — Loading states, skeleton screens, and optimistic UI are
   required on every async operation. Users must never see a blank screen.

3. **Cognitive load** — The user must never be confused by the interface. Core actions
   must be reachable without instruction.

4. **Accessibility** — WCAG 2.1 AA is the baseline. No exceptions for production releases.

5. **Mobile and desktop first** — Every interface must function correctly on both.
   Neither is an afterthought.

6. **Complexity handling** — Complexity is only introduced once the business process is
   fully understood and approved. Progressive disclosure applies when complexity is unavoidable.

## Core rule
A well-designed interface is one that does not confuse the user.
