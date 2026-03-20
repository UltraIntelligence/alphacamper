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
  fetchUserEmail,
} from "./supabase.js";
import { sendAlertEmail } from "./notify.js";
import { checkCampground, delay, clearCartCache } from "./poller.js";
import {
  fetchCampgroundMap,
  resolveCampground,
  clearCache as clearIdCache,
} from "./id-resolver.js";
import {
  DOMAINS,
  CYCLE_TIMEOUT_MS,
  POLL_INTERVAL_FAST_MS,
  REQUEST_DELAY_MS,
  MAX_CAMPGROUNDS_PER_CYCLE,
  getDisabledPlatforms,
} from "./config.js";
import { log } from "./logger.js";
import { alertOperator } from "./alerter.js";

// ─── Health state ─────────────────────────────────────────────────────────────

let lastCycleAt: string | null = null;
let platformsHealthy: Record<string, boolean> = {};
const consecutive403: Record<string, number> = {};

// Initialize 403 counters for each domain
for (const domain of Object.values(DOMAINS)) {
  consecutive403[domain] = 0;
}

// ─── Health endpoint ──────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    const anyUnhealthy = Object.values(consecutive403).some(c => c >= 5);
    const stale = lastCycleAt
      ? Date.now() - new Date(lastCycleAt).getTime() > 30 * 60 * 1000
      : true;
    const healthy = !anyUnhealthy && !stale;

    res.writeHead(healthy ? 200 : 503, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        healthy,
        last_cycle: lastCycleAt,
        platforms: platformsHealthy,
        uptime_seconds: Math.floor(process.uptime()),
      })
    );
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(8080, () => log.info("Health check server on :8080"));

// ─── Cookie manager (singleton across cycles) ─────────────────────────────────

const cookieManager = new CookieManager();

// ─── Main cycle ───────────────────────────────────────────────────────────────

