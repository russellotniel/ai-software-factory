# Gunawan — Foundation Changelog

Every change to the `.gunawan/` package must be logged here.
This is the audit trail for the foundation layer.

Format: `[YYYY-MM-DD] TYPE: description`
Types: `ADD` | `CHANGE` | `FIX` | `REMOVE` | `PROMOTE`

---

## 2026-04-10 — Gunawan Compliance & Project-Agnostic Refactor (Expo package)

**Context:** Aligned mobile-gunawan `.gunawan/` package with webapp-gunawan structure.
Added missing files, corrected path references, and made the package fully project-agnostic
so it can be copied to any Expo project without modification.

- `CHANGE` `.gunawan/CLAUDE.md` — Replaced old copy of root CLAUDE.md with proper Gunawan
  Behavioral Constitution governance file (Expo-adapted: Stack Defaults, React Native Rules,
  Caching Rules sections replace Next.js equivalents; deployment checklist updated)
- `ADD` `.gunawan/.mcp.json` — MCP configuration for Expo projects (context7 description
  updated to reference Expo SDK, Supabase, NativeWind instead of Next.js/Tailwind)
- `ADD` `.gunawan/CHANGELOG.md` — This file; audit trail for future `.gunawan/` changes
- `CHANGE` `.gunawan/standards-index.yml` — Updated all file paths to use `.gunawan/` prefix;
  updated tech-stack keywords for Expo (expo, react-native, nativewind, eas, metro);
  updated environments keywords (EXPO_PUBLIC, EAS); added consultant role entry;
  moved reference docs (product-mission, principles, auth, compliance, mcp) to
  `docs/knowledge/reference/` paths
- `FIX` `.gunawan/architecture-os/api-contracts.md` — Removed project-specific "Weeknd Core"
  scope reference; now reads "Expo (React Native) + Supabase"
- `FIX` `.gunawan/architecture-os/system-design.md` — Removed "Weeknd Expo" scope reference
- `FIX` `.gunawan/implementation-os/standards.md` — Removed "Weeknd Expo" scope reference

**Root-level changes (project operational layer):**
- `CHANGE` `CLAUDE.md` (root) — Updated Foundation Loading Order paths from `foundation/...`
  to `.gunawan/foundation/...`; added step 8 (docs/knowledge/README.md); updated Protected
  Files to reference `.gunawan/**`; fixed hook extensions from `.ps1` to `.sh`; updated
  Finding Standards paths to `.gunawan/` prefix
- `ADD` `.mcp.json` — Root-level MCP config (copy of `.gunawan/.mcp.json`)
- `ADD` `docs/knowledge/README.md` — Knowledge base index for this Expo package
- `ADD` `docs/knowledge/reference/` — Reference documents from GPT/Cursor era:
  auth-model.md, compliance-standards.md, mcp-setup.md (Expo-adapted), principles.md,
  product-mission.md, Shannon Agentic AI Foundation.md
- `ADD` `docs/knowledge/reflections/` — Reflections directory created

---

## How to Log Changes

When you modify any file inside `.gunawan/`:

1. Add an entry here in the format above
2. Write a reflection in `docs/knowledge/reflections/REFLECTION-[date]-[slug].md`
3. If the change affects the deployment process, update the checklist in `.gunawan/CLAUDE.md`
4. If the change affects a standard that projects already use, note the migration impact

Changes to `.gunawan/` are protected operations — explicit human approval required before any edit.
