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
- **Is this a write action (mutation) or a read-only display?**
  - Write → scaffold Server Action + form/button component
  - Read-only → scaffold Server Component page + typed RPC call (no Server Action)
- Does it require a form (user input) or a triggered action (button, delete)?
- **Does the API contract reference an RPC or a direct table query?**
  Check `.claude/docs/architecture-os/api-contracts.md` for this feature.
  - Direct query → use `supabase.from('table').select()`
  - RPC → use `supabase.rpc('function_name', params)` with typed return interface

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

### Traceability

Add a `// @spec: {feature-name}` comment in every generated file to link it
back to the spec. The `{feature-name}` must match the spec filename (without
`.md`) from `.claude/docs/specs/{feature-name}.md`.

- In `schemas.ts` and utility files: add as the first line
- In `actions.ts`: add after the `'use server'` directive
- In components: add after the `'use client'` directive (if present)

### schemas.ts

```typescript
// @spec: {feature-name}
import { z } from 'zod';

export const {featureName}Schema = z.object({
  // fields
});

export type {FeatureName}Input = z.infer<typeof {featureName}Schema>;
```

### actions.ts

```typescript
'use server';
// @spec: {feature-name}

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

### RPC-backed actions (when the feature uses an RPC instead of direct queries)

When the API contract specifies an RPC, the action calls `supabase.rpc()` instead
of `supabase.from().select()`. Generate a typed return interface matching the RPC's
`json_build_object` or `RETURNS TABLE` structure.

```typescript
'use server';
// @spec: {feature-name}

import { requireAuth } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/actions';
import { logger } from '@/lib/logger';

// Type matching the RPC's return shape
export type {FeatureName}Result = {
  // fields from RETURNS TABLE or json_build_object
};

export async function {featureName}Action(
  input: {FeatureName}Input
): Promise<ActionResult<{FeatureName}Result>> {
  const { user } = await requireAuth();

  // ... validation ...

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('{rpc_function_name}', {
    p_param: parsed.data.value,
  });

  if (error) {
    logger.error("{featureName}Action: RPC failed", {
      action: "{featureName}Action",
      userId: user.id,
      errorCode: error.code,
      error: error.message,
    });
    return { success: false, error: { code: "DATABASE_ERROR", message: "Failed to load data" } };
  }

  return { success: true, data: data as {FeatureName}Result };
}
```

### Read-only Server Component pattern (no Server Action needed)

For features that only display data (dashboards, reports, summaries), skip the
Server Action and call the RPC directly in the Server Component page:

```typescript
// @spec: {feature-name}
// app/(dashboard)/{feature}/page.tsx — Server Component
import { requireAuth } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { connection } from 'next/server';

// Type matching the RPC's return shape
type {FeatureName}Data = {
  // fields from RETURNS TABLE or json_build_object
};

export default async function {FeatureName}Page() {
  const { user } = await requireAuth();
  await connection();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.rpc('{rpc_function_name}', {
    p_param: value,
  });

  return <{FeatureName}View data={(data as {FeatureName}Data) ?? defaultValue} />;
}
```

For read-only features, generate:
- The page Server Component with RPC call (above)
- A typed interface for the RPC return shape
- A presentational client component if interactivity is needed, or a server
  component if it's pure display
- No `actions.ts` or `schemas.ts` (no mutations)

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
- If this needs cached data, check `.claude/docs/data-fetching-os/caching-strategy.md`

---

## Step 4 — Update Project State

Read `.claude/docs/project-state.md`.

- **Backlog:** Update the feature's **Stage** column to `implementation ←`
- **Feature Timeline:** Set the `implementation` column to today's date
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
