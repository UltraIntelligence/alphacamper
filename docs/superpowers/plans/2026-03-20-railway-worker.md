# Railway Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Railway-deployed Node.js worker that uses Playwright to bypass Azure WAF on Canadian park booking sites, then polls availability via HTTP and writes alerts to Supabase.

**Architecture:** A continuously running Node.js process with a setTimeout-based poll loop. CookieManager handles per-domain WAF solving via Playwright with adaptive TTL caching. Poller makes plain HTTP requests using cached cookies. Supabase is the shared data layer between this worker and the existing Chrome extension/Vercel site.

**Tech Stack:** Node.js, TypeScript, Playwright, @supabase/supabase-js, vitest

**Spec:** `docs/superpowers/specs/2026-03-20-railway-worker-design.md`

---

## Plan A: Railway Worker (this plan)

This plan covers the worker itself (`alphacamper-worker/`). Database migrations and API auth hardening are a separate plan.

## Prerequisite: Database Migration

Before the worker can run, the following migration must be applied to Supabase. This is a manual step — run in the Supabase SQL Editor:

```sql
-- Partial unique index: only one unclaimed alert per watch at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_unclaimed_alert_per_watch
  ON availability_alerts (watched_target_id)
  WHERE claimed = false;

-- Round-robin tracking for fair watch scheduling
ALTER TABLE watched_targets ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- Worker health tracking
CREATE TABLE IF NOT EXISTS worker_status (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  last_cycle_at TIMESTAMPTZ,
  last_successful_poll_at TIMESTAMPTZ,
  consecutive_403_count INT DEFAULT 0,
  platforms_healthy JSONB DEFAULT '{}',
  cycle_stats JSONB DEFAULT '{}'
);
```

---

## File Structure

```
alphacamper-worker/
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts            — Entry point: setTimeout loop, cycle timeout, health endpoint
│   ├── cookie-manager.ts   — Playwright WAF solver, per-domain adaptive TTL cache
│   ├── poller.ts           — HTTP availability checks using cached cookies
│   ├── supabase.ts         — Read watches (round-robin), write alerts (upsert), worker status
│   ├── config.ts           — Domain mappings, timing constants, kill switch
│   ├── alerter.ts          — Slack webhook for operator alerts
│   └── logger.ts           — Structured logging with timestamps and levels
└── __tests__/
    ├── poller.test.ts
    ├── supabase.test.ts
    └── cookie-manager.test.ts
```

---

## Task 1: Scaffold the worker project

**Files:**
- Create: `alphacamper-worker/package.json`
- Create: `alphacamper-worker/tsconfig.json`
- Create: `alphacamper-worker/.env.example`
- Create: `alphacamper-worker/Dockerfile`
- Create: `alphacamper-worker/.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "alphacamper-worker",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.99.3",
    "playwright": "^1.50.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^4.1.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": false,
    "sourceMap": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

- [ ] **Step 3: Create .env.example**

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
POLL_INTERVAL_FAST_MS=300000
POLL_INTERVAL_SLOW_MS=900000
CYCLE_TIMEOUT_MS=1200000
SLACK_WEBHOOK_URL=
DISABLED_PLATFORMS=
LOG_LEVEL=info
```

- [ ] **Step 4: Create Dockerfile**

```dockerfile
# Build stage
FROM mcr.microsoft.com/playwright:v1.50.0-noble AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# Production stage
FROM mcr.microsoft.com/playwright:v1.50.0-noble
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
```

- [ ] **Step 6: Install dependencies**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npm install`
Expected: node_modules created, package-lock.json generated

- [ ] **Step 7: Verify TypeScript compiles (empty project)**

Create a minimal `src/index.ts`:
```typescript
console.log("[worker] starting...");
```

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npm run build`
Expected: `dist/index.js` created

- [ ] **Step 8: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-worker/package.json alphacamper-worker/package-lock.json alphacamper-worker/tsconfig.json alphacamper-worker/.env.example alphacamper-worker/Dockerfile alphacamper-worker/.gitignore alphacamper-worker/src/index.ts
git commit -m "feat: scaffold Railway worker project"
```

---

## Task 2: Logger and config modules

**Files:**
- Create: `alphacamper-worker/src/logger.ts`
- Create: `alphacamper-worker/src/config.ts`

- [ ] **Step 1: Create logger.ts**

```typescript
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 } as const;
type Level = keyof typeof LEVELS;

function shouldLog(level: Level): boolean {
  return LEVELS[level] >= (LEVELS[LOG_LEVEL as Level] ?? LEVELS.info);
}

function timestamp(): string {
  return new Date().toISOString();
}

export const log = {
  debug(msg: string, data?: Record<string, unknown>) {
    if (shouldLog("debug")) console.log(`${timestamp()} [debug] ${msg}`, data ?? "");
  },
  info(msg: string, data?: Record<string, unknown>) {
    if (shouldLog("info")) console.log(`${timestamp()} [info] ${msg}`, data ?? "");
  },
  warn(msg: string, data?: Record<string, unknown>) {
    if (shouldLog("warn")) console.warn(`${timestamp()} [warn] ${msg}`, data ?? "");
  },
  error(msg: string, data?: Record<string, unknown>) {
    if (shouldLog("error")) console.error(`${timestamp()} [error] ${msg}`, data ?? "");
  },
  critical(msg: string, data?: Record<string, unknown>) {
    if (shouldLog("critical")) console.error(`${timestamp()} [CRITICAL] ${msg}`, data ?? "");
  },
};
```

- [ ] **Step 2: Create config.ts**

```typescript
export const DOMAINS: Record<string, string> = {
  bc_parks: "camping.bcparks.ca",
  ontario_parks: "reservations.ontarioparks.ca",
};

