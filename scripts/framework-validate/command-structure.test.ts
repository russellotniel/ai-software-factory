import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";

const ROOT = resolve(__dirname, "../..");

function getCommandFiles(): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".md")) {
        results.push(full);
      }
    }
  }
  walk(resolve(ROOT, ".claude/commands"));
  return results;
}

function deriveCommandId(filePath: string): string {
  const rel = relative(resolve(ROOT, ".claude/commands"), filePath);
  // foundation/init.md → foundation:init
  // architecture-os/new-feature.md → architecture:new-feature
  const parts = rel.replace(/\.md$/, "").split("/");
  const dir = parts[0].replace(/-os$/, "");
  const file = parts[1];
  return `${dir}:${file}`;
}

describe("command structure", () => {
  const files = getCommandFiles();

  it("discovers exactly 18 command files", () => {
    expect(files.length).toBe(18);
  });

  it.each(files.map((f) => [deriveCommandId(f), f]))(
    "%s has a level-1 heading",
    (_id, filePath) => {
      const content = readFileSync(filePath, "utf-8");
      expect(content).toMatch(/^# \//m);
    }
  );

  it.each(files.map((f) => [deriveCommandId(f), f]))(
    "%s has preconditions declared",
    (_id, filePath) => {
      const content = readFileSync(filePath, "utf-8");
      expect(content).toMatch(/\*\*Preconditions?:\*\*/);
    }
  );

  it.each(files.map((f) => [deriveCommandId(f), f]))(
    "%s has COMMAND_COMPLETE marker",
    (_id, filePath) => {
      const content = readFileSync(filePath, "utf-8");
      expect(content).toMatch(/COMMAND_COMPLETE:/);
    }
  );

  it.each(files.map((f) => [deriveCommandId(f), f]))(
    "%s COMMAND_COMPLETE ID matches path-derived ID",
    (id, filePath) => {
      const content = readFileSync(filePath, "utf-8");
      const match = content.match(/COMMAND_COMPLETE:\s*(\S+)/);
      expect(match).not.toBeNull();
      if (match) {
        expect(match[1]).toBe(id);
      }
    }
  );
});
