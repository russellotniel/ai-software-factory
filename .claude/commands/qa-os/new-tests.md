# /qa:new-tests

Generate test scaffolding for a feature: unit tests for schemas and actions,
component tests for forms, and E2E specs for user flows.

**Preconditions:**
- `.claude/project-config.json` must exist (run `/foundation:init`)
- Feature code should exist in `src/features/{domain}/` (run `/implementation:new-feature`)

Read before starting:

- `.claude/project-config.json` — to determine multi-tenant (tenant isolation tests)
- `.claude/docs/qa-os/strategy.md`

---

## Step 1 — Feature Context

Read `.claude/project-config.json` before asking anything.
If `multiTenant` is `true`, tenant isolation tests are always included — do not ask the user.

Ask:

- What feature are we writing tests for?
- Where does the feature code live? (e.g. `src/features/projects/`)
- Does it have a form or just triggered actions?
- Is there an existing E2E spec for this domain, or is this new?

---

## Step 1.5 — Determine Risk Zone

Read `.claude/project-config.json` and check the `riskZones` configuration.
If `riskZones` is not configured, use these defaults:
- **Critical (Zone 1):** `src/lib/auth/*`, `supabase/migrations/*`
- **Standard (Zone 2):** `src/features/*/actions.ts`, `src/features/*/lib/*`, `src/lib/*`
- **Presentational (Zone 3):** `src/components/*`, `src/features/*/_components/*`, `src/app/**/page.tsx`

Match the feature's file paths against the zone patterns. A feature typically spans
multiple zones — its actions.ts may be Zone 2 while its _components/ are Zone 3.

Apply zone-appropriate test strategies:

### Zone 1 (Critical) — auth, migrations, data-writing actions
- All standard unit tests (Step 2)
- **Additional:** Property-based tests using fast-check for input validation schemas
- **Additional:** Edge case tests for auth bypass, invalid tokens, RLS circumvention
- **Additional:** Migration tests verifying RLS is enabled on every new table

### Zone 2 (Standard) — feature logic, server actions
- All standard unit tests (Step 2)
- Component tests (Step 3)
- E2E specs (Step 4)

### Zone 3 (Presentational) — UI components, pages
- Smoke tests: renders without crashing, displays expected content
- Accessibility checks: labels, alt text, keyboard navigation
- Skip detailed unit tests for pure presentational components with no logic

---

## Step 2 — Unit Tests

### Traceability

Add a `// @spec: {feature-name}` comment as the first line in every test file.
The `{feature-name}` must match the spec filename from `.claude/docs/specs/`.

### schemas.test.ts

Test every Zod schema:

- Valid input passes
- Each required field: missing → fails with correct message
- Each field constraint: wrong type, too short, too long, invalid format

```typescript
// @spec: {feature-name}
import { describe, it, expect } from 'vitest';
import { {featureName}Schema } from './schemas';

describe('{featureName}Schema', () => {
  it('accepts valid input', () => {
    const result = {featureName}Schema.safeParse({ /* valid */ });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = {featureName}Schema.safeParse({});
    expect(result.success).toBe(false);
  });
});
```

### actions.test.ts

Mock Supabase and auth. Test:

- Happy path returns `{ success: true, data: ... }`
- Invalid input returns `{ success: false, error: ... }`
- Unauthenticated call is rejected
- Wrong tenant cannot access another tenant's data

**Important: `vi.mock` hoisting.** Vitest hoists `vi.mock()` calls to the top of
the file, before any `const` or `let` declarations. This means you cannot reference
top-level variables (like `const USER_ID = '...'`) inside a `vi.mock()` factory.
Instead, inline literal values directly in the mock factory:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { {featureName}Action } from './actions';

// ✅ Correct — inline literal values in vi.mock factory
vi.mock('@/lib/auth/server', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: '770e8400-e29b-41d4-a716-446655440000', email: 'test@example.com' },
    role: 'user',
  }),
}));

// ❌ Wrong — USER_ID is not yet defined when vi.mock runs
// const USER_ID = '770e8400-e29b-41d4-a716-446655440000';
// vi.mock('@/lib/auth/server', () => ({
//   requireAuth: vi.fn().mockResolvedValue({ user: { id: USER_ID } }),
// }));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockReturnValue({ from: vi.fn().mockReturnThis() }),
}));
```

---

## Step 3 — Component Tests

If the feature has a form component:

- Renders without crashing
- Shows validation errors on invalid submit
- Calls the action with correct data on valid submit
- Disables submit button while pending

---

## Step 4 — E2E Spec

### Standard flow

- User completes the primary action end-to-end
- Success state is visible
- Data appears correctly in subsequent view

### Tenant isolation (when `multiTenant: true` in project-config.json — always include, never skip)

- Tenant A creates data
- Tenant B cannot see or access that data
- Use two `browser.newContext()` instances (two sessions)

```typescript
test("tenant isolation: {domain}", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  // create as A, verify B cannot access
  await contextA.close();
  await contextB.close();
});
```

---

## Step 5 — Confirm and Write

Show generated files. Ask: "Should I write these to the repo?"
On confirmation, write files alongside feature code, then run:

```bash
npm test -- src/features/{domain}/
```

Fix any failures before finishing.

---

## Step 6 — Update Project State

Read `.claude/docs/project-state.md`.

- Update the feature's **Stage** column to `tested ←`
- In the **Feature Timeline** section, set the `tested` column to today's date

Write the updated `project-state.md`.

---

## ✅ What's Next

Tell the user:

"Tests scaffolded. Run `/qa:fix` to run the test suite and fix any failures."

```
COMMAND_COMPLETE: qa:new-tests
STATUS: success
FILES_CREATED: src/features/{domain}/schemas.test.ts, actions.test.ts, _components/*.test.tsx, e2e/{domain}.spec.ts
NEXT_COMMAND: /qa:fix
```
