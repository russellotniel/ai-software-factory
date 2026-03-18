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

## EAS Build

The Expo app is built using **EAS Build** (Expo Application Services). There is no Docker image or server infrastructure to deploy — the deliverable is an iOS `.ipa` and Android `.aab` binary submitted to the App Store / Play Store.

### Build profiles (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "env": { "APP_ENV": "staging" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "APP_ENV": "production" }
    }
  }
}
```

### Build commands

```bash
# Development build (internal distribution)
eas build --profile development --platform all

# Preview build (staging — internal distribution via TestFlight / internal track)
eas build --profile preview --platform all

# Production build (App Store / Play Store submission)
eas build --profile production --platform all
```

### Image tagging equivalent

EAS assigns a build ID to every build. The production build ID is the immutable artifact that is submitted. Never re-submit a different build between staging validation and production release.

---

## EAS Submit

After a production build passes QA:

```bash
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## OTA Updates (EAS Update)

For JS-only changes (no native code changes), use EAS Update to push over-the-air without an App Store review:

```bash
eas update --branch production --message "Fix: moment feed sorting"
```

**When to use OTA vs full build:**
- OTA: JS logic changes, UI fixes, copy changes, query changes
- Full build: native dependency changes, Expo SDK upgrade, app.config.ts changes, new permissions

---

## Rollback

**JS changes (OTA):** Roll back by publishing the previous EAS Update channel:
```bash
eas update --branch production --message "Rollback: revert to previous bundle"
```

**Native builds:** Re-submit the previous build from EAS dashboard. Never delete old builds from EAS — they are retained automatically.

If a Supabase migration was part of the release, assess whether a down migration is needed — prefer additive schema changes so the previous app version still works against the new schema during rollback.
