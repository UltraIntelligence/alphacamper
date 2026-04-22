/// <reference types="node" />
/**
 * One-off campground directory sync.
 *
 * Runs the same directory-sync the worker runs at startup, but on
 * demand from your machine. Useful when:
 *   (a) the deployed worker hasn't populated a platform (e.g. parks_canada
 *       shows 0 rows in the campgrounds table because prod hasn't
 *       successfully completed a sync yet)
 *   (b) you want to force a refresh without restarting Railway
 *
 * Requires env (auto-loaded from .env.local by src/env.ts):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Requires Playwright Chromium — `npx playwright install chromium`
 * once if you've never run the worker locally.
 *
 * Usage
 * -----
 *   # Sync all three Camis platforms (bc_parks, ontario_parks, parks_canada)
 *   npx tsx scripts/sync-directory.ts
 *
 *   # Sync one platform
 *   npx tsx scripts/sync-directory.ts parks_canada
 *
 *   # Show what would happen, write nothing
 *   npx tsx scripts/sync-directory.ts parks_canada --dry-run
 *
 * Exit code is 0 when every requested platform syncs at least one row,
 * 1 if any platform returned an empty map (cookie / WAF failure) or
 * errored during upsert.
 */

import "../src/env.js"; // auto-loads worker's .env.local / .env
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Fall back to the site's .env.local if Supabase vars aren't in the worker's
// env — makes this script runnable without duplicating secrets.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const siteEnv = resolve(process.cwd(), "../alphacamper-site/.env.local");
  if (existsSync(siteEnv)) {
    process.loadEnvFile(siteEnv);
    if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
  }
}

import { CookieManager } from "../src/cookie-manager.js";
import { syncDirectoryForDomain } from "../src/directory-sync.js";
import { DOMAINS, SUPPORTED_PLATFORMS } from "../src/config.js";
import { fetchCampgroundMap } from "../src/id-resolver.js";

interface RunOptions {
  platforms: string[];
  dryRun: boolean;
}

function parseArgs(argv: string[]): RunOptions {
  const dryRun = argv.includes("--dry-run");
  const positional = argv.filter((a) => !a.startsWith("--"));

  let platforms: string[];
  if (positional.length === 0) {
    platforms = SUPPORTED_PLATFORMS;
  } else {
    const unknown = positional.filter((p) => !DOMAINS[p]);
    if (unknown.length > 0) {
      console.error(
        `Unknown platform(s): ${unknown.join(", ")}. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
      );
      process.exit(2);
    }
    platforms = positional;
  }

  return { platforms, dryRun };
}

async function runOnePlatform(
  platform: string,
  cookieManager: CookieManager,
  dryRun: boolean,
): Promise<{ platform: string; cookieOk: boolean; rows: number; wrote: boolean }> {
  const domain = DOMAINS[platform];

  const summary = { platform, cookieOk: false, rows: 0, wrote: false };

  console.log(`\n─── ${platform} · ${domain} ───`);
  console.log("1/3  Refreshing cookies via Playwright…");

  const ok = await cookieManager.refreshCookies(domain);
  summary.cookieOk = ok;
  if (!ok) {
    console.error(
      `     FAILED. Cookie refresh did not complete — likely CAPTCHA or WAF block.`,
    );
    return summary;
  }
  const header = cookieManager.getCookieHeader(domain);
  console.log(`     OK (${header.length} chars)`);

  if (dryRun) {
    console.log("2/3  Dry-run: fetching campground map but not upserting…");
    try {
      const map = await fetchCampgroundMap(domain, header);
      const ids = new Set<number>();
      for (const entry of map.values()) ids.add(entry.resourceLocationId);
      summary.rows = ids.size;
      console.log(`     Directory returned ${ids.size} unique facilities.`);
    } catch (err) {
      console.error(`     fetchCampgroundMap threw: ${String(err)}`);
    }
    return summary;
  }

  console.log("2/3  Running directory sync → campgrounds table…");
  try {
    await syncDirectoryForDomain(platform, header);
    summary.wrote = true;
    console.log("3/3  Done.");
  } catch (err) {
    console.error(`     syncDirectoryForDomain threw: ${String(err)}`);
  }
  return summary;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Create alphacamper-worker/.env.local with both set, then re-run.",
    );
    process.exit(2);
  }

  console.log(`Targets: ${opts.platforms.join(", ")}${opts.dryRun ? "  (dry-run)" : ""}`);

  const cookieManager = new CookieManager();
  const results: Awaited<ReturnType<typeof runOnePlatform>>[] = [];

  for (const platform of opts.platforms) {
    results.push(await runOnePlatform(platform, cookieManager, opts.dryRun));
  }

  console.log("\n═══ Summary ═══");
  for (const r of results) {
    const status = opts.dryRun
      ? r.cookieOk
        ? `${r.rows} facilities would be upserted`
        : "cookie refresh failed"
      : r.wrote
        ? "upsert complete (see logs above)"
        : "FAILED";
    console.log(`  ${r.platform.padEnd(16)} ${status}`);
  }

  const anyFailed = results.some(
    (r) => !r.cookieOk || (!opts.dryRun && !r.wrote) || (opts.dryRun && r.rows === 0),
  );
  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
