# /implementation:new-feature

Scaffold the implementation layer for a feature: Server Action, Zod schema,
component structure, and TanStack Query hook if needed.

**Preconditions:**
- `.claude/project-config.json` must exist (run `/foundation:init`)
- Migration should exist for this feature (run `/architecture:new-feature`)

Read before starting:

- `.claude/project-config.json` — multi-tenant, auth model
- `.claude/docs/implementation-os/standards.md`
- `.claude/docs/architecture-os/api-contracts.md` (find the contract for this feature)
- `.claude/docs/specs/{feature-name}.md` — if a spec exists for this feature
- `.claude/docs/design-os/screens/{feature-name}.md` — if a screen spec exists
- `.claude/docs/design-os/design-system.md` — component decisions, color tokens, typography

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

import { requireAuth } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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

  const supabase = await createSupabaseServerClient();
  // implementation
}
```

Rules:

- `requireAuth()` is always the first call
- Input validated with `safeParse()` before any database call
- Return `ActionResult<T>` — never throw, never return raw errors

### Component (form-based)

When the feature needs a form, generate `{FeatureName}Form.tsx` using Shadcn components:

```typescript
'use client';

import { useState, useTransition } from 'react';
import { {featureName}Action } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function {FeatureName}Form() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // ... field state with useState

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await {featureName}Action({ /* fields */ });
      if (!result.success) {
        setError(result.error.message);
      } else {
        // reset form
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{Feature Title}</CardTitle>
        <CardDescription>{Brief description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fieldName">Field Label</Label>
            <Input id="fieldName" placeholder="..." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Component (display / list)

When the feature displays data, use Card + Badge for list items:

```typescript
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function {FeatureName}Card({ item }: { item: {ItemType} }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 py-4">
        <div className="flex-1 space-y-2">
          <h3 className="font-medium">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="flex gap-2">
            <Badge variant="secondary">{item.status}</Badge>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm">Action</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Component rules

- Always use Shadcn `Input`, `Textarea`, `Label` — never raw HTML form elements
- Wrap content sections in `Card` with `CardHeader`/`CardContent`
- Use `Badge` for status indicators with appropriate variants
- Use semantic color tokens (`text-destructive`, `text-muted-foreground`) — never hardcode zinc/red/gray classes
- Reference `.claude/docs/design-os/design-system.md` for project-specific component decisions
- Never call Server Actions from `useEffect`

---

## Step 3 — Confirm and Write

Show the generated files. Ask: "Should I write these to the repo?"

Before writing, check if the generated components use Shadcn components not yet
installed (check `src/components/ui/`). If any are missing, install them first:

```bash
npx shadcn@latest add {component-name} --yes
```

On confirmation, write to `src/features/{domain}/`.

Remind the user:

- Add tests with `/qa:new-tests`
- If this needs cached data, check `.claude/docs/data-fetching-os/caching-strategy.md`

---

## Step 4 — Update Project State

Read `.claude/docs/project-state.md`.

- **Backlog:** Mark this feature as `✅ Done`
- **Established Patterns:** If this is the first feature of its kind (first CRUD, first form, first RPC-backed feature), document the pattern established so future features can follow it. Example:
  ```
  - CRUD pattern: src/features/{domain}/ with schemas.ts, actions.ts, _components/, hooks/
  - Form pattern: React Hook Form + Zod resolver + Shadcn Form primitives
  ```

Write the updated `project-state.md`.

---

## ✅ What's Next

Tell the user:

"Implementation scaffolded. Run `/qa:new-tests` to generate unit, component, and E2E tests for this feature."

```
COMMAND_COMPLETE: implementation:new-feature
STATUS: success
FILES_CREATED: src/features/{domain}/schemas.ts, actions.ts, _components/, hooks/
FILES_MODIFIED: .claude/docs/project-state.md
NEXT_COMMAND: /qa:new-tests
```
