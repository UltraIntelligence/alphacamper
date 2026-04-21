// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const dockerAvailable = spawnSync("docker", ["version"], { stdio: "ignore" }).status === 0;
const containerName = `alphacamper-rls-${randomUUID().slice(0, 8)}`;
const postgresImage = "public.ecr.aws/supabase/postgres:17.6.1.054";

const userAId = "00000000-0000-0000-0000-0000000000aa";
const userBId = "00000000-0000-0000-0000-0000000000bb";
const watchAId = "10000000-0000-0000-0000-0000000000aa";
const watchBId = "10000000-0000-0000-0000-0000000000bb";
const alertAId = "20000000-0000-0000-0000-0000000000aa";
const alertBId = "20000000-0000-0000-0000-0000000000bb";

function runDocker(args: string[], input?: string) {
  return execFileSync("docker", args, {
    encoding: "utf8",
    input,
  }).trim();
}

function quoteSql(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function buildSessionSql(
  role: "authenticated" | "service_role",
  sql: string,
  options?: {
    userId?: string;
    headers?: Record<string, string>;
  },
) {
  const headers = JSON.stringify(options?.headers ?? {});
  const claim = options?.userId ?? "";

  return `
    BEGIN;
    SET LOCAL ROLE ${role};
    SELECT set_config('request.jwt.claim.sub', ${quoteSql(claim)}, true);
    SELECT set_config('request.headers', ${quoteSql(headers)}, true);
    ${sql}
    ROLLBACK;
  `;
}

function runSql(sql: string) {
  return runDocker(
    ["exec", "-i", containerName, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-At"],
    sql,
  );
}

function runScalarQuery(
  role: "authenticated" | "service_role",
  sql: string,
  options?: {
    userId?: string;
    headers?: Record<string, string>;
  },
) {
  const output = runSql(buildSessionSql(role, sql, options));
  const lines = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== "BEGIN" && line !== "ROLLBACK" && line !== "SET");

  return lines.at(-1) ?? "";
}

function waitForPostgresReady() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = spawnSync(
      "docker",
      ["exec", containerName, "pg_isready", "-U", "postgres"],
      { encoding: "utf8" },
    );

    if (result.status === 0) {
      return;
    }

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }

  throw new Error("Timed out waiting for the RLS test database to become ready");
}

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function applyMigrations() {
  const migrationFiles = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const bootstrapSql = `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOINHERIT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOINHERIT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOINHERIT BYPASSRLS;
      END IF;
    END $$;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
  `;

  runSql(bootstrapSql);

  for (const migrationFile of migrationFiles) {
    const sql = readFileSync(path.join(migrationsDir, migrationFile), "utf8");
    runSql(sql);
  }

  runSql(`
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT SELECT ON auth.users TO authenticated, service_role;
  `);
}

function seedData() {
  runSql(`
    TRUNCATE availability_alerts, watched_targets, users, auth.users RESTART IDENTITY CASCADE;

    INSERT INTO auth.users (id, aud, role, email, confirmed_at)
    VALUES
      ('${userAId}', 'authenticated', 'authenticated', 'user-a@example.com', now()),
      ('${userBId}', 'authenticated', 'authenticated', 'user-b@example.com', now());

    INSERT INTO users (id, email)
    VALUES
      ('${userAId}', 'user-a@example.com'),
      ('${userBId}', 'user-b@example.com');

    INSERT INTO watched_targets (
      id,
      user_id,
      platform,
      campground_id,
      campground_name,
      arrival_date,
      departure_date,
      active
    )
    VALUES
      ('${watchAId}', '${userAId}', 'bc_parks', 'camp-a', 'Camp A', DATE '2026-07-01', DATE '2026-07-03', true),
      ('${watchBId}', '${userBId}', 'bc_parks', 'camp-b', 'Camp B', DATE '2026-07-10', DATE '2026-07-12', true);

    INSERT INTO availability_alerts (
      id,
      watched_target_id,
      user_id,
      site_details,
      claimed
    )
    VALUES
      ('${alertAId}', '${watchAId}', '${userAId}', '{"site":"A1"}'::jsonb, false),
      ('${alertBId}', '${watchBId}', '${userBId}', '{"site":"B1"}'::jsonb, false);
  `);
}

const maybeDescribe = dockerAvailable && existsSync(migrationsDir) ? describe : describe.skip;

maybeDescribe("RLS user isolation", () => {
  beforeAll(() => {
    runDocker([
      "run",
      "--rm",
      "-d",
      "--pull",
      "never",
      "--name",
      containerName,
      "-e",
      "POSTGRES_PASSWORD=postgres",
      postgresImage,
    ]);

    waitForPostgresReady();
    sleep(3000);
    waitForPostgresReady();
    applyMigrations();
    waitForPostgresReady();
    seedData();
  }, 60_000);

  afterAll(() => {
    spawnSync("docker", ["rm", "-f", containerName], { stdio: "ignore" });
  });

  it("prevents user A from selecting user B's watched targets", () => {
    const ownCount = runScalarQuery(
      "authenticated",
      `SELECT count(*) FROM watched_targets WHERE user_id = '${userAId}';`,
      { userId: userAId },
    );
    const otherCount = runScalarQuery(
      "authenticated",
      `SELECT count(*) FROM watched_targets WHERE user_id = '${userBId}';`,
      { userId: userAId },
    );

    expect(ownCount).toBe("1");
    expect(otherCount).toBe("0");
  });

  it("prevents user A from selecting user B's alerts", () => {
    const ownCount = runScalarQuery(
      "authenticated",
      `SELECT count(*) FROM availability_alerts WHERE user_id = '${userAId}';`,
      { userId: userAId },
    );
    const otherCount = runScalarQuery(
      "authenticated",
      `SELECT count(*) FROM availability_alerts WHERE user_id = '${userBId}';`,
      { userId: userAId },
    );

    expect(ownCount).toBe("1");
    expect(otherCount).toBe("0");
  });

  it("allows the service role path to read across users", () => {
    const watchCount = runScalarQuery(
      "service_role",
      "SELECT count(*) FROM watched_targets;",
    );
    const alertCount = runScalarQuery(
      "service_role",
      "SELECT count(*) FROM availability_alerts;",
    );

    expect(watchCount).toBe("2");
    expect(alertCount).toBe("2");
  });

  it("honors the dev override gate header", () => {
    const strictCount = runScalarQuery(
      "authenticated",
      `SELECT count(*) FROM watched_targets WHERE user_id = '${userBId}';`,
      { userId: userAId },
    );
    const overrideCount = runScalarQuery(
      "authenticated",
      `SELECT count(*) FROM watched_targets WHERE user_id = '${userBId}';`,
      {
        userId: userAId,
        headers: { "x-rls-dev-override": "true" },
      },
    );

    expect(strictCount).toBe("0");
    expect(overrideCount).toBe("1");
  });
});
