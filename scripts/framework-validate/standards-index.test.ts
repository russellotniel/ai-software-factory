import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

const ROOT = resolve(__dirname, "../..");

interface StandardEntry {
  id: string;
  keywords: string[];
  files: string[];
}

function loadIndex(): StandardEntry[] {
  const content = readFileSync(
    resolve(ROOT, ".claude/docs/standards-index.yml"),
    "utf-8"
  );
  const parsed = parse(content);
  return parsed.standards;
}

// Files that only exist after init or are runtime-generated
const GENERATED_FILES = new Set([
  ".claude/project-config.json",
  ".claude/docs/project-state.md",
]);

describe("standards-index", () => {
  const standards = loadIndex();

  it("standards-index.yml parses successfully", () => {
    expect(Array.isArray(standards)).toBe(true);
    expect(standards.length).toBeGreaterThan(0);
  });

  it("no duplicate standard IDs", () => {
    const ids = standards.map((s) => s.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it("every standard has at least one keyword", () => {
    const empty = standards.filter(
      (s) => !Array.isArray(s.keywords) || s.keywords.length === 0
    );
    expect(empty.map((s) => s.id)).toEqual([]);
  });

  it("all file references in standards-index.yml exist on disk", () => {
    const broken: string[] = [];
    for (const standard of standards) {
      for (const file of standard.files) {
        if (GENERATED_FILES.has(file)) continue;
        if (!existsSync(resolve(ROOT, file))) {
          broken.push(`${standard.id} → ${file}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });
});
