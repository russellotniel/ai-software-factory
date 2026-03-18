# Environments

> Part of the AI Software Factory — Deployment OS
> Written for **Expo (React Native) + Supabase + EAS**

## Environment Structure

Every project runs three environments:

| Environment | Purpose | Supabase Project | App Distribution |
|---|---|---|---|
| `local` | Individual developer machines | Local Supabase (supabase start) or shared dev project | Expo Go / dev client |
| `staging` | Integration testing, QA, client review | Separate staging Supabase project | EAS preview build (TestFlight / internal track) |
| `production` | Live application | Production Supabase project | App Store / Play Store |

Same schema across all environments. Never test migrations directly on production — always staging first.

---

## Environment Variables

### Client-exposed vars (`EXPO_PUBLIC_*`)

Bundled into the app binary. Validated at startup via Zod in `src/constants/env.ts`.

```bash
EXPO_PUBLIC_SUPABASE_URL=     # Supabase project URL
EXPO_PUBLIC_SUPABASE_KEY=     # Supabase anon key
```

If either is missing or malformed, the app crashes immediately with a clear error message.

### Server-only vars (Expo API routes)

Used only in `src/app/api/` route handlers — never bundled into the client.

```bash
GOOGLE_MAPS_API_KEY=          # Used in api/maps/ proxy route only
```

### EAS env var management

Per-environment vars are managed in `eas.json` under the `env` key, or via EAS Secrets for sensitive values:

```bash
# Set a secret for production
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "..."
```

---

## Build-Once Equivalent

Unlike Next.js build-once-deploy-anywhere (next-runtime-env), Expo builds are tied to environment at build time via `app.config.ts`. The `preview` build uses staging Supabase credentials; the `production` build uses production credentials.

This means **the preview build and production build are separate binaries** — the same binary is not promoted between environments. QA validates the preview build, then a production build is triggered and submitted to the stores.

---

## Local Development

```bash
# Start Expo dev server
npm start

# With a specific environment
APP_ENV=staging npx expo start

# Start local Supabase (optional — can use shared dev project)
supabase start
```
