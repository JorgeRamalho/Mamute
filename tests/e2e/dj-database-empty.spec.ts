import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function runVerify(target: string) {
  const result = spawnSync("node", ["scripts/verify-no-dj-users.mjs", `--target=${target}`], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: process.env,
  });

  return {
    status: result.status ?? 1,
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim(),
  };
}

test.describe("Banco DJ — sem usuários cadastrados", () => {
  for (const target of ["local", "production"] as const) {
    test(`dj_accounts está vazio (${target})`, async () => {
      const result = runVerify(target);

      if (result.status !== 0) {
        throw new Error(result.output || `verify-no-dj-users falhou (${target})`);
      }

      expect(result.output).toContain(`[verify-no-dj-users:${target}] OK`);
    });
  }
});
