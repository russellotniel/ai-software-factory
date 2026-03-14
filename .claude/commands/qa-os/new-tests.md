# /qa:new-tests

Generate test scaffolding for a feature: unit tests for schemas and actions,
component tests for forms, and E2E specs for user flows.

Read `qa-os/strategy.md` before starting.

---

## Step 1 — Feature Context

Ask:

- What feature are we writing tests for?
- Where does the feature code live? (e.g. `src/features/projects/`)
- Does it have a form or just triggered actions?
- Does it have tenant isolation requirements? (almost always yes — confirm)
- Is there an existing E2E spec for this domain, or is this new?

---

## Step 2 — Unit Tests

### schemas.test.ts

Test every Zod schema:

- Valid input passes
- Each required field: missing → fails with correct message
- Each field constraint: wrong type, too short, too long, invalid format

```typescript
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

```typescript
import { describe, it, expect, vi } from 'vitest';
import { {featureName}Action } from './actions';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn().mockReturnValue({ from: vi.fn().mockReturnThis() }),
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

### Tenant isolation (always include)

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

## ✅ What's Next

Tell the user:

"Tests scaffolded. Run `/qa:fix` to run the test suite and fix any failures."

```
Next command: /qa:fix
```
