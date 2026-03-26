import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(__dirname, "../..");

// Match paths like .claude/docs/foundation/tech-standards.md or src/lib/auth/server.ts
const PATH_PATTERN =
  /`((?:\.claude|src|supabase)\/[\w\-/.]+\.\w+)`/g;

// Template placeholders — these are pattern references, not literal files
const PLACEHOLDER_PATTERN = /\{[^}]+\}/;

function collectMdFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  function walk(d: string) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".md")) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function extractFileRefs(content: string): string[] {
  const refs: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(PATH_PATTERN.source, "g");
  while ((match = regex.exec(content)) !== null) {
    const path = match[1];
    if (!PLACEHOLDER_PATTERN.test(path)) {
      refs.push(path);
    }
  }
  return [...new Set(refs)];
}

describe("cross-references", () => {
  const commandFiles = collectMdFiles(resolve(ROOT, ".claude/commands"));
  const docFiles = collectMdFiles(resolve(ROOT, ".claude/docs"));

  // Generated files that only exist after /foundation:init — skip these
  const GENERATED_FILES = new Set([
    ".claude/project-config.json",
    ".claude/docs/project-state.md",
  ]);

  // Files that init generates (referenced in init.md but don't exist in template)
  const INIT_GENERATED_PATTERNS = [
    /^src\/app\/.*auth/,
    /^src\/app\/.*onboarding/,
    /^src\/app\/.*dashboard/,
    /^supabase\/migrations\/\d/,
  ];

  it("all file references in commands resolve to existing files", () => {
    const broken: string[] = [];
    for (const file of commandFiles) {
      const content = readFileSync(file, "utf-8");
      const refs = extractFileRefs(content);
      for (const ref of refs) {
        if (GENERATED_FILES.has(ref)) continue;
        if (INIT_GENERATED_PATTERNS.some((p) => p.test(ref))) continue;
        if (!existsSync(resolve(ROOT, ref))) {
          const relFile = file.replace(ROOT + "/", "");
          broken.push(`${relFile} → ${ref}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("all file references in docs resolve to existing files", () => {
    const broken: string[] = [];
    for (const file of docFiles) {
      const content = readFileSync(file, "utf-8");
      const refs = extractFileRefs(content);
      for (const ref of refs) {
        if (GENERATED_FILES.has(ref)) continue;
        if (INIT_GENERATED_PATTERNS.some((p) => p.test(ref))) continue;
        if (!existsSync(resolve(ROOT, ref))) {
          const relFile = file.replace(ROOT + "/", "");
          broken.push(`${relFile} → ${ref}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("CLAUDE.md key document references all exist", () => {
    const claudeMd = readFileSync(
      resolve(ROOT, ".claude/CLAUDE.md"),
      "utf-8"
    );
    const refs = extractFileRefs(claudeMd);
    const broken = refs.filter(
      (ref) =>
        !GENERATED_FILES.has(ref) && !existsSync(resolve(ROOT, ref))
    );
    expect(broken).toEqual([]);
  });
});
