import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";

const container = `field-service-assessment-test-${randomUUID().slice(0, 8)}`;
function run(args, input, quiet = false) {
  const result = spawnSync("docker", args, { input, encoding: "utf8", timeout: 60000 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  if (!quiet && result.stdout) process.stdout.write(result.stdout);
  return result;
}

try {
  // No published ports, no mounted files, no persistent volume, no network.
  // Trust auth is limited to this disposable, network-isolated test container.
  run(
    [
      "run",
      "--rm",
      "--detach",
      "--name",
      container,
      "--network",
      "none",
      "-e",
      "POSTGRES_HOST_AUTH_METHOD=trust",
      "postgres:17-alpine",
    ],
    undefined,
    true,
  );
  let ready = false;
  for (let i = 0; i < 60; i++) {
    // The image starts a temporary init server before its final PID-1 server.
    // Waiting for PID 1 to be postgres avoids racing that init-server shutdown.
    const process = spawnSync("docker", ["exec", container, "cat", "/proc/1/comm"], {
      encoding: "utf8",
    });
    const check = spawnSync("docker", ["exec", container, "pg_isready", "-U", "postgres"], {
      encoding: "utf8",
    });
    if (process.stdout?.trim() === "postgres" && check.status === 0) {
      ready = true;
      break;
    }
    await setTimeout(500);
  }
  if (!ready) throw new Error("Disposable PostgreSQL did not become ready");
  const files = [
    "tests/database/bootstrap.sql",
    "supabase/migrations/202611030001_payroll_evaluation.sql",
    "tests/database/fixtures.sql",
    "tests/database/policies.sql",
  ];
  const sql = files.map((file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8"))
    .join("\n");
  const result = run(
    [
      "exec",
      "-i",
      container,
      "psql",
      "-U",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "--no-psqlrc",
      "--quiet",
    ],
    sql,
    true,
  );
  const checks = (result.stderr.match(/NOTICE:  PASS:/g) ?? []).length;
  if (checks < 25) throw new Error("Database assertions did not all execute");
  console.log(`PASS: ${checks} migration, constraint, RPC and role/RLS checks on PostgreSQL 17`);
} finally {
  spawnSync("docker", ["rm", "--force", container], { stdio: "ignore" });
}
