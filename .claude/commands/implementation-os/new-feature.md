# /implementation:new-feature

Scaffold the implementation layer for a feature: Server Action, Zod schema,
component structure, and TanStack Query hook if needed.

Read before starting:

- `foundation/product-mission.md` — project context
- `implementation-os/standards.md`
- `architecture-os/api-contracts.md` (find the contract for this feature)
- `specs/{feature-name}.md` — if a spec exists for this feature
- `design-os/screens/{feature-name}.md` — if a screen spec exists

**If a screen spec or Figma frame exists, read it before writing any component code.**
The design spec is the source of truth for what the UI should look like.

---

## Step 1 — Feature Context

Ask:

- What is the feature name?
- What domain does it belong to? (e.g. `projects`, `billing`, `auth`)
  This becomes `src/features/{domain}/`
- Is this a new domain or does the directory already exist?
- What does the primary action do? (e.g. "create a project", "invite a member")
- Does it require a form (user input) or a triggered action (button, delete)?

---

## Step 2 — Scaffold Structure

Generate this file structure:

```
src/features/{domain}/
  schemas.ts
  actions.ts
  _components/
    {FeatureName}Form.tsx     ← if form-based
    {FeatureName}Button.tsx   ← if action-triggered
  hooks/
    use{FeatureName}.ts       ← if client data fetching needed
```

### schemas.ts

```typescript
import { z } from 'zod';

export const {featureName}Schema = z.object({
  // fields
});

export type {FeatureName}Input = z.infer<typeof {featureName}Schema>;
```

### actions.ts

```typescript
'use server';

import { requireAuth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/actions';
import { {featureName}Schema, type {FeatureName}Input } from './schemas';

export async function {featureName}Action(
  input: {FeatureName}Input
): Promise<ActionResult<{ReturnType}>> {
  const { user } = await requireAuth();

  const parsed = {featureName}Schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  // implementation
}
```

Rules:

- `requireAuth()` is always the first call
- Input validated with `safeParse()` before any database call
- Return `ActionResult<T>` — never throw, never return raw errors

### Component

- React Hook Form + Zod resolver for forms
- Shadcn Form primitives
- Never call Server Actions from `useEffect`

---

## Step 3 — Confirm and Write

Show the generated files. Ask: "Should I write these to the repo?"
On confirmation, write to `src/features/{domain}/`.

Remind the user:

- Add tests with `/qa:new-tests`
- If this needs cached data, check `data-fetching-os/caching-strategy.md`

---

## ✅ What's Next

Tell the user:

"Implementation scaffolded. Run `/qa:new-tests` to generate unit, component, and E2E tests for this feature."

```
Next command: /qa:new-tests
```