export const SUPPORTED_PLATFORMS = Object.keys(DOMAINS);

export const COOKIE_TTLS: Record<string, number> = {
  "camping.bcparks.ca": 25 * 60 * 1000,
  "reservations.ontarioparks.ca": 20 * 60 * 1000,
};

export const POLL_INTERVAL_FAST_MS = Number(process.env.POLL_INTERVAL_FAST_MS) || 5 * 60 * 1000;
export const POLL_INTERVAL_SLOW_MS = Number(process.env.POLL_INTERVAL_SLOW_MS) || 15 * 60 * 1000;
export const CYCLE_TIMEOUT_MS = Number(process.env.CYCLE_TIMEOUT_MS) || 20 * 60 * 1000;
export const REQUEST_DELAY_MS = 2000;
export const MAX_CAMPGROUNDS_PER_CYCLE = 500;

export const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";

export function getDisabledPlatforms(): Set<string> {
  const raw = process.env.DISABLED_PLATFORMS || "";
  return new Set(raw.split(",").map(s => s.trim()).filter(Boolean));
}

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
```

- [ ] **Step 3: Verify both compile**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-worker/src/logger.ts alphacamper-worker/src/config.ts
git commit -m "feat: add logger and config modules for worker"
```

---

## Task 3: Slack alerter

**Files:**
- Create: `alphacamper-worker/src/alerter.ts`

- [ ] **Step 1: Create alerter.ts**

```typescript
import { SLACK_WEBHOOK_URL } from "./config.js";
import { log } from "./logger.js";

export async function alertOperator(message: string, level: "warn" | "critical" = "warn"): Promise<void> {
  log[level === "critical" ? "critical" : "warn"](message);

  if (!SLACK_WEBHOOK_URL) return;

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${level === "critical" ? "🚨" : "⚠️"} *Alphacamper Worker*: ${message}`,
      }),
    });
  } catch (err) {
    log.error("Failed to send Slack alert", { error: String(err) });
  }
}
```

- [ ] **Step 2: Verify compiles**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npm run build`

- [ ] **Step 3: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-worker/src/alerter.ts
git commit -m "feat: add Slack webhook alerter for operator notifications"
```

---

## Task 4: Supabase client with round-robin queries

**Files:**
- Create: `alphacamper-worker/src/supabase.ts`
- Create: `alphacamper-worker/__tests__/supabase.test.ts`

- [ ] **Step 1: Write the failing test**

Create `alphacamper-worker/__tests__/supabase.test.ts`. Create a `vitest.config.ts` in the worker root first:

```typescript
// alphacamper-worker/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
```

Test file:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { groupByCampground, shouldCreateAlert } from "../src/supabase.js";

describe("groupByCampground", () => {
  it("groups watches by platform:campground_id", () => {
    const watches = [
      { id: "1", platform: "bc_parks", campground_id: "-2504", campground_name: "Rathtrevor", user_id: "u1", site_number: null, arrival_date: "2026-07-10", departure_date: "2026-07-12", active: true, last_checked_at: null },
      { id: "2", platform: "bc_parks", campground_id: "-2504", campground_name: "Rathtrevor", user_id: "u2", site_number: "A5", arrival_date: "2026-07-11", departure_date: "2026-07-13", active: true, last_checked_at: null },
      { id: "3", platform: "ontario_parks", campground_id: "-2740399", campground_name: "Canisbay", user_id: "u1", site_number: null, arrival_date: "2026-08-01", departure_date: "2026-08-03", active: true, last_checked_at: null },
    ];

    const groups = groupByCampground(watches);
    expect(groups.size).toBe(2);
    expect(groups.get("bc_parks:-2504")).toHaveLength(2);
    expect(groups.get("ontario_parks:-2740399")).toHaveLength(1);
  });

  it("returns empty map for empty input", () => {
    expect(groupByCampground([]).size).toBe(0);
  });
});

describe("shouldCreateAlert", () => {
  it("returns true when sites are available", () => {
    expect(shouldCreateAlert([{ siteId: "-100", siteName: "A1" }])).toBe(true);
  });

  it("returns false when no sites", () => {
    expect(shouldCreateAlert([])).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npx vitest run`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement supabase.ts**

```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPPORTED_PLATFORMS } from "./config.js";
import { log } from "./logger.js";

export interface WatchedTarget {
  id: string;
  user_id: string;
  platform: string;
  campground_id: string;
  campground_name: string;
  site_number: string | null;
  arrival_date: string;
  departure_date: string;
  active: boolean;
  last_checked_at: string | null;
}

export interface AvailableSite {
  siteId: string;
  siteName: string;
}

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
    client = createClient(url, key);
  }
  return client;
}

export async function fetchActiveWatches(limit: number = 500): Promise<WatchedTarget[]> {
  const supabase = getClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("watched_targets")
    .select("*")
    .eq("active", true)
    .in("platform", SUPPORTED_PLATFORMS)
    .gte("departure_date", today)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    log.error("Failed to fetch watches", { error: error.message });
    return [];
  }

  return (data || []) as WatchedTarget[];
}

export function groupByCampground(watches: WatchedTarget[]): Map<string, WatchedTarget[]> {
  const groups = new Map<string, WatchedTarget[]>();
  for (const watch of watches) {
    const key = `${watch.platform}:${watch.campground_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(watch);
  }
  return groups;
}