async function runCycle(): Promise<void> {
  // Step 1: Expire stale unclaimed alerts (>1 hour old)
  await expireStaleAlerts();

  // Step 2: Fetch active watches ordered by last_checked_at (round-robin)
  const watches = await fetchActiveWatches(MAX_CAMPGROUNDS_PER_CYCLE);
  if (watches.length === 0) {
    log.info("No active watches — skipping cycle");
    return;
  }

  log.info("Fetched active watches", { count: watches.length });

  // Step 3: Group by platform:campground_id
  const groups = groupByCampground(watches);
  const disabledPlatforms = getDisabledPlatforms();

  let totalAlerts = 0;
  let totalChecked = 0;
  const platformSkipped429 = new Set<string>();

  // Step 4: Iterate each group
  for (const [groupKey, groupWatches] of groups) {
    const [platform, campgroundId] = groupKey.split(":") as [string, string];
    const domain = DOMAINS[platform];

    if (!domain) {
      log.warn("Unknown platform — skipping group", { platform, campgroundId });
      continue;
    }

    // Step 4a: Kill switch — skip disabled platforms
    if (disabledPlatforms.has(platform)) {
      log.info("Platform disabled — skipping", { platform });
      continue;
    }

    // Step 4g: Skip remaining groups for domains that hit 429 this cycle
    if (platformSkipped429.has(domain)) {
      log.debug("Skipping group due to earlier 429 on domain", { domain, campgroundId });
      continue;
    }

    // Step 4b: Refresh cookies if expired (serial, one domain at a time)
    if (cookieManager.isExpired(domain)) {
      log.info("Cookies expired — refreshing", { domain });
      const refreshed = await cookieManager.refreshCookies(domain);
      if (!refreshed) {
        log.warn("Cookie refresh failed — skipping group", { domain, campgroundId });
        continue;
      }
      consecutive403[domain] = 0;
      // Clear cart cache after cookie refresh since carts are tied to cookies
      clearCartCache();
    }

    const cookieHeader = cookieManager.getCookieHeader(domain);

    // Step 4c: Fetch campground ID map if not cached
    const campgroundMap = await fetchCampgroundMap(domain, cookieHeader);

    // Step 4d: Resolve real Camis mapId for this campground
    const firstWatch = groupWatches[0];
    const resolved = resolveCampground(
      campgroundMap,
      campgroundId,
      firstWatch.campground_name
    );

    if (!resolved) {
      log.warn("Could not resolve campground — skipping group", {
        platform,
        campgroundId,
        campgroundName: firstWatch.campground_name,
      });
      await updateLastChecked(groupWatches.map(w => w.id));
      continue;
    }

    const mapId = resolved.rootMapId;

    // Step 4e: Call checkCampground() with real mapId
    log.debug("Checking campground", { domain, mapId, campgroundId, watchCount: groupWatches.length });

    const outcome = await checkCampground(domain, mapId, groupWatches, cookieHeader);

    // Step 4f: Handle 403 — force expire cookies, increment counter, reduce TTL
    if (outcome.httpStatus === 403) {
      consecutive403[domain] = (consecutive403[domain] || 0) + 1;
      log.warn("403 received — forcing cookie expiry", {
        domain,
        consecutive: consecutive403[domain],
      });
      cookieManager.forceExpire(domain);
      cookieManager.reduceTtl(domain);
      clearCartCache();
      clearIdCache();
      // Don't update last_checked — will retry next cycle
      continue;
    }

    // Reset 403 counter on success
    if (outcome.httpStatus === 200 || outcome.httpStatus === null) {
      consecutive403[domain] = 0;
    }

    // Step 4g: Handle 429 — skip remaining for this domain
    if (outcome.httpStatus === 429) {
      log.warn("429 received — skipping remaining groups for domain", { domain });
      platformSkipped429.add(domain);
      continue;
    }

    totalChecked++;

    // Step 4h: Confirm-before-alert — wait 2s, re-check for each result with availability
    for (const result of outcome.results) {
      if (!shouldCreateAlert(result.sites)) continue;

      log.info("Availability detected — confirming in 2s", {
        watchId: result.watchId,
        siteCount: result.sites.length,
      });

      await delay(2000);

      // Re-check the same campground to confirm
      const confirmOutcome = await checkCampground(
        domain,
        mapId,
        groupWatches.filter(w => w.id === result.watchId),
        cookieManager.getCookieHeader(domain)
      );

      const confirmResult = confirmOutcome.results.find(r => r.watchId === result.watchId);

      if (!confirmResult || !shouldCreateAlert(confirmResult.sites)) {
        log.info("Availability not confirmed on re-check — skipping alert", {
          watchId: result.watchId,
        });
        continue;
      }

      // Step 4i: Create alert for confirmed availability
      const created = await createAlert(result.watchId, result.userId, confirmResult.sites);
      if (created) {
        totalAlerts++;
        log.info("Alert created after confirmation", {
          watchId: result.watchId,
          userId: result.userId,
          siteCount: confirmResult.sites.length,
        });

        // Step 4i-b: Send email notification (non-blocking, errors logged but don't crash)
        const watch = groupWatches.find(w => w.id === result.watchId);
        if (watch) {
          const email = await fetchUserEmail(result.userId);
          if (email) {
            await sendAlertEmail({
              email,
              campgroundName: watch.campground_name,
              platform: watch.platform,
              arrivalDate: watch.arrival_date,
              departureDate: watch.departure_date,
              sites: confirmResult.sites,
            });
          }
        }
      }
    }

    // Step 4j: Update last_checked_at for all watches in this group
    await updateLastChecked(groupWatches.map(w => w.id));

    // Step 4k: Delay between requests
    await delay(REQUEST_DELAY_MS);
  }

  // Step 5: Update worker_status
  await updateWorkerStatus({
    last_cycle_at: new Date().toISOString(),
    watches_checked: totalChecked,
    alerts_created: totalAlerts,
    consecutive_403: consecutive403,
  });

  // Step 6: Check for persistent 403s — alert operator
  for (const [domain, count] of Object.entries(consecutive403)) {
    if (count >= 3) {
      await alertOperator(
        `Persistent 403s on ${domain} (${count} consecutive) — cookies may be blocked`,
        count >= 5 ? "critical" : "warn"
      );
    }
  }

  log.info("Cycle complete", { totalChecked, totalAlerts });
}

// ─── Loop ─────────────────────────────────────────────────────────────────────

async function loop() {
  const interval = POLL_INTERVAL_FAST_MS; // Can be adaptive later

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
    lastCycleAt = new Date().toISOString();
    platformsHealthy = Object.fromEntries(
      Object.entries(DOMAINS).map(([p, d]) => [p, (consecutive403[d] || 0) < 3])
    );
    setTimeout(loop, interval);
  }
}

log.info("Alphacamper Worker starting");
loop();
