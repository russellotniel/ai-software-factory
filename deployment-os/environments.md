# Environments

> Part of the AI Software Factory — Deployment OS

## Environment Structure

Every project runs exactly three environments. No exceptions.

| Environment  | Purpose                                | Supabase project                             | Deployment trigger       |
| ------------ | -------------------------------------- | -------------------------------------------- | ------------------------ |
| `local`      | Individual developer machines          | Separate per developer or shared dev project | Manual (`npm run dev`)   |
| `staging`    | Integration testing, QA, client review | Dedicated staging project                    | PR to `main` (validated) |
| `production` | Live application                       | Dedicated production project                 | Release tag (`v*`)       |

**Never share a Supabase project between environments.** Staging and production must be completely isolated — separate databases, separate auth configurations, separate service keys.

---

## Build Once, Deploy Anywhere

### The problem with `NEXT_PUBLIC_*` variables

`NEXT_PUBLIC_*` variables in Next.js are **inlined into the JavaScript bundle at `next build` time**. They are not environment variables read at runtime — they are string replacements baked into the compiled output. If you build with `NEXT_PUBLIC_SUPABASE_URL=https://staging.internal`, that string is hardcoded in every client bundle that comes out of the build. Deploying that image to production points your frontend at staging.

The consequence: if you follow the naive approach (pass `NEXT_PUBLIC_*` as Docker `--build-arg`), you must build a separate image for staging and production. The staging image and the production image are different binaries. You are not testing the same artifact that goes to production.

### The solution: `next-runtime-env`

Install `next-runtime-env`:

```bash
npm install next-runtime-env
```

This library reads `NEXT_PUBLIC_*` variables from the server's environment at **request time** and injects them into the client via a `<script>` tag in the root layout. The client reads them from `window.__ENV` instead of from the inlined bundle.

### Setup

**1. Add `<PublicEnvScript />` to your root layout:**

```tsx
// app/layout.tsx
import { PublicEnvScript } from "next-runtime-env";

export default function RootLayout({
  children
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

**2. Use `env()` instead of `process.env.NEXT_PUBLIC_*` in client components:**

```typescript
// Before (build-time, baked into bundle)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// After (runtime, read from window.__ENV on client, process.env on server)
import { env } from "next-runtime-env";
const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
```

**3. In Server Components, `process.env` still works as normal** — no change needed there. `env()` is primarily needed in Client Components.

**4. Inject values via Kubernetes ConfigMap at container start:**

```yaml
# k8s/staging/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nextjs-env
  namespace: app-staging
data:
  NEXT_PUBLIC_SUPABASE_URL: "https://staging-supabase.internal"
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "your-staging-anon-key"
  NEXT_PUBLIC_APP_URL: "https://staging.yourapp.com"
  APP_ENV: "staging"
```

Reference the ConfigMap in your Deployment spec via `envFrom`. The container reads these values at start time, the server injects them into the first response, the client picks them up from `window.__ENV`.

### Result

One Docker image SHA is built once, deployed to staging, validated by E2E, then the exact same SHA is promoted to production by changing which ConfigMap is mounted. Nothing is rebuilt. The artifact that passes E2E is the artifact that ships.

---

## Environment Variables

### Variable reference

```bash
# .env.local (developer machine — never committed)

# Supabase (runtime — no build-time baking needed)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>    # server-only, never NEXT_PUBLIC_

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENV=local

# Optional: Keycloak (if AD/LDAP auth variant)
KEYCLOAK_ISSUER=http://localhost:8080/realms/app
KEYCLOAK_CLIENT_ID=nextjs-app
KEYCLOAK_CLIENT_SECRET=<secret>
```

Staging and production values are injected via Kubernetes ConfigMaps (public vars) and Kubernetes Secrets (private vars). They are not set as GitHub Actions secrets except for the database URL used during CI migration steps.

### Rules

- `NEXT_PUBLIC_` — browser-safe values. Use `env()` from `next-runtime-env` in client components to read these.
- No `NEXT_PUBLIC_` prefix — server-only. `SUPABASE_SERVICE_ROLE_KEY` must never be prefixed with `NEXT_PUBLIC_`. Read via `process.env` in Server Components and Server Actions only.
- `.env.local` is gitignored. Never commit secrets.
- `.env.example` is committed with all variable names and placeholder values. Update it whenever a new variable is added.

---

## Self-Hosted Supabase (Kubernetes / Docker)

This factory targets self-hosted Supabase on Kubernetes (AKS or OCP). Each environment maps to a separate Supabase deployment.

### Per-environment isolation

```
Kubernetes cluster
├── namespace: app-staging     → staging Supabase + staging Next.js
└── namespace: app-production  → production Supabase + production Next.js
```

Each namespace has its own: PostgreSQL instance, Supabase Auth, PostgREST, Kong gateway, and optionally Realtime. They share nothing.

### `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  output: "standalone", // Required for minimal Docker image
  productionBrowserSourceMaps: false
};

export default nextConfig;
```

No `NEXT_PUBLIC_*` build args. No environment-specific build steps.

---

## Database Migrations

Migrations always flow in one direction: `local → staging → production`.

```
Developer writes migration
        ↓
Validates locally (supabase db reset --local)
        ↓
PR to main → CI applies migration to staging
        ↓
E2E tests run against migrated staging
        ↓
Merge + release tag → CI applies migration to production
```

Migrations are never run manually in production. They are always part of the CI pipeline.

```bash
# Applied automatically by CI
npx supabase db push --db-url $DATABASE_URL
```

Schema changes must be backward-compatible with the previous application version — add columns before removing them, never rename in a single migration — so that a rollback (re-deploying the previous image) still works against the new schema.

---

## Feature Flags

For features deployed but not yet enabled in production, use environment-based flags.

```typescript
// lib/flags.ts
export const flags = {
  newBillingFlow: process.env.APP_ENV !== "production",
  aiRecommendations: process.env.ENABLE_AI === "true"
} as const;
```

Graduate to a dedicated feature flag service (LaunchDarkly, Unleash) only when deployment complexity justifies it.
