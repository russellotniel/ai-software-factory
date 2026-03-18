# CI/CD Pipeline

> Part of the AI Software Factory — Deployment OS
> Written for **Expo (React Native) + Supabase + EAS + GitHub Actions**

## Pipeline Overview

```
feature/* or fix/* branch
      ↓  (PR to dev)
   CI checks
      ↓  (merge to dev)
   Staging EAS Build (preview profile)
      ↓  (PR to main)
   CI checks + QA sign-off
      ↓  (merge to main → semantic-release tag)
   Production EAS Build + Submit
```

---

## CI Checks (on every PR)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [dev, main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run build   # TypeScript type check (tsc)
```

---

## Staging Build (on merge to dev)

```yaml
# .github/workflows/staging.yml
name: Staging Build

on:
  push:
    branches: [dev]

jobs:
  eas-build-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --profile preview --platform all --non-interactive
```

---

## Production Build + Submit (on semantic-release tag)

```yaml
# .github/workflows/production.yml
name: Production Release

on:
  push:
    tags: ['v*']

jobs:
  eas-build-production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --profile production --platform all --non-interactive
      - run: eas submit --platform ios --latest --non-interactive
      - run: eas submit --platform android --latest --non-interactive
```

---

## Required Secrets

| Secret | Purpose |
|---|---|
| `EXPO_TOKEN` | EAS authentication for CI builds |

Supabase credentials are embedded in the build profile via `eas.json` env vars or EAS Secrets — not GitHub secrets.

---

## Database Migrations in CI

Migrations are never run automatically in CI. Process:

1. Developer creates migration: `supabase migration new <name>`
2. Test migration locally: `supabase db reset`
3. PR reviewed and merged to dev
4. Migration applied manually to staging Supabase: `supabase db push --db-url $STAGING_DB_URL`
5. Validated on staging
6. Migration applied manually to production: `supabase db push --db-url $PRODUCTION_DB_URL`

Never apply migrations automatically in a deploy pipeline without explicit human approval.

---

## PR Title Enforcement

PR titles must follow Conventional Commits (enforced by `amannn/action-semantic-pull-request`):

```yaml
# .github/workflows/pr-title.yml
name: PR Title Check
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
