# QA Strategy

> Part of the AI Software Factory — QA OS
> Written for **Next.js 16 + Supabase** (self-hosted)

## Philosophy

Tests protect against regressions and document expected behaviour. The goal is confidence at the boundary that matters most — not maximum coverage. Every minute spent on a test that doesn't prevent a real failure is a minute not spent building.

**Write tests in this order of value:**

1. Critical user flows (auth, billing, tenant isolation) — E2E
2. Business logic in isolation (Server Actions, RPCs, Zod schemas) — unit
3. Client Component behaviour (forms, interactions) — component
4. Integration between layers — as needed, not by default

---

## Stack

| Scope            | Tool                                    | Why                                                                                    |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| Unit + Component | Vitest + React Testing Library          | Fast, ESM-native, works with Turbopack, near-zero config for Next.js                   |
| E2E              | Playwright                              | Multi-browser, async Server Components only testable here, first-class Next.js support |
| Assertion        | Vitest built-in (`expect`)              | No separate library needed                                                             |
| Mocking          | Vitest (`vi.mock`, `vi.fn`, `vi.spyOn`) | Built-in, no `jest-mock` equivalent needed                                             |

**Note on async Server Components:** Vitest cannot render async Server Components. This is a current limitation of the React ecosystem. Test them via Playwright E2E only.

---

## Test Types and What Belongs in Each

### Unit Tests (Vitest)

Test a single function in isolation with no rendering, no network, no database.

**What belongs here:**

- Zod schemas — validate all valid and invalid input shapes
- `ActionResult<T>` logic — transformation, normalisation, error mapping
- Utility functions in `lib/`
- RPC return type transformations
- Auth helper logic (non-async, pure functions)
- Date/currency/string formatting

```typescript
// features/projects/schemas.test.ts
import { describe, it, expect } from "vitest";
import { CreateProjectSchema } from "./schemas";

describe("CreateProjectSchema", () => {
  it("accepts valid input", () => {
    const result = CreateProjectSchema.safeParse({
      name: "My Project",
      status: "active"
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = CreateProjectSchema.safeParse({
      name: "",
      status: "active"
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.name).toBeDefined();
  });

  it("rejects unknown status", () => {
    const result = CreateProjectSchema.safeParse({
      name: "Valid",
      status: "unknown"
    });
    expect(result.success).toBe(false);
  });
});
```

### Component Tests (Vitest + React Testing Library)

Test a Client Component in a jsdom environment. Interactions, state changes, and form submission behaviour only — no Server Components, no real network calls.

**What belongs here:**

- Form components — render, validation errors, submit state
- UI state — loading states, conditional rendering, disabled states
- Event handlers — click, change, submit
- Accessibility — roles, labels, keyboard navigation

**What does NOT belong here:**

- Server Actions (mock them)
- Supabase queries (mock them)
- Async Server Components (use E2E)

```typescript
// _components/CreateProjectForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateProjectForm } from './CreateProjectForm';

// Mock the Server Action — component tests never call real server code
vi.mock('../actions', () => ({
  createProject: vi.fn(),
}));

import { createProject } from '../actions';

describe('CreateProjectForm', () => {
  it('renders the name field and submit button', () => {
    render(<CreateProjectForm tenantId="tenant-1" />);
    expect(screen.getByRole('textbox', { name: /project name/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /create project/i })).toBeDefined();
  });

  it('disables submit button while pending', async () => {
    vi.mocked(createProject).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    const user = userEvent.setup();
    render(<CreateProjectForm tenantId="tenant-1" />);

    await user.type(screen.getByRole('textbox', { name: /project name/i }), 'My Project');
    await user.click(screen.getByRole('button', { name: /create project/i }));

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
  });

  it('shows error message on failure', async () => {
    vi.mocked(createProject).mockResolvedValue({ success: false, error: 'VALIDATION_ERROR' });
    const user = userEvent.setup();
    render(<CreateProjectForm tenantId="tenant-1" />);

    await user.type(screen.getByRole('textbox', { name: /project name/i }), 'x');
    await user.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });
});
```

### E2E Tests (Playwright)

Test complete user flows in a real browser against a running Next.js server. This is the right layer for:

- Authentication flows (sign in, sign out, token refresh)
- Tenant isolation — verify user A cannot see user B's data
- Critical business flows — create, edit, delete key entities
- Async Server Components (only testable here)
- Navigation and routing
- RLS enforcement — assert that a Supabase query actually returns the right rows

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("signs in and reaches dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: /dashboard/i })
    ).toBeVisible();
  });

  test("signs out and clears session", async ({ page }) => {
    // ... sign in first ...
    await page.click('[data-testid="sign-out"]');
    await expect(page).toHaveURL(/\/sign-in/);

    // Session cleared — direct navigation to protected route redirects
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
```

```typescript
// e2e/tenant-isolation.spec.ts
import { test, expect } from "@playwright/test";

test("tenant A cannot access tenant B projects", async ({ browser }) => {
  // Two independent browser contexts = two separate sessions
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // Sign in as tenant A user, create a project
  await signIn(
    pageA,
    process.env.TENANT_A_EMAIL!,
    process.env.TENANT_A_PASSWORD!
  );
  await pageA.goto("/dashboard/projects");
  const projectName = `Tenant A Project ${Date.now()}`;
  await createProject(pageA, projectName);

  // Tenant B user cannot see it
  await signIn(
    pageB,
    process.env.TENANT_B_EMAIL!,
    process.env.TENANT_B_PASSWORD!
  );
  await pageB.goto("/dashboard/projects");
  await expect(pageB.getByText(projectName)).not.toBeVisible();

  await contextA.close();
  await contextB.close();
});
```

---

## Configuration

### Vitest

```typescript
// vitest.config.mts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["e2e/**", "**/*.config.*", "**/types/**"]
    }
  }
});
```

```typescript
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

### Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } }
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
```

### `package.json` scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## File Placement

```
src/
├── features/
│   └── projects/
│       ├── actions.ts
│       ├── actions.test.ts          # Unit — pure logic in the action
│       ├── schemas.ts
│       ├── schemas.test.ts          # Unit — Zod schema coverage
│       └── _components/
│           ├── CreateProjectForm.tsx
│           └── CreateProjectForm.test.tsx  # Component test
├── lib/
│   └── utils/
│       ├── format.ts
│       └── format.test.ts           # Unit — pure formatting functions
e2e/
├── auth.spec.ts                     # Auth flows
├── tenant-isolation.spec.ts         # Tenant boundary tests
├── projects.spec.ts                 # Project CRUD flows
└── helpers/
    ├── auth.ts                      # Shared sign-in helpers
    └── fixtures.ts                  # Test data factories
```

Colocate unit and component tests with the file they test. E2E tests always in `e2e/` at the project root.

---

## What to Mock and What Not To

### Always mock in unit/component tests

- Server Actions (`vi.mock('../actions')`)
- Supabase client (`vi.mock('@/lib/supabase/client')`)
- `next/navigation` (`vi.mock('next/navigation', () => ({ useRouter: vi.fn(), useSearchParams: vi.fn() }))`)
- `next/headers` (not available in jsdom)
- External APIs

### Never mock in E2E tests

- The database — E2E tests run against a real staging Supabase project
- Next.js routing — use real page navigation
- Auth — use real test accounts

### Use a separate test environment

E2E tests run against a dedicated test Supabase project (not staging, not production). Seed it with known test accounts and data. Reset between test runs where needed.

```
.env.test
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=...
TENANT_A_EMAIL=tenant-a@example.com
TENANT_B_EMAIL=tenant-b@example.com
```

---

## Claude Code Integration

Claude Code can read Vitest terminal output directly and act on failures — fix code, re-run, iterate. For Playwright, it can also view failure screenshots natively since it processes images.

Configure Playwright to write screenshots to a flat directory so Claude Code can find them without parsing the HTML report:

```typescript
// playwright.config.ts
use: {
  screenshot: 'only-on-failure',
  outputDir: './test-results',   // screenshots land at test-results/{test-name}/test-failed-1.png
  trace: 'on-first-retry',
},
```

This setup enables the `/qa:fix` Claude Code command: run tests → read failures → view screenshots if present → patch source → re-run. Commands are defined in `.claude/commands/qa/`.

---

## CI Integration

```yaml
# .github/workflows/test.yml (excerpt — full pipeline in deployment-os)
jobs:
  unit:
    name: Unit & Component Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: npm test

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: unit
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
      - run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

E2E runs only on `main` and release branches, not on every feature branch push.

---

## Coverage Targets

Coverage is a signal, not a goal. These are floor values — not targets to optimise toward.

| Layer                | Minimum coverage       | Focus areas                                   |
| -------------------- | ---------------------- | --------------------------------------------- |
| Unit (Zod schemas)   | 100%                   | Every valid shape, every rejection case       |
| Unit (lib utilities) | 80%                    | Edge cases, null/undefined, boundary values   |
| Component            | 70%                    | Render, interaction, error states             |
| E2E                  | Critical flows covered | Auth, tenant isolation, core CRUD per feature |

Do not chase coverage numbers by testing implementation details. A test that asserts on internal state rather than observable behaviour will break on refactor and provide no real protection.

---

## Anti-Patterns

| Anti-pattern                         | Problem                           | Correct approach                                    |
| ------------------------------------ | --------------------------------- | --------------------------------------------------- |
| Testing implementation details       | Breaks on refactor, no protection | Test what the user sees and does                    |
| Snapshot tests on complex components | Brittle, uninformative diffs      | Assert on specific roles and text                   |
| Mocking in E2E                       | Defeats the purpose of E2E        | Run against real test environment                   |
| Skipping RLS tests                   | Tenant isolation silently broken  | Always have a tenant isolation E2E spec             |
| Unit testing async Server Components | Not supported by Vitest/jsdom     | Use Playwright E2E                                  |
| One large E2E per feature            | Slow, hard to debug               | Small focused specs per flow                        |
| No test environment isolation        | E2E tests pollute each other      | Separate test Supabase project, seed/reset strategy |
