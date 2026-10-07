import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Document, NodeIO } from "@gltf-transform/core";

const SCRIPT = path.join(process.cwd(), "scripts", "strip-sources.mjs");
const check = (env: Record<string, string> = {}) =>
  spawnSync(process.execPath, [SCRIPT, "--check"], { encoding: "utf8", env: { ...process.env, ...env } });

// The licence gate: the meshes listed under `dropped` in the region maps must never be in a source file.
describe("strip:sources --check", () => {
  it("finds no dropped mesh in the committed sources", () => {
    const run = check();
    expect(run.status, run.stdout + run.stderr).toBe(0);
  }, 60_000);

  it("fails when a source file still carries a dropped mesh", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "anatomy-src-"));
    try {
      const doc = new Document();
      doc.createBuffer();
      doc.createScene().addChild(doc.createNode("Kidney L"));
      writeFileSync(path.join(dir, "organs.glb"), await new NodeIO().writeBinary(doc));
      const run = check({ ANATOMY_SRC: dir });
      expect(run.status, run.stdout + run.stderr).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