export function shouldCreateAlert(sites: AvailableSite[]): boolean {
  return sites.length > 0;
}

export async function createAlert(
  watchId: string,
  userId: string,
  sites: AvailableSite[],
): Promise<boolean> {
  const supabase = getClient();

  // Use raw SQL because Supabase JS .upsert() can't target partial unique indexes.
  // The partial index idx_one_unclaimed_alert_per_watch only applies WHERE claimed = false.
  const { error } = await supabase.rpc("exec_sql", {
    query: `
      INSERT INTO availability_alerts (watched_target_id, user_id, site_details, claimed)
      VALUES ($1, $2, $3, false)
      ON CONFLICT (watched_target_id) WHERE claimed = false DO NOTHING
    `,
    params: [watchId, userId, JSON.stringify({ sites })],
  });

  // Fallback: if the exec_sql RPC doesn't exist, use a simple insert with error handling
  if (error?.message?.includes("exec_sql")) {
    // Check if unclaimed alert exists first
    const { data: existing } = await supabase
      .from("availability_alerts")
      .select("id")
      .eq("watched_target_id", watchId)
      .eq("claimed", false)
      .limit(1);

    if (existing && existing.length > 0) {
      return false; // Already has unclaimed alert
    }

    const { error: insertError } = await supabase
      .from("availability_alerts")
      .insert({
        watched_target_id: watchId,
        user_id: userId,
        site_details: { sites },
        claimed: false,
      });

    if (insertError) {
      // Unique constraint violation = already exists, not an error
      if (insertError.code === "23505") return false;
      log.error("Failed to create alert", { watchId, error: insertError.message });
      return false;
    }
    return true;
  }

  if (error) {
    log.error("Failed to create alert", { watchId, error: error.message });
    return false;
  }
  return true;
}

export async function updateLastChecked(watchIds: string[]): Promise<void> {
  if (watchIds.length === 0) return;
  const supabase = getClient();

  const { error } = await supabase
    .from("watched_targets")
    .update({ last_checked_at: new Date().toISOString() })
    .in("id", watchIds);

  if (error) {
    log.error("Failed to update last_checked_at", { error: error.message });
  }
}

export async function expireStaleAlerts(): Promise<number> {
  const supabase = getClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("availability_alerts")
    .update({ claimed: true })
    .eq("claimed", false)
    .lt("notified_at", oneHourAgo)
    .select("id");

  if (error) {
    log.error("Failed to expire stale alerts", { error: error.message });
    return 0;
  }
  return data?.length || 0;
}

