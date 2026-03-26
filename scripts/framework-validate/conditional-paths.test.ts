import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

function readCommand(relPath: string): string {
  return readFileSync(resolve(ROOT, ".claude/commands", relPath), "utf-8");
}

function readJSON(relPath: string) {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), "utf-8"));
}

describe("conditional paths", () => {
  const init = readCommand("foundation/init.md");
  const validate = readCommand("foundation/validate.md");

  it("init command has multi-tenant migration path", () => {
    expect(init).toMatch(/multi.?tenant.*true|multiTenant.*true/i);
    expect(init).toMatch(/tenant_id|tenants/);
  });

  it("init command has single-tenant migration path", () => {
    expect(init).toMatch(/multi.?tenant.*false|single.?tenant/i);
  });

  it("init command has supabase-auth path", () => {
    expect(init).toMatch(/supabase.?auth/i);
    expect(init).toMatch(/signup|sign.?up/i);
  });

  it("init command has keycloak path", () => {
    expect(init).toMatch(/keycloak/i);
  });

  it("validate command checks multi-tenant files", () => {
    expect(validate).toMatch(/multi.?tenant.*true|multiTenant.*true/i);
  });

  it("validate command checks single-tenant files", () => {
    expect(validate).toMatch(/multi.?tenant.*false|single.?tenant/i);
  });

  it("authModel values in schema match values used in commands", () => {
    const schema = readJSON(".claude/project-config.schema.json");
    const authEnum: string[] =
      schema.properties?.authModel?.enum ?? [];
    expect(authEnum).toContain("supabase-auth");
    expect(authEnum).toContain("keycloak");
  });

  it("architecture:new-feature uses conditional tenant_id", () => {
    const cmd = readCommand("architecture-os/new-feature.md");
    // Should reference project-config.json, not assume multi-tenancy
    expect(cmd).toMatch(/project-config\.json/);
    expect(cmd).toMatch(/multiTenant.*true|multi.?tenant/i);
  });

  it("qa:new-tests uses conditional tenant isolation", () => {
    const cmd = readCommand("qa-os/new-tests.md");
    expect(cmd).toMatch(/multiTenant.*true|project-config\.json/);
  });
});
