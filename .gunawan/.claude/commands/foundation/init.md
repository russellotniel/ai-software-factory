# /foundation:init

Initialize the AI Software Factory for a project. Handles two scenarios:

- **New project** — bootstraps a full Next.js 16 + Supabase project from scratch
- **Existing project** — adds missing standardized files to a project already in progress

Both paths end at the same place: a fully wired project ready for `/foundation:discover`.

---

## Step 1 — Detect Mode

Ask: "Is this a new project or an existing one?"

---

## Path A — New Project

### Step A1 — Project Name

Ask: "What is the project name?" (used for the directory and package name, kebab-case)

### Step A2 — Bootstrap

Run the following in sequence. Show each command before running it.

```bash
# 1. Create Next.js project
npx create-next-app@latest {project-name} \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-git \
  --import-alias "@/*"

cd {project-name}

# 2. Initialize Supabase
npx supabase init

# 3. Install all standard dependencies
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  next-runtime-env \
  @tanstack/react-query \
  @tanstack/react-query-devtools \
  react-hook-form \
  @hookform/resolvers \
  zod

# 4. Install dev dependencies
npm install --save-dev \
  vitest \
  @vitejs/plugin-react \
  vite-tsconfig-paths \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  jsdom

# 5. Initialize Shadcn
npx shadcn@latest init
```

When Shadcn prompts:

- Style: Default
- Base color: Slate (or ask the user)
- CSS variables: Yes

### Step A3 — Generate Baseline Files

Proceed to Step 3 (Generate Files) below.

---

## Path B — Existing Project

### Step B1 — Scan Existing Structure

Check which baseline files already exist:

```bash
ls src/lib/supabase/ 2>/dev/null
ls src/lib/auth/ 2>/dev/null
ls src/types/ 2>/dev/null
ls src/lib/logger.ts 2>/dev/null
ls proxy.ts 2>/dev/null
ls next.config.ts 2>/dev/null
ls vitest.config.mts 2>/dev/null
ls playwright.config.ts 2>/dev/null
```

Report what exists and what's missing.
**Never overwrite a file that already exists.** Only generate what's missing.

### Step B2 — Check Dependencies

Run:

```bash
cat package.json
```

Identify which standard dependencies are missing. Install only the missing ones:

```bash
npm install {missing-packages}
```

### Step B3 — Generate Missing Files

Proceed to Step 3 (Generate Files) below, skipping any file that already exists.

---

## Step 3 — Generate Baseline Files

Generate each file below. For existing projects, skip files that already exist.

### `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true, // Required for 'use cache' directive
  output: "standalone", // Required for Docker deployment
  reactCompiler: false, // Enable per-project after evaluation
  productionBrowserSourceMaps: false,
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false }
};

export default nextConfig;
```

### `proxy.ts`

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
```

### `src/lib/supabase/server.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from Server Component — cookie mutations ignored
          }
        }
      }
    }
  );
}
```

### `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createBrowserClientInstance() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### `src/lib/supabase/proxy.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // IMPORTANT: always use getUser(), never getSession() in proxy
  await supabase.auth.getUser();

  return supabaseResponse;
}
```

### `src/lib/auth/server.ts`

```typescript
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthContext = {
  user: { id: string; email: string };
  tenantId: string;
  role: string;
};

export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_tenant_id, global_role")
    .eq("id", user.id)
    .single();

  if (!profile?.active_tenant_id) {
    redirect("/onboarding");
  }

  return {
    user: { id: user.id, email: user.email! },
    tenantId: profile.active_tenant_id,
    role: profile.global_role
  };
}
```

### `src/lib/logger.ts`

```typescript
type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

function formatEntry(level: LogLevel, message: string, context?: LogContext) {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context
  });
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatEntry("debug", message, context));
    }
  },
  info: (message: string, context?: LogContext) => {
    console.log(formatEntry("info", message, context));
  },
  warn: (message: string, context?: LogContext) => {
    console.warn(formatEntry("warn", message, context));
  },
  error: (message: string, context?: LogContext) => {
    console.error(formatEntry("error", message, context));
  }
};
```

### `src/lib/query-client.ts`

```typescript
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
      }
    }
  });
}
```

### `src/types/actions.ts`

```typescript
export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

export type ActionError = {
  code: ActionErrorCode;
  message: string;
  details?: Record<string, string[]> | unknown;
};

export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "DATABASE_ERROR"
  | "EXTERNAL_ERROR"
  | "INTERNAL_ERROR";
```

### `src/types/api.ts`

```typescript
export type ApiSuccessResponse<T = null> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T = null> = ApiSuccessResponse<T> | ApiErrorResponse;
```

### `src/types/database.ts`

```typescript
// Generated by Supabase CLI — never hand-edit this file
// Run: supabase gen types typescript --local > src/types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
```

### `app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { PublicEnvScript } from 'next-runtime-env';
import './globals.css';

export const metadata: Metadata = {
  title: 'App',
  description: '',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <PublicEnvScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### `app/api/health/route.ts`

```typescript
export async function GET() {
  return Response.json({
    status: "ok",
    env: process.env.APP_ENV,
    timestamp: new Date().toISOString()
  });
}
```

### `vitest.config.mts`

```typescript
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

### `vitest.setup.ts`

```typescript
import "@testing-library/jest-dom/vitest";
```

### `playwright.config.ts`

```typescript
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
    screenshot: "only-on-failure",
    outputDir: "./test-results"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
```

### `.env.example`

```bash
# Supabase — runtime injection via next-runtime-env + Kubernetes ConfigMap
# Never bake these into the Docker image as build args
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server-only — never prefix with NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
APP_ENV=local

# Optional: Keycloak (AD/LDAP auth only)
# KEYCLOAK_ISSUER=http://localhost:8080/realms/app
# KEYCLOAK_CLIENT_ID=nextjs-app
# KEYCLOAK_CLIENT_SECRET=your-secret
```

### `package.json` scripts — add these to existing scripts

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
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

## Step 4 — Confirm

Show a summary of everything generated and everything skipped (existing project only).

Ask: "Should I write all these files?"

On confirmation, write the files.

---

## Step 5 — Copy `.env.example` to `.env.local`

```bash
cp .env.example .env.local
```

Tell the user: "Fill in `.env.local` with your actual Supabase URL and keys before running the app."

---

## ✅ What's Next

Tell the user:

"Project initialized. Run `/foundation:discover` next to document your project's standards and generate `foundation/product-mission.md`."

```
Next command: /foundation:discover
```
