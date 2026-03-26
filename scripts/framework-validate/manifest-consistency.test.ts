import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

function readJSON(relPath: string) {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), "utf-8"));
}

function globCommands(): string[] {
  const { readdirSync, statSync } = require("node:fs");
  const { join, relative } = require("node:path");

  const results: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".md")) {
        results.push(relative(ROOT, full));
      }
    }
  }
  walk(resolve(ROOT, ".claude/commands"));
  return results;
}

describe("manifest consistency", () => {
  const manifest = readJSON(".claude/command-manifest.json");
  const commands: Array<{
    id: string;
    path: string;
    next?: string[];
  }> = manifest.commands;
  const commandIds = new Set(commands.map((c) => c.id));
  const commandFiles = globCommands();

  it("manifest has commands array", () => {
    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBeGreaterThan(0);
  });

  it("manifest has workflows object", () => {
    expect(manifest.workflows).toBeDefined();
    expect(typeof manifest.workflows).toBe("object");
  });

  it.each(commands.map((c) => [c.id, c.path]))(
    "manifest entry %s points to existing file",
    (_id, path) => {
      expect(existsSync(resolve(ROOT, path))).toBe(true);
    }
  );

  it("every command file on disk has a manifest entry", () => {
    const manifestPaths = new Set(commands.map((c) => c.path));
    const missing = commandFiles.filter((f) => !manifestPaths.has(f));
    expect(missing).toEqual([]);
  });

  it("manifest IDs match file path convention", () => {
    for (const cmd of commands) {
      // .claude/commands/foundation/init.md → foundation:init
      const match = cmd.path.match(
        /\.claude\/commands\/([^/]+)\/([^/]+)\.md$/
      );
      expect(match).not.toBeNull();
      if (match) {
        // Handle -os suffix in directory names
        const dir = match[1].replace(/-os$/, "");
        const file = match[2];
        const expectedId = `${dir}:${file}`;
        expect(cmd.id).toBe(expectedId);
      }
    }
  });

  it("all 'next' references point to valid command IDs", () => {
    const invalid: string[] = [];
    for (const cmd of commands) {
      for (const next of cmd.next ?? []) {
        if (!commandIds.has(next)) {
          invalid.push(`${cmd.id} → ${next}`);
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it("all workflow entries reference valid command IDs", () => {
    const invalid: string[] = [];
    for (const [name, steps] of Object.entries(manifest.workflows)) {
      for (const step of steps as string[]) {
        if (!commandIds.has(step)) {
          invalid.push(`workflow ${name} → ${step}`);
        }
      }
    }
    expect(invalid).toEqual([]);
  });
});
