/// <reference types="node" />
/**
 * Secret-safe demand capture smoke checker.
 *
 * It writes one controlled unsupported/search-only campground request through
 * the public production path, verifies the row in live Supabase without
 * printing customer emails, then deletes the smoke row by default.
 *
 * Usage:
 *   npm run smoke:demand
 *   npm run smoke:demand -- --allow-yellow
 *   npm run smoke:demand -- --keep-records
 */

import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SITE_URL = "https://alphacamper.com";

type SmokeStatus = "green" | "yellow" | "red";

type Options = {
  siteUrl: string;
  allowYellow: boolean;
  keepRecords: boolean;
  email: string;
  platform: string;
  campgroundId: string;
  campgroundName: string;
  supportStatus: string;
};

type InterestRow = {
  id: string;
  platform: string | null;
  campground_id: string | null;
  campground_name: string | null;
  support_status: string | null;
  created_at: string | null;
};

type DemandSummary = {
  totalRows: number;
  uniqueCampgrounds: number;
  rowsForSmokeCampground: number;
  supportStatusMix: Record<string, number>;
  platformMix: Record<string, number>;
};

function loadLocalEnv() {
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
}

function requireValue(argv: string[], index: number, flag: string) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function parseArgs(argv: string[]): Options {
  const nonce = Date.now().toString(36);
  const options: Options = {
    siteUrl: DEFAULT_SITE_URL,
    allowYellow: false,
    keepRecords: false,
    email: `codex-demand-smoke+${nonce}@alphacamper.test`,
    platform: "sepaq",
    campgroundId: `codex-demand-smoke-${nonce}`,
    campgroundName: "Codex Demand Smoke Campground",
    supportStatus: "coming_soon",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--allow-yellow") {
      options.allowYellow = true;
      continue;
    }
    if (arg === "--keep-records") {
      options.keepRecords = true;
      continue;
    }
    if (arg === "--site-url") {
      options.siteUrl = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--email") {
      options.email = requireValue(argv, index, arg).toLowerCase();
      index += 1;
      continue;
    }
    if (arg === "--platform") {
      options.platform = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--campground-id") {
      options.campgroundId = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--campground-name") {
      options.campgroundName = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--support-status") {
      options.supportStatus = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  options.siteUrl = options.siteUrl.replace(/\/$/, "");
  return options;
}

function printLine(label: string, value: string | number | boolean | null | undefined) {
  console.log(`${label.padEnd(28)} ${value ?? "none"}`);
}

function incrementCount(counts: Record<string, number>, key: string | null | undefined) {
  const normalized = key?.trim() || "unknown";
  counts[normalized] = (counts[normalized] ?? 0) + 1;
}

function summarizeDemand(rows: InterestRow[], options: Options): DemandSummary {
  const campgroundKeys = new Set<string>();
  const supportStatusMix: Record<string, number> = {};
  const platformMix: Record<string, number> = {};
  let rowsForSmokeCampground = 0;

  for (const row of rows) {
    const platform = row.platform?.trim() || "unknown";
    const campgroundId = row.campground_id?.trim() || "unknown";

    campgroundKeys.add(`${platform}:${campgroundId}`);
    incrementCount(supportStatusMix, row.support_status);
    incrementCount(platformMix, row.platform);

    if (platform === options.platform && campgroundId === options.campgroundId) {
      rowsForSmokeCampground += 1;
    }
  }

  return {
    totalRows: rows.length,
    uniqueCampgrounds: campgroundKeys.size,
    rowsForSmokeCampground,
    supportStatusMix,
    platformMix,
  };
}

function formatCounts(counts: Record<string, number>) {
  const entries = Object.entries(counts);
  if (entries.length === 0) return "none";

  return entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join(", ");
}

function evaluateStatus(input: {
  configError: string | null;
  postOk: boolean;
  verifiedRow: boolean;
  demandAggregateIncludesRow: boolean;
  cleanupOk: boolean;
  keepRecords: boolean;
}): SmokeStatus {
  if (input.configError || !input.postOk || !input.verifiedRow || !input.demandAggregateIncludesRow) {
    return "red";
  }

  if (!input.keepRecords && !input.cleanupOk) {
    return "yellow";
  }

  return "green";
}

async function postInterest(options: Options) {
  const response = await fetch(`${options.siteUrl}/api/campground-interest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: options.email,
      platform: options.platform,
      campgroundId: options.campgroundId,
      campgroundName: options.campgroundName,
      supportStatus: options.supportStatus,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  return {
    ok: response.ok && payload?.success === true,
    status: response.status,
    payload,
  };
}

async function main() {
  loadLocalEnv();

  const options = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const configError = !supabaseUrl || !serviceRoleKey
    ? "Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    : null;

  console.log("Demand Capture Smoke");
  printLine("Site", options.siteUrl);
  printLine("Platform", options.platform);
  printLine("Support status", options.supportStatus);
  printLine("Keep records", options.keepRecords ? "yes" : "no");

  if (configError) {
    printLine("Status", "red");
    printLine("Supabase configured", "no");
    printLine("Supabase error", configError);
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let postOk = false;
  let postStatus: number | null = null;
  let postError: string | null = null;
  let verifiedRow = false;
  let aggregateIncludesRow = false;
  let cleanupOk = options.keepRecords;
  let cleanupError: string | null = null;
  let demandSummary: DemandSummary = {
    totalRows: 0,
    uniqueCampgrounds: 0,
    rowsForSmokeCampground: 0,
    supportStatusMix: {},
    platformMix: {},
  };

  try {
    const postResult = await postInterest(options);
    postOk = postResult.ok;
    postStatus = postResult.status;
    postError = postResult.ok ? null : JSON.stringify(postResult.payload);

    const { data: smokeRows, error: verifyError } = await supabase
      .from("campground_interest")
      .select("id, platform, campground_id, campground_name, support_status, created_at")
      .eq("email", options.email)
      .eq("platform", options.platform)
      .eq("campground_id", options.campgroundId);

    if (verifyError) {
      throw new Error(`Verify row failed: ${verifyError.message}`);
    }

    verifiedRow = (smokeRows ?? []).length > 0;

    const { data: demandRows, error: demandError } = await supabase
      .from("campground_interest")
      .select("id, platform, campground_id, campground_name, support_status, created_at");

    if (demandError) {
      throw new Error(`Demand aggregate read failed: ${demandError.message}`);
    }

    demandSummary = summarizeDemand(demandRows ?? [], options);
    aggregateIncludesRow = demandSummary.rowsForSmokeCampground > 0;
  } catch (error) {
    postError = error instanceof Error ? error.message : "Demand smoke failed";
  } finally {
    if (!options.keepRecords) {
      const { error: deleteError } = await supabase
        .from("campground_interest")
        .delete()
        .eq("email", options.email)
        .eq("platform", options.platform)
        .eq("campground_id", options.campgroundId);

      if (deleteError) {
        cleanupOk = false;
        cleanupError = deleteError.message;
      } else {
        cleanupOk = true;
      }
    }
  }

  const status = evaluateStatus({
    configError,
    postOk,
    verifiedRow,
    demandAggregateIncludesRow: aggregateIncludesRow,
    cleanupOk,
    keepRecords: options.keepRecords,
  });

  printLine("Status", status);
  printLine("Supabase configured", "yes");
  printLine("Post status", postStatus);
  printLine("Post accepted", postOk ? "yes" : "no");
  printLine("Verified row", verifiedRow ? "yes" : "no");
  printLine("Aggregate has row", aggregateIncludesRow ? "yes" : "no");
  printLine("Demand total rows", demandSummary.totalRows);
  printLine("Unique campgrounds", demandSummary.uniqueCampgrounds);
  printLine("Smoke campground rows", demandSummary.rowsForSmokeCampground);
  printLine("Support status mix", formatCounts(demandSummary.supportStatusMix));
  printLine("Platform mix", formatCounts(demandSummary.platformMix));
  printLine("Cleanup", cleanupOk ? (options.keepRecords ? "kept" : "deleted") : "failed");
  printLine("Post error", postError);
  printLine("Cleanup error", cleanupError);

  console.log("");
  console.log("Next action: use an approved operator account to verify the protected dashboard panel renders this demand queue.");

  if (status === "red" || (status === "yellow" && !options.allowYellow)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
