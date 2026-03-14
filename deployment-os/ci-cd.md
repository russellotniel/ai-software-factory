# CI/CD

> Part of the AI Software Factory — Deployment OS

## Overview

Four GitHub Actions workflows cover the full pipeline.

| Workflow         | Trigger                                               | Purpose                                        |
| ---------------- | ----------------------------------------------------- | ---------------------------------------------- |
| `pr-title.yml`   | PR opened / edited                                    | Validate PR title follows Conventional Commits |
| `ci.yml`         | Push to feature/fix/hotfix/dev, PR to dev or main     | Lint, type-check, unit + component tests       |
| `staging.yml`    | PR to `main` → deploy + E2E; push to `main` → release | Staging gate + semantic-release                |
| `production.yml` | Tag `v*`                                              | Build production image, deploy to production   |

### The staging gate

E2E tests run against staging **on the PR to `main`**, not after the merge. The PR stays open until staging validates. By the time code merges to `main`, it has already been tested on staging. The merge is confirmation, not a trigger for further testing.

```
PR opened: dev → main
    ↓
staging.yml: build image (sha tag) → deploy staging → E2E
    ↓ (passes)
Reviewer approves → merge to main
    ↓
staging.yml: semantic-release only (staging already clean)
    ↓ (if release warranted)
tag v1.2.0 created
    ↓
production.yml: build prod image (v1.2.0 tag) → deploy production
```

---

## Workflow: PR Title Validation (`pr-title.yml`)

Ensures every PR title follows Conventional Commits. Since squash merges use the PR title as the commit message, this is the real commit linter.

```yaml
# .github/workflows/pr-title.yml
name: PR Title

on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

jobs:
  validate:
    name: Validate PR Title
    runs-on: ubuntu-latest
    steps:
      - uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            hotfix
            perf
            refactor
            test
            chore
            docs
            ci
            style
            build
          requireScope: false
          subjectPattern: ^[A-Z]?.+$
          subjectPatternError: >
            The PR title must follow Conventional Commits format:
            type(scope): description
```

---

## Workflow: CI (`ci.yml`)

Fast feedback on every push. Target: under 3 minutes. Does not run on `main` (staging.yml owns that path) or on markdown/config-only changes.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches:
      - dev
      - "feature/**"
      - "fix/**"
      - "hotfix/**"
      - "chore/**"
    paths-ignore:
      - "**/*.md"
      - ".github/CODEOWNERS"
      - ".editorconfig"
      - ".gitignore"
      - "docs/**"
  pull_request:
    branches: [dev, main]
    paths-ignore:
      - "**/*.md"
      - ".github/CODEOWNERS"
      - ".editorconfig"
      - ".gitignore"
      - "docs/**"

# Cancel in-progress runs for the same branch when a new push arrives
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

  unit:
    name: Unit & Component Tests
    runs-on: ubuntu-latest
    needs: lint-typecheck
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: vitest-coverage
          path: coverage/
          retention-days: 7
```

Add to `package.json`:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Workflow: Staging (`staging.yml`)

Owns two distinct triggers with different purposes.

**On PR to `main`:** build the image, deploy to staging, run E2E. This is the quality gate.
**On push to `main`:** run semantic-release only. Staging was already validated by the PR.

```yaml
# .github/workflows/staging.yml
name: Staging

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
    paths-ignore:
      - "**/*.md"
      - "docs/**"
  push:
    branches: [main]
    paths-ignore:
      - "**/*.md"
      - "docs/**"

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

# One staging deploy at a time — don't cancel in-progress deploys
concurrency:
  group: staging-deploy
  cancel-in-progress: false