export async function updateWorkerStatus(stats: {
  lastSuccessfulPoll: boolean;
  consecutive403: Record<string, number>;
  platformsHealthy: Record<string, boolean>;
  cycleStats: Record<string, unknown>;
}): Promise<void> {
  const supabase = getClient();

  const update: Record<string, unknown> = {
    last_cycle_at: new Date().toISOString(),
    consecutive_403_count: Object.values(stats.consecutive403).reduce((a, b) => a + b, 0),
    platforms_healthy: stats.platformsHealthy,
    cycle_stats: stats.cycleStats,
  };

  if (stats.lastSuccessfulPoll) {
    update.last_successful_poll_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("worker_status")
    .upsert({ id: "singleton", ...update });

  if (error) {
    log.error("Failed to update worker status", { error: error.message });
  }
}
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-worker/src/supabase.ts alphacamper-worker/__tests__/supabase.test.ts alphacamper-worker/vitest.config.ts
git commit -m "feat: add Supabase client with round-robin queries and alert upsert"
```

---

## Task 5: Cookie manager with Playwright WAF solving

**Files:**
- Create: `alphacamper-worker/src/cookie-manager.ts`
- Create: `alphacamper-worker/__tests__/cookie-manager.test.ts`

- [ ] **Step 1: Write tests for cache logic (not Playwright — that's integration)**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the cache logic, not Playwright itself
describe("CookieCache", () => {
  // Import after creating the file
  let CookieManager: any;

  beforeEach(async () => {
    vi.unstubAllGlobals();
    const mod = await import("../src/cookie-manager.js");
    CookieManager = mod.CookieManager;
  });

  it("reports expired when no cookies cached", () => {
    const mgr = new CookieManager();
    expect(mgr.isExpired("camping.bcparks.ca")).toBe(true);
  });

  it("reports not expired after caching cookies", () => {
    const mgr = new CookieManager();
    mgr.setCookies("camping.bcparks.ca", [
      { name: "session", value: "abc", domain: "camping.bcparks.ca" },
    ]);
    expect(mgr.isExpired("camping.bcparks.ca")).toBe(false);
  });

  it("returns cached cookie header string", () => {
    const mgr = new CookieManager();
    mgr.setCookies("camping.bcparks.ca", [
      { name: "sid", value: "123", domain: "camping.bcparks.ca" },
      { name: "tok", value: "abc", domain: "camping.bcparks.ca" },
    ]);
    const header = mgr.getCookieHeader("camping.bcparks.ca");
    expect(header).toBe("sid=123; tok=abc");
  });

  it("returns empty string when no cookies", () => {
    const mgr = new CookieManager();
    expect(mgr.getCookieHeader("camping.bcparks.ca")).toBe("");
  });

  it("force-expires cookies for a domain", () => {
    const mgr = new CookieManager();
    mgr.setCookies("camping.bcparks.ca", [
      { name: "sid", value: "123", domain: "camping.bcparks.ca" },
    ]);
    expect(mgr.isExpired("camping.bcparks.ca")).toBe(false);
    mgr.forceExpire("camping.bcparks.ca");
    expect(mgr.isExpired("camping.bcparks.ca")).toBe(true);
  });

  it("reduces TTL on adaptive refresh", () => {
    const mgr = new CookieManager();
    const originalTtl = mgr.getTtl("camping.bcparks.ca");
    mgr.reduceTtl("camping.bcparks.ca");
    expect(mgr.getTtl("camping.bcparks.ca")).toBeLessThan(originalTtl);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npx vitest run`

- [ ] **Step 3: Implement cookie-manager.ts**

```typescript
import { chromium, type Cookie } from "playwright";
import { COOKIE_TTLS, USER_AGENT } from "./config.js";
import { log } from "./logger.js";
import { alertOperator } from "./alerter.js";

interface CachedCookies {
  cookies: Cookie[];
  expiresAt: number;
}

const MIN_TTL_MS = 5 * 60 * 1000; // 5 minutes minimum
const TTL_REDUCTION_MS = 5 * 60 * 1000; // reduce by 5 min on adaptive refresh

export class CookieManager {
  private cache = new Map<string, CachedCookies>();
  private ttls = new Map<string, number>();

  constructor() {
    // Initialize per-domain TTLs
    for (const [domain, ttl] of Object.entries(COOKIE_TTLS)) {
      this.ttls.set(domain, ttl);
    }
  }

  getTtl(domain: string): number {
    return this.ttls.get(domain) || 25 * 60 * 1000;
  }

  reduceTtl(domain: string): void {
    const current = this.getTtl(domain);
    const reduced = Math.max(current - TTL_REDUCTION_MS, MIN_TTL_MS);
    this.ttls.set(domain, reduced);
    log.warn(`Reduced TTL for ${domain}`, { newTtlMs: reduced });
  }

  isExpired(domain: string): boolean {
    const cached = this.cache.get(domain);
    if (!cached) return true;
    return Date.now() >= cached.expiresAt;
  }

  setCookies(domain: string, cookies: Cookie[]): void {
    this.cache.set(domain, {
      cookies,
      expiresAt: Date.now() + this.getTtl(domain),
    });
  }

  getCookieHeader(domain: string): string {
    const cached = this.cache.get(domain);
    if (!cached) return "";
    return cached.cookies.map(c => `${c.name}=${c.value}`).join("; ");
  }

  forceExpire(domain: string): void {
    this.cache.delete(domain);
  }

  async refreshCookies(domain: string): Promise<boolean> {
    log.info(`Refreshing cookies for ${domain}`);
    let browser;

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: USER_AGENT,
        viewport: { width: 1920, height: 1080 },
        locale: "en-US",
      });

      const page = await context.newPage();
      await page.goto(`https://${domain}/`, { waitUntil: "networkidle", timeout: 30000 });

      // Check for CAPTCHA — if found, alert and bail
      const captcha = await page.$('iframe[src*="captcha"], div.g-recaptcha, #captcha-container');
      if (captcha) {
        await alertOperator(`CAPTCHA detected on ${domain} — WAF upgrade?`, "critical");
        return false;
      }

      // Wait for the real page to load (WAF challenge should auto-solve)
      // Look for any element that indicates the actual site, not the WAF page
      try {
        await page.waitForSelector('a, button, input, [data-testid]', { timeout: 15000 });
      } catch {
        log.warn(`No interactive elements found on ${domain} after WAF solve`);
      }

      const cookies = await context.cookies();
      if (cookies.length === 0) {
        log.warn(`No cookies received from ${domain}`);
        return false;
      }

      // Validation: make one test request to confirm cookies actually work
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
      try {
        const testRes = await page.context().request.get(`https://${domain}/api/resourcecategory`, {
          headers: { Cookie: cookieHeader, Accept: "application/json" },
        });
        if (testRes.status() === 403) {
          log.warn(`Cookie validation failed for ${domain} — WAF cookies not sufficient`);
          return false;
        }
      } catch {
        // Validation request failed — cookies may still work for other endpoints
        log.warn(`Cookie validation request failed for ${domain} — proceeding anyway`);
      }

      this.setCookies(domain, cookies);
      log.info(`Cached ${cookies.length} cookies for ${domain}`, {
        ttlMs: this.getTtl(domain),
      });

      return true;
    } catch (err) {
      log.error(`Playwright WAF solve failed for ${domain}`, {
        error: String(err),
      });
      return false;
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npx vitest run`
Expected: All cache logic tests pass (Playwright tests are integration-only, not unit-tested)

- [ ] **Step 5: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-worker/src/cookie-manager.ts alphacamper-worker/__tests__/cookie-manager.test.ts
git commit -m "feat: add CookieManager with Playwright WAF solving and adaptive TTL"
```

---

## Task 6: API reconnaissance script

**Files:**
- Create: `alphacamper-worker/src/recon.ts`

**Context:** This is a one-time script that opens BC Parks in Playwright, navigates to a campground, and records the exact API calls the site makes. This resolves the biggest open question in the spec.

- [ ] **Step 1: Create recon script**

```typescript
import { chromium } from "playwright";
import { USER_AGENT } from "./config.js";

/**
 * One-time reconnaissance script.
 * Opens BC Parks in a real browser, navigates to Rathtrevor Beach availability,
 * and logs every network request the site makes.
 *
 * Run: cd alphacamper-worker && npx tsx src/recon.ts
 */
async function recon() {
  const domain = process.argv[2] || "camping.bcparks.ca";
  const campgroundPath = process.argv[3] || "create-booking/results?resourceLocationId=-2504";

  console.log(`\n=== Recon: https://${domain}/${campgroundPath} ===\n`);

  const browser = await chromium.launch({ headless: false }); // visible browser for debugging
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });

  const page = await context.newPage();

  // Log all API requests
  const apiCalls: Array<{
    method: string;
    url: string;
    postData?: string;
    status?: number;
    responsePreview?: string;
  }> = [];

  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("/api/") && !url.includes("/ResInfo")) return;

    const request = response.request();
    let responsePreview = "";
    try {
      const body = await response.text();
      responsePreview = body.substring(0, 500);
    } catch {}

    const entry = {
      method: request.method(),
      url,
      postData: request.postData() || undefined,
      status: response.status(),
      responsePreview,
    };
    apiCalls.push(entry);
    console.log(`\n--- ${entry.method} ${entry.url} (${entry.status}) ---`);
    if (entry.postData) console.log("Body:", entry.postData);
    console.log("Response:", responsePreview.substring(0, 200));
  });

  // Navigate to homepage first (solve WAF)
  console.log("Navigating to homepage...");
  await page.goto(`https://${domain}/`, { waitUntil: "networkidle", timeout: 60000 });
  console.log("Homepage loaded. Cookies:", (await context.cookies()).length);

  // Navigate to campground availability page
  console.log(`\nNavigating to campground: ${campgroundPath}...`);
  await page.goto(`https://${domain}/${campgroundPath}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  // Wait for user to interact or for data to load
  console.log("\nWaiting 15 seconds for availability data to load...");
  await page.waitForTimeout(15000);

  // Print summary
  console.log("\n\n========== API CALL SUMMARY ==========\n");
  for (const call of apiCalls) {
    console.log(`${call.method} ${call.url}`);
    if (call.postData) console.log(`  Body: ${call.postData}`);
    console.log(`  Status: ${call.status}`);
    console.log(`  Response: ${call.responsePreview?.substring(0, 300)}`);
    console.log();
  }

  // Print cookies
  console.log("\n========== COOKIES ==========\n");
  const cookies = await context.cookies();
  for (const c of cookies) {
    console.log(`${c.name} = ${c.value.substring(0, 50)}... (domain: ${c.domain})`);
  }

  console.log("\nDone. Close the browser window to exit.");
  await page.waitForTimeout(300000); // Keep open for 5 minutes for manual exploration
  await browser.close();
}

recon().catch(console.error);
```

- [ ] **Step 2: Run the recon script**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npx tsx src/recon.ts`

This opens a visible browser. Let it solve the WAF, load the campground page, and log all API calls. The output tells us:
- The exact availability endpoint URL and method
- The request body format
- The response JSON structure
- Which cookies are needed

**Save the output** — it will be used to implement the poller in Task 7.

- [ ] **Step 3: Run recon for Ontario Parks too**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npx tsx src/recon.ts reservations.ontarioparks.ca "create-booking/results?resourceLocationId=-2740399"`

- [ ] **Step 4: Document findings**

Create `alphacamper-worker/API_CONTRACTS.md` with the observed:
- Endpoint URLs and methods
- Request headers and body format
- Response JSON structure (paste a trimmed example)
- Date key format (ISO? YY-Mon-DD? Something else?)
- Which cookies are required

- [ ] **Step 5: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-worker/src/recon.ts alphacamper-worker/API_CONTRACTS.md
git commit -m "feat: add API recon script and document GoingToCamp API contracts"
```

---

## Task 7: Poller — HTTP availability checks

**HARD GATE: Task 6 must be completed first.** Do not proceed until `API_CONTRACTS.md` exists with verified endpoint URLs, request formats, and response structures. The code below uses placeholder format — **you MUST update all PLACEHOLDER comments to match the real API contract before writing tests or implementation.**

**Files:**
- Create: `alphacamper-worker/src/poller.ts`
- Create: `alphacamper-worker/__tests__/poller.test.ts`

- [ ] **Step 1: Write tests based on real API contract**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkCampground } from "../src/poller.js";
import type { WatchedTarget } from "../src/supabase.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const makeWatch = (overrides: Partial<WatchedTarget> = {}): WatchedTarget => ({
  id: "w1",
  user_id: "u1",
  platform: "bc_parks",
  campground_id: "-2504",
  campground_name: "Rathtrevor Beach",
  site_number: null,
  arrival_date: "2026-07-10",
  departure_date: "2026-07-12",
  active: true,
  last_checked_at: null,
  ...overrides,
});

describe("checkCampground", () => {
  beforeEach(() => vi.clearAllMocks());

  // NOTE: Update mock response format to match API_CONTRACTS.md from Task 6
  // The structure below is a placeholder based on GoingToCamp research

  it("returns available sites when all dates have AVAILABLE status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        // PLACEHOLDER — replace with real response format from recon
        resourceAvailabilities: [
          {
            resourceId: -100,
            site: { name: "Site A1" },
            availabilities: {
              "2026-07-10T00:00:00Z": "AVAILABLE",
              "2026-07-11T00:00:00Z": "AVAILABLE",
            },
          },
        ],
      }),
    });

    const results = await checkCampground(
      "camping.bcparks.ca",
      "-2504",
      [makeWatch()],
      "cookie=abc",
    );
    expect(results).toHaveLength(1);
    expect(results[0].sites[0].siteName).toBe("Site A1");
  });

  it("returns empty when dates are RESERVED", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        resourceAvailabilities: [
          {
            resourceId: -100,
            site: { name: "Site A1" },
            availabilities: {
              "2026-07-10T00:00:00Z": "AVAILABLE",
              "2026-07-11T00:00:00Z": "RESERVED",
            },
          },
        ],
      }),
    });

    const results = await checkCampground("camping.bcparks.ca", "-2504", [makeWatch()], "cookie=abc");
    expect(results).toHaveLength(0);
  });

  it("filters by site_number", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        resourceAvailabilities: [
          { resourceId: -100, site: { name: "A1" }, availabilities: { "2026-07-10T00:00:00Z": "AVAILABLE", "2026-07-11T00:00:00Z": "AVAILABLE" } },
          { resourceId: -101, site: { name: "B5" }, availabilities: { "2026-07-10T00:00:00Z": "AVAILABLE", "2026-07-11T00:00:00Z": "AVAILABLE" } },
        ],
      }),
    });

    const results = await checkCampground("camping.bcparks.ca", "-2504", [makeWatch({ site_number: "B5" })], "cookie=abc");
    expect(results).toHaveLength(1);
    expect(results[0].sites[0].siteName).toBe("B5");
  });

  it("returns empty on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });
    const results = await checkCampground("camping.bcparks.ca", "-2504", [makeWatch()], "cookie=abc");
    expect(results).toHaveLength(0);
  });

  it("returns empty on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const results = await checkCampground("camping.bcparks.ca", "-2504", [makeWatch()], "cookie=abc");
    expect(results).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npx vitest run`

- [ ] **Step 3: Implement poller.ts**

```typescript
import { USER_AGENT, REQUEST_DELAY_MS } from "./config.js";
import { log } from "./logger.js";
import type { WatchedTarget, AvailableSite } from "./supabase.js";

export interface PollResult {
  watchId: string;
  userId: string;
  sites: AvailableSite[];
}

export interface PollOutcome {
  results: PollResult[];
  httpStatus: number | null; // null = network error, 200 = ok, 403 = needs cookie refresh, 429 = rate limited
}

// NOTE: Update this function's URL, method, headers, body, and response parsing
// to match the REAL API contract documented in API_CONTRACTS.md (from Task 6 recon)

export async function checkCampground(
  domain: string,
  campgroundId: string,
  watches: WatchedTarget[],
  cookieHeader: string,
): Promise<PollOutcome> {
  // PLACEHOLDER URL — replace with real endpoint from recon
  const url = `https://${domain}/api/maps/mapdatabyid`;

  // Compute date envelope across all watches
  let earliest = watches[0].arrival_date;
  let latest = watches[0].departure_date;
  for (const w of watches) {
    if (w.arrival_date < earliest) earliest = w.arrival_date;
    if (w.departure_date > latest) latest = w.departure_date;
  }

  let data: any;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Language": "en-US",
        "User-Agent": USER_AGENT,
        "Cookie": cookieHeader,
        "Referer": `https://${domain}/`,
      },
      // PLACEHOLDER body — replace with real format from recon
      body: JSON.stringify({
        mapId: Number(campgroundId),
        startDate: earliest,
        endDate: latest,
        partySize: 1,
      }),
    });

    if (!res.ok) {
      log.warn(`HTTP ${res.status} from ${domain}`, { campgroundId });
      return { results: [], httpStatus: res.status };
    }

    data = await res.json();
  } catch (err) {
    log.error(`Request failed for ${domain}`, { campgroundId, error: String(err) });
    return { results: [], httpStatus: null };
  }

  // PLACEHOLDER parsing — replace with real response structure from recon
  const resources: any[] = data?.resourceAvailabilities || [];
  const results: PollResult[] = [];

  for (const watch of watches) {
    const arrival = new Date(watch.arrival_date);
    const departure = new Date(watch.departure_date);
    const available: AvailableSite[] = [];

    for (const resource of resources) {
      const siteName = resource.site?.name || String(resource.resourceId);
      const siteId = String(resource.resourceId);

      if (watch.site_number && siteName !== watch.site_number) continue;

      const avail = resource.availabilities || {};
      let allAvailable = true;
      const d = new Date(arrival);
      while (d < departure) {
        const dateKey = d.toISOString().split("T")[0] + "T00:00:00Z";
        if (avail[dateKey] !== "AVAILABLE") {
          allAvailable = false;
          break;
        }
        d.setUTCDate(d.getUTCDate() + 1);
      }

      if (allAvailable) {
        available.push({ siteId, siteName });
      }
    }

    if (available.length > 0) {
      results.push({ watchId: watch.id, userId: watch.user_id, sites: available });
    }
  }

  return { results, httpStatus: 200 };
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-worker/src/poller.ts alphacamper-worker/__tests__/poller.test.ts
git commit -m "feat: add HTTP availability poller with per-date checking"
```

---

## Task 8: Main loop orchestrator

**Files:**
- Create: `alphacamper-worker/src/index.ts` (replace scaffold)

- [ ] **Step 1: Implement the main loop**

Replace `alphacamper-worker/src/index.ts` with:

```typescript
import http from "node:http";
import { CookieManager } from "./cookie-manager.js";
import {
  fetchActiveWatches,
  groupByCampground,
  shouldCreateAlert,
  createAlert,
  updateLastChecked,
  expireStaleAlerts,
  updateWorkerStatus,
} from "./supabase.js";
import { checkCampground, delay } from "./poller.js";
import { DOMAINS, CYCLE_TIMEOUT_MS, POLL_INTERVAL_FAST_MS, POLL_INTERVAL_SLOW_MS, REQUEST_DELAY_MS, MAX_CAMPGROUNDS_PER_CYCLE, getDisabledPlatforms } from "./config.js";
import { log } from "./logger.js";
import { alertOperator } from "./alerter.js";

