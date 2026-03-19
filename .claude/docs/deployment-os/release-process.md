# Release Process

> Part of the AI Software Factory — Deployment OS

## Branching Model

```
feature/*  ──┐
fix/*      ──┤  PR → dev   (lint + unit tests required)
             ↓
            dev            ← integration, always ahead of main
             ↓  PR → main  (lint + unit + E2E against staging required)
            main           ← staging always reflects this
             ↓  semantic-release auto-creates v* tag on every merge
           [tag]
             ↓  production deploy triggered
         production
```

**There is no `prod` branch.** Production is an event — a git tag — not a branch. The tag `v1.2.0` is immutable, auditable, and points to an exact commit. A `prod` branch would just be an always-stale copy of the last tag.

### Hotfix path (urgent production bugs only)

```
hotfix/*  ──→  PR → main   (fast-track: E2E still required, no dev gate)
                    ↓  also PR → dev to sync the fix back
```

Branch `hotfix/*` from `main` (which reflects what is in production). Fix, merge to `main`, tag immediately. Then open a second PR from `hotfix/*` into `dev` to prevent regression.

### Branch naming

```
feature/auth-magic-link
feature/dashboard-tenant-filter
fix/project-list-pagination
fix/rls-policy-missing-tenant-check
hotfix/payment-crash-null-profile
chore/update-dependencies
```

The prefix must match the intended commit type. This makes PR title pre-filling natural and keeps the branch list readable.

---

## Merge Strategies

Not all merges are equal. The strategy must match the purpose of each transition.

| Transition          | Strategy                   | Reason                                                                                                                                           |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `feature/*` → `dev` | **Squash and merge**       | Collapses WIP commits (`wip`, `fix typo`, `try this`) into one meaningful commit                                                                 |
| `fix/*` → `dev`     | **Squash and merge**       | One fix = one commit                                                                                                                             |
| `dev` → `main`      | **Merge commit (--no-ff)** | semantic-release reads individual commit messages on `main` to determine version bump — squash would collapse them into one and break versioning |
| `hotfix/*` → `main` | **Squash and merge**       | Single clean commit; semantic-release reads it as a patch                                                                                        |
| `hotfix/*` → `dev`  | **Merge commit**           | Sync without rewriting `dev` history                                                                                                             |

**Why not rebase for `dev` → `main`?**
Rebase rewrites SHA hashes. `dev` is a shared long-lived branch — rebasing it would diverge every developer's local copy and break the branch.

### Enforcing strategies in GitHub

In repository Settings → General → Pull Requests:

- ✅ Allow squash merging
- ✅ Allow merge commits
- ❌ Disable rebase merging (prevents accidental use)

Set the default merge strategy per branch via branch protection rules or document it clearly — GitHub does not enforce per-branch strategy natively.

---

## Commit Message Convention

This project follows **Conventional Commits**. Commit messages on `dev` and `main` must follow this format because semantic-release reads them to determine version bumps and changelog entries.

### Format

```
type(scope): short description in imperative mood

# Examples
feat(auth): add magic link login
fix(dashboard): correct tenant filter on project list
feat!: redesign project schema
chore: update dependencies
docs: update environment variable reference
refactor(api): extract shared error handler
test(projects): add tenant isolation E2E spec
ci: add paths-ignore to ci workflow
perf(cache): reduce cache tag granularity
```

### Types and version impact

| Type                                    | Version bump      | When to use                           |
| --------------------------------------- | ----------------- | ------------------------------------- |
| `feat`                                  | Minor (1.**X**.0) | New user-facing functionality         |
| `fix`                                   | Patch (1.0.**X**) | Bug fix                               |
| `feat!` or `BREAKING CHANGE:` in footer | Major (**X**.0.0) | Breaks backwards compatibility        |
| `perf`                                  | Patch             | Performance improvement               |
| `refactor`                              | No release        | Code restructure, no behaviour change |
| `test`                                  | No release        | Adding or updating tests              |
| `chore`                                 | No release        | Maintenance, dependency updates       |
| `docs`                                  | No release        | Documentation only                    |
| `ci`                                    | No release        | CI/CD configuration                   |
| `style`                                 | No release        | Formatting, whitespace                |
| `build`                                 | No release        | Build system changes                  |

### Scope convention

Scope is optional but recommended. Use the feature domain:

```
auth, dashboard, projects, billing, api, db, ui, config, cache, realtime
```

### Enforcing at the PR level

Individual commits on feature branches are not linted — forcing commitlint on every `wip` commit during active development is counterproductive.

Instead, enforce the **PR title** using `amannn/action-semantic-pull-request`. When squash-merging, GitHub uses the PR title as the commit message on the target branch. The PR title is the real commit.

See `.github/workflows/pr-title.yml` in the CI/CD documentation.

---

## Versioning — semantic-release

All version management is automated by **semantic-release**. No manual version bumps. No editing `package.json`. No `npm version` commands.

semantic-release runs automatically on every merge to `main`. It reads commits since the last release, determines the next version, creates a git tag, generates a changelog, and publishes the GitHub release.

If a push to `main` contains only `chore:`, `docs:`, `test:` or other non-release types, no release is created.

### Configuration

```json
// .releaserc.json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    ["@semantic-release/npm", { "npmPublish": false }],
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

```bash
npm install --save-dev \
  semantic-release \
  @semantic-release/changelog \
  @semantic-release/git \
  @semantic-release/github \
  @semantic-release/commit-analyzer \
  @semantic-release/release-notes-generator
```

---

## Docker Image

The Next.js application is built as a Docker image for deployment to Kubernetes.

### Build-once architecture

This project uses `next-runtime-env` to implement a true build-once, deploy-anywhere model. `NEXT_PUBLIC_*` variables are **not baked into the Docker image at build time**. Instead, they are injected at container start via Kubernetes ConfigMaps and read at request time by the server, which injects them into the client via a `<script>` tag.

This means a single Docker image SHA is built once, deployed to staging, validated, and then the exact same SHA is promoted to production. Nothing is rebuilt between environments.

See `environments.md` for the full `next-runtime-env` setup.

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Build — no NEXT_PUBLIC_ build args needed (next-runtime-env handles them at runtime)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Runtime
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

Enable standalone output in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  cacheComponents: true,
  output: "standalone"
};
```

### Image tagging

```
ghcr.io/org/app:sha-abc1234    ← every commit (staging uses this)
ghcr.io/org/app:v1.2.0         ← release tag (production always uses this)
```

Production deployments always use an explicit version tag — the same SHA that was validated in staging.

---

## Rollback

If a production release is broken:

1. Re-deploy the previous version tag — the previous image is always retained in the registry
2. Create a `hotfix/*` branch from `main`, fix forward
3. If a migration was applied, assess whether a down migration is needed — prefer additive schema changes (add before remove, never rename in a single step) so the previous app version still works against the new schema during rollback
