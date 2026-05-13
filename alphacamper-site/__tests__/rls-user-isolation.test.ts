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
// The test runs docker with --pull never (to keep it fast + offline locally).
// In CI the image isn't pre-pulled, so we skip the suite gracefully instead of
// failing when `docker run` returns "No such image".
const postgresImageAvailable = dockerAvailable
  ? spawnSync("docker", ["image", "inspect", postgresImage], { stdio: "ignore" }).status === 0
  : false;

const userAId = "00000000-0000-0000-0000-0000000000aa";
const userBId = "00000000-0000-0000-0000-0000000000bb";
const watchAId = "10000000-0000-0000-0000-0000000000aa";
const watchBId = "10000000-0000-0000-0000-0000000000bb";
const alertAId = "20000000-0000-0000-0000-0000000000aa";
const alertBId = "20000000-0000-0000-0000-0000000000bb";
const subscriptionAId = "30000000-0000-0000-0000-0000000000aa";
const privateTableChecks = [
  {
    table: "subscriptions",
    selectSql: "SELECT count(*) FROM subscriptions;",
    insertSql: `
      INSERT INTO subscriptions (
        id,
        user_id,
        product_key,
        status,
        checkout_mode,
        stripe_checkout_session_id
      )
      VALUES (
        '30000000-0000-0000-0000-0000000000cc',
        '${userBId}',
        'year_pass_2026',
        'active',
        'payment',
        'cs_test_private_probe'
      );
    `,
    updateSql: `UPDATE subscriptions SET updated_at = now() WHERE id = '${subscriptionAId}';`,
    deleteSql: "DELETE FROM subscriptions WHERE id = '30000000-0000-0000-0000-0000000000cc';",
  },
  {
    table: "stripe_webhook_events",
    selectSql: "SELECT count(*) FROM stripe_webhook_events;",
    insertSql: "INSERT INTO stripe_webhook_events (id, event_type) VALUES ('evt_private_probe', 'checkout.session.completed');",
    updateSql: "UPDATE stripe_webhook_events SET processed_at = now() WHERE id = 'evt_test_checkout_completed';",
    deleteSql: "DELETE FROM stripe_webhook_events WHERE id = 'evt_private_probe';",
  },
  {
    table: "funnel_events",
    selectSql: "SELECT count(*) FROM funnel_events;",
    insertSql: `INSERT INTO funnel_events (user_id, event_name, metadata) VALUES ('${userAId}', 'booking_submitted', '{"source":"private_probe"}'::jsonb);`,
    updateSql: "UPDATE funnel_events SET metadata = '{\"source\":\"updated_probe\"}'::jsonb WHERE event_name = 'autofill_started';",
    deleteSql: "DELETE FROM funnel_events WHERE metadata ->> 'source' = 'private_probe';",
  },
];

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

function runSessionResult(
  role: "authenticated" | "service_role",
  sql: string,
  options?: {
    userId?: string;
    headers?: Record<string, string>;
  },
) {
  return spawnSync(
    "docker",
    ["exec", "-i", containerName, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-At"],
    {
      encoding: "utf8",
      input: buildSessionSql(role, sql, options),
    },
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
    GRANT SELECT ON auth.users TO authenticated, service_role;
  `);
}

function seedData() {
  runSql(`
    TRUNCATE stripe_webhook_events, funnel_events, subscriptions, availability_alerts, watched_targets, users, auth.users RESTART IDENTITY CASCADE;

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

    INSERT INTO subscriptions (
      id,
      user_id,
      product_key,
      status,
      current_period_end,
      checkout_mode,
      amount_total,
      currency,
      stripe_checkout_session_id
    )
    VALUES (
      '${subscriptionAId}',
      '${userAId}',
      'summer_pass_2026',
      'active',
      '2026-11-01T00:00:00.000Z',
      'payment',
      6900,
      'usd',
      'cs_test_user_a'
    );

    INSERT INTO stripe_webhook_events (id, event_type)
    VALUES ('evt_test_checkout_completed', 'checkout.session.completed');

    INSERT INTO funnel_events (user_id, watch_id, event_name, metadata)
    VALUES
      ('${userAId}', '${watchAId}', 'autofill_started', '{"source":"test"}'::jsonb),
      ('${userBId}', '${watchBId}', 'booking_failed', '{"source":"test"}'::jsonb);
  `);
}

const maybeDescribe =
  dockerAvailable && postgresImageAvailable && existsSync(migrationsDir)
    ? describe
    : describe.skip;

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

  it("keeps billing, Stripe, and funnel tables server-only", () => {
    for (const check of privateTableChecks) {
      for (const sql of [
        check.selectSql,
        check.insertSql,
        check.updateSql,
        check.deleteSql,
      ]) {
        const result = runSessionResult(
          "authenticated",
          sql,
          { userId: userAId },
        );

        expect(result.status, `${check.table} should reject authenticated access`).not.toBe(0);
        expect(`${result.stdout}\n${result.stderr}`).toContain("permission denied");
      }
    }
  });

  it("allows the service role path to read private operational tables", () => {
    const subscriptionCount = runScalarQuery(
      "service_role",
      "SELECT count(*) FROM subscriptions;",
    );
    const webhookCount = runScalarQuery(
      "service_role",
      "SELECT count(*) FROM stripe_webhook_events;",
    );
    const funnelCount = runScalarQuery(
      "service_role",
      "SELECT count(*) FROM funnel_events;",
    );

    expect(subscriptionCount).toBe("1");
    expect(webhookCount).toBe("1");
    expect(funnelCount).toBe("2");

    for (const check of privateTableChecks) {
      const result = runSessionResult(
        "service_role",
        `
          ${check.insertSql}
          ${check.updateSql}
          ${check.deleteSql}
        `,
      );

      expect(
        result.status,
        `${check.table} should allow service role writes\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
      ).toBe(0);
    }
  });

  it("does not let client headers bypass user isolation", () => {
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
    expect(overrideCount).toBe("0");
  });
});