const cookieManager = new CookieManager();
const consecutive403: Record<string, number> = {};

// Initialize 403 counters
for (const domain of Object.values(DOMAINS)) {
  consecutive403[domain] = 0;
}

async function runCycle(): Promise<void> {
  const start = Date.now();
  const disabled = getDisabledPlatforms();

  // Expire stale unclaimed alerts (older than 1 hour)
  const expired = await expireStaleAlerts();
  if (expired > 0) log.info(`Expired ${expired} stale alerts`);

  // Fetch active watches
  const watches = await fetchActiveWatches(MAX_CAMPGROUNDS_PER_CYCLE);
  if (watches.length === 0) {
    log.info("No active watches — skipping cycle");
    await updateWorkerStatus({
      lastSuccessfulPoll: false,
      consecutive403,
      platformsHealthy: Object.fromEntries(
        Object.entries(DOMAINS).map(([p, d]) => [p, consecutive403[d] < 3])
      ),
      cycleStats: { checked: 0, alerts: 0, duration_ms: Date.now() - start },
    });
    return;
  }

  const groups = groupByCampground(watches);
  let requestCount = 0;
  let alertCount = 0;
  let successCount = 0;
  const checkedWatchIds: string[] = [];

  for (const [key, watchGroup] of groups) {
    if (requestCount >= MAX_CAMPGROUNDS_PER_CYCLE) break;

    const platform = watchGroup[0].platform;
    if (disabled.has(platform)) continue;

    const domain = DOMAINS[platform];
    if (!domain) continue;

    // Refresh cookies if expired
    if (cookieManager.isExpired(domain)) {
      const ok = await cookieManager.refreshCookies(domain);
      if (!ok) {
        log.warn(`Skipping ${platform} — cookie refresh failed`);
        continue;
      }
    }

    const cookieHeader = cookieManager.getCookieHeader(domain);
    const campgroundId = watchGroup[0].campground_id;

    const outcome = await checkCampground(domain, campgroundId, watchGroup, cookieHeader);
    requestCount++;

    // Handle HTTP status
    if (outcome.httpStatus === 403) {
      consecutive403[domain] = (consecutive403[domain] || 0) + 1;
      // Force cookie refresh for next request to this domain
      cookieManager.forceExpire(domain);
      cookieManager.reduceTtl(domain);
      log.warn(`403 from ${domain} — forcing cookie refresh`, { consecutive: consecutive403[domain] });
    } else if (outcome.httpStatus === 429) {
      log.warn(`429 rate limited from ${domain} — skipping remaining campgrounds for this domain`);
      // Skip rest of this domain's campgrounds this cycle
      continue;
    } else if (outcome.httpStatus === 200) {
      consecutive403[domain] = 0;
      successCount++;
    }

    // Confirm-before-alert: re-check to reduce stale notifications
    for (const result of outcome.results) {
      if (!shouldCreateAlert(result.sites)) continue;

      // Wait 2s and re-check the same campground
      await delay(2000);
      const confirm = await checkCampground(domain, campgroundId, watchGroup, cookieManager.getCookieHeader(domain));
      const confirmedResult = confirm.results.find(r => r.watchId === result.watchId);

      if (confirmedResult && shouldCreateAlert(confirmedResult.sites)) {
        const created = await createAlert(result.watchId, result.userId, confirmedResult.sites);
        if (created) alertCount++;
      } else {
        log.info("Availability gone on re-check — skipped alert", { watchId: result.watchId });
      }
    }

    // Track which watches were checked
    for (const w of watchGroup) {
      checkedWatchIds.push(w.id);
    }

    await delay(REQUEST_DELAY_MS);
  }

  // Update last_checked_at for processed watches
  await updateLastChecked(checkedWatchIds);

  // Check for persistent 403 issues
  for (const [domain, count] of Object.entries(consecutive403)) {
    if (count >= 3) {
      await alertOperator(
        `${domain} returning 403 for ${count} consecutive cycles`,
        "critical",
      );
    }
  }

  const duration = Date.now() - start;
  log.info("Cycle complete", {
    campgrounds: requestCount,
    successful: successCount,
    alerts: alertCount,
    watches: watches.length,
    duration_ms: duration,
  });

  await updateWorkerStatus({
    lastSuccessfulPoll: successCount > 0,
    consecutive403,
    platformsHealthy: Object.fromEntries(
      Object.entries(DOMAINS).map(([p, d]) => [p, consecutive403[d] < 3])
    ),
    cycleStats: {
      checked: requestCount,
      successful: successCount,
      alerts: alertCount,
      watches: watches.length,
      duration_ms: duration,
    },
  });
}