jobs:
  # ── Runs on PR to main only ──────────────────────────────────────────────
  build:
    name: Build & Push Staging Image
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    permissions:
      contents: read
      packages: write
    outputs:
      sha-tag: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
          # Registry cache: stored in GHCR as a separate tag.
          # More reliable than type=gha — no 10 GB limit, no eviction.
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max,image-manifest=true

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Apply staging migrations
        run: npx supabase db push --db-url ${{ secrets.STAGING_DATABASE_URL }}

      - name: Deploy to Kubernetes (staging)
        uses: azure/k8s-deploy@v5
        with:
          namespace: app-staging
          images: ${{ needs.build.outputs.sha-tag }}
          manifests: k8s/staging/

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/nextjs-app \
            -n app-staging --timeout=120s

  e2e:
    name: E2E Tests (Staging)
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.STAGING_APP_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
          TENANT_A_EMAIL: ${{ secrets.TENANT_A_EMAIL }}
          TENANT_A_PASSWORD: ${{ secrets.TENANT_A_PASSWORD }}
          TENANT_B_EMAIL: ${{ secrets.TENANT_B_EMAIL }}
          TENANT_B_PASSWORD: ${{ secrets.TENANT_B_PASSWORD }}

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
          retention-days: 14

  # ── Runs on push to main only (after PR merged) ──────────────────────────
  release:
    name: Semantic Release
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run semantic-release
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Workflow: Production (`production.yml`)

Triggered only by a release tag created by semantic-release. Builds the production image — the same source commit as the staging-validated SHA, but tagged with the version and built with production environment values injected via Kubernetes ConfigMap at runtime (not at build time).

```yaml
# .github/workflows/production.yml
name: Production

on:
  push:
    tags: ["v*"]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-production:
    name: Build Production Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      version: ${{ steps.version.outputs.VERSION }}
    steps:
      - uses: actions/checkout@v4

      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push production image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.version.outputs.VERSION }}
          # Reuse the build cache populated by staging — production build is typically a cache hit
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max,image-manifest=true

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-production
    environment: production # Requires manual approval in GitHub
    steps:
      - uses: actions/checkout@v4

      - name: Apply production migrations
        run: npx supabase db push --db-url ${{ secrets.PROD_DATABASE_URL }}

      - name: Deploy to Kubernetes (production)
        uses: azure/k8s-deploy@v5
        with:
          namespace: app-production
          images: >
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ needs.build-production.outputs.version }}
          manifests: k8s/production/

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/nextjs-app \
            -n app-production --timeout=180s

      - name: Smoke test
        run: curl -f ${{ secrets.PROD_APP_URL }}/api/health || exit 1
```

---

## Required GitHub Secrets

Configure in GitHub → Settings → Secrets and variables → Actions.

Use **Environments** (`staging`, `production`) for environment-specific secrets so they are only accessible to the corresponding workflow jobs.

### Environment: `staging`

| Secret                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `STAGING_DATABASE_URL` | Direct Postgres URL for migration        |
| `STAGING_APP_URL`      | Public URL of staging app                |
| `TEST_USER_EMAIL`      | E2E test account email                   |
| `TEST_USER_PASSWORD`   | E2E test account password                |
| `TENANT_A_EMAIL`       | Tenant isolation test: Tenant A email    |
| `TENANT_A_PASSWORD`    | Tenant isolation test: Tenant A password |
| `TENANT_B_EMAIL`       | Tenant isolation test: Tenant B email    |
| `TENANT_B_PASSWORD`    | Tenant isolation test: Tenant B password |

### Environment: `production`

| Secret              | Description                       |
| ------------------- | --------------------------------- |
| `PROD_DATABASE_URL` | Direct Postgres URL for migration |
| `PROD_APP_URL`      | Public URL of production app      |

### Note on `NEXT_PUBLIC_*` secrets

With `next-runtime-env`, there are **no `NEXT_PUBLIC_*` variables in GitHub secrets**. Public env vars (`SUPABASE_URL`, `ANON_KEY`, `APP_URL`) are injected at container start via Kubernetes ConfigMaps, not baked into the Docker image. The image is built once and deployed to both environments unchanged.

---

## Health Check Endpoint

The production smoke test hits `/api/health`. Add this to every project:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: "ok",
    env: process.env.APP_ENV,
    timestamp: new Date().toISOString()
  });
}
```

---

## Kubernetes Manifests

See `k8s-sizing.md` for resource sizing guidance and the `/deployment:k8s-config` Claude Code command to generate project-specific manifests.

Keep staging and production manifests in separate directories — their replica counts, resource limits, and ingress configuration are meaningfully different and should be explicit:

```
k8s/
├── staging/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml    ← NEXT_PUBLIC_* runtime values for staging
│   └── ingress.yaml
└── production/
    ├── deployment.yaml
    ├── service.yaml
    ├── configmap.yaml    ← NEXT_PUBLIC_* runtime values for production
    └── ingress.yaml
```
