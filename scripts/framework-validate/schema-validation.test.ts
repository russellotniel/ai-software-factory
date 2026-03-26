import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ROOT = resolve(__dirname, "../..");

function readJSON(relPath: string) {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), "utf-8"));
}

describe("schema validation", () => {
  it("project-config.schema.json is valid JSON Schema", () => {
    const schema = readJSON(".claude/project-config.schema.json");
    // ajv doesn't natively support draft 2020-12 $schema URI,
    // so we strip it before compiling to validate structure
    const { $schema, ...schemaBody } = schema;
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schemaBody);
    expect(validate).toBeDefined();
    // Verify the schema has expected properties
    expect(schema.properties).toHaveProperty("projectName");
    expect(schema.properties).toHaveProperty("multiTenant");
    expect(schema.properties).toHaveProperty("authModel");
    expect(schema.properties).toHaveProperty("status");
  });

  it("command-manifest.json is valid JSON", () => {
    expect(() => readJSON(".claude/command-manifest.json")).not.toThrow();
  });

  it("command-manifest.json has commands array with required fields", () => {
    const manifest = readJSON(".claude/command-manifest.json");
    expect(Array.isArray(manifest.commands)).toBe(true);

    for (const cmd of manifest.commands) {
      expect(cmd).toHaveProperty("id");
      expect(cmd).toHaveProperty("name");
      expect(cmd).toHaveProperty("path");
      expect(cmd).toHaveProperty("phase");
      expect(typeof cmd.id).toBe("string");
      expect(typeof cmd.name).toBe("string");
      expect(typeof cmd.path).toBe("string");
    }
  });

  it("command-manifest.json has workflows object", () => {
    const manifest = readJSON(".claude/command-manifest.json");
    expect(manifest.workflows).toBeDefined();
    expect(typeof manifest.workflows).toBe("object");
    // Each workflow should be an array of strings
    for (const [, steps] of Object.entries(manifest.workflows)) {
      expect(Array.isArray(steps)).toBe(true);
      for (const step of steps as string[]) {
        expect(typeof step).toBe("string");
      }
    }
  });

  it("project-config.json validates against schema (skip if not present)", () => {
    const configPath = resolve(ROOT, ".claude/project-config.json");
    if (!existsSync(configPath)) {
      // Pre-init state — no config file yet, skip
      return;
    }
    const schema = readJSON(".claude/project-config.schema.json");
    const { $schema, ...schemaBody } = schema;
    const config = readJSON(".claude/project-config.json");
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schemaBody);
    const valid = validate(config);
    if (!valid) {
      expect.fail(
        `project-config.json validation errors: ${JSON.stringify(validate.errors)}`
      );
    }
  });
});