// Health check HTTP server
let lastCycleAt: string | null = null;
let platformsHealthy: Record<string, boolean> = {};

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    const anyUnhealthy = Object.values(consecutive403).some(c => c >= 5);
    const stale = lastCycleAt
      ? Date.now() - new Date(lastCycleAt).getTime() > 30 * 60 * 1000
      : true;
    const healthy = !anyUnhealthy && !stale;

    res.writeHead(healthy ? 200 : 503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      healthy,
      last_cycle: lastCycleAt,
      platforms: platformsHealthy,
      uptime_seconds: Math.floor(process.uptime()),
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(8080, () => {
  log.info("Health check server on :8080");
});

// Main loop with setTimeout (no overlapping cycles)
async function loop() {
  // Adaptive interval: fast (5 min) if any watch arrives within 30 days, slow (15 min) otherwise
  // Determined after the cycle based on what we found
  let interval = POLL_INTERVAL_SLOW_MS;

  log.info(`Starting cycle (next in ${interval / 1000}s)`);

  // Hard cycle timeout
  const timeout = setTimeout(() => {
    log.critical("Cycle timeout — force restarting");
    process.exit(1);
  }, CYCLE_TIMEOUT_MS);

  try {
    await runCycle();
  } catch (err) {
    log.error("Cycle failed", { error: String(err) });
    await alertOperator(`Cycle crashed: ${String(err)}`, "critical");
  } finally {
    clearTimeout(timeout);
    // Update health state for /health endpoint
    lastCycleAt = new Date().toISOString();
    platformsHealthy = Object.fromEntries(
      Object.entries(DOMAINS).map(([p, d]) => [p, (consecutive403[d] || 0) < 3])
    );
    setTimeout(loop, interval);
  }
}

log.info("Alphacamper Worker starting");
loop();
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-worker/src/index.ts
git commit -m "feat: add main loop orchestrator with health check and cycle timeout"
```

---

## Task 9: Database migration

**Files:**
- Create: `alphacamper-site/supabase/migrations/20260320000001_worker_support.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Worker support: alert dedup, round-robin scheduling, health tracking

-- Partial unique index: only one unclaimed alert per watch at a time
-- Allows re-alerts after previous alert is claimed or expired
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_unclaimed_alert_per_watch
  ON availability_alerts (watched_target_id)
  WHERE claimed = false;

-- Round-robin tracking so all watches get fair coverage
ALTER TABLE watched_targets ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- Worker health status (singleton row)
CREATE TABLE IF NOT EXISTS worker_status (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  last_cycle_at TIMESTAMPTZ,
  last_successful_poll_at TIMESTAMPTZ,
  consecutive_403_count INT DEFAULT 0,
  platforms_healthy JSONB DEFAULT '{}',
  cycle_stats JSONB DEFAULT '{}'
);

ALTER TABLE worker_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow worker status upsert" ON worker_status
  FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Apply migration to Supabase**

Run this SQL in the Supabase SQL Editor (manual step — cannot be automated).

- [ ] **Step 3: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-site/supabase/migrations/20260320000001_worker_support.sql
git commit -m "feat: add DB migration for worker support (alert dedup, round-robin, health)"
```

---

## Task 10: Run full test suite and verify build

- [ ] **Step 1: Run worker tests**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Build worker**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npm run build`
Expected: `dist/` directory created, no errors

- [ ] **Step 3: Run site tests (make sure nothing broke)**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npx vitest run`
Expected: All 33 existing tests pass

- [ ] **Step 4: Verify Dockerfile builds**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-worker && docker build -t alphacamper-worker .`
Expected: Image builds successfully (may take a few minutes for Playwright image)

- [ ] **Step 5: Commit any fixes**

```bash
cd /Users/ryan/Code/Alphacamper
git add -A
git commit -m "fix: address issues found during verification"
```

---

## Task 11: Deploy to Railway

This is a manual task with specific steps.

- [ ] **Step 1: Create Railway project**

1. Go to railway.app, create new project
2. Select "Deploy from GitHub repo"
3. Connect the `alphacamper` repo
4. Set root directory to `alphacamper-worker`

- [ ] **Step 2: Set environment variables in Railway dashboard**

```
SUPABASE_URL=<your Supabase URL>
SUPABASE_SERVICE_ROLE_KEY=<your service role key — get from Supabase dashboard>
POLL_INTERVAL_FAST_MS=300000
POLL_INTERVAL_SLOW_MS=900000
CYCLE_TIMEOUT_MS=1200000
SLACK_WEBHOOK_URL=<create a Slack incoming webhook if desired>
DISABLED_PLATFORMS=
LOG_LEVEL=info
```

- [ ] **Step 3: Deploy and verify**

1. Railway auto-deploys on push
2. Check Railway logs for: `[info] Alphacamper Worker starting`
3. Check health endpoint: `curl https://<your-railway-domain>/health`
4. Verify first cycle runs and logs output
5. Check Supabase `worker_status` table for `last_cycle_at` update

- [ ] **Step 4: Commit any final adjustments**

```bash
cd /Users/ryan/Code/Alphacamper
git add -A
git commit -m "fix: address issues found during Railway deployment"
```
