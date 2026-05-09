import { log } from "./logger.js";
import { fetchCampgroundMap } from "./id-resolver.js";
import {
  markMissingCatalogRowsUnsupported,
  recordCatalogProviderSync,
  upsertCampgrounds,
} from "./supabase.js";
import { DOMAINS } from "./config.js";
import {
  buildCatalogCampgroundRows,
  getCatalogProviderProfile,
  type CatalogProviderProfile,
} from "./catalog-ingestion.js";

const BATCH_SIZE = 200;

export interface DirectorySyncResult {
  platform: string;
  status: "succeeded" | "failed";
  rows: number;
  staleRows: number;
  sourceUrl: string;
  lastVerifiedAt: string | null;
  error: string | null;
}

async function markProviderSync(
  profile: CatalogProviderProfile,
  result: DirectorySyncResult,
): Promise<void> {
  await recordCatalogProviderSync({
    provider_key: profile.providerKey,
    provider_name: profile.providerName,
    source_url: profile.sourceUrl,
    support_status: profile.supportStatus,
    availability_mode: profile.availabilityMode,
    confidence: profile.confidence,
    status: result.status,
    row_count: result.rows,
    last_attempted_at: new Date().toISOString(),
    last_success_at: result.status === "succeeded" ? result.lastVerifiedAt : null,
    last_error: result.error,
    stale_after_hours: profile.staleAfterHours,
    metadata_json: {
      platform: profile.platform,
      verification_note: profile.verificationNote,
      stale_rows_marked_unsupported: result.staleRows,
    },
  });
}

export async function recordCatalogProviderSyncFailure(
  platform: string,
  error: string,
): Promise<void> {
  const profile = getCatalogProviderProfile(platform);
  await markProviderSync(profile, {
    platform,
    status: "failed",
    rows: 0,
    staleRows: 0,
    sourceUrl: profile.sourceUrl,
    lastVerifiedAt: null,
    error,
  });
}

export async function syncDirectoryForDomain(
  platform: string,
  cookieHeader: string,
): Promise<DirectorySyncResult> {
  const domain = DOMAINS[platform];
  const profile = getCatalogProviderProfile(platform);
  if (!domain) {
    return {
      platform,
      status: "failed",
      rows: 0,
      staleRows: 0,
      sourceUrl: profile.sourceUrl,
      lastVerifiedAt: null,
      error: "Unknown provider platform",
    };
  }

  const map = await fetchCampgroundMap(domain, cookieHeader);
  if (map.size === 0) {
    const result = {
      platform,
      status: "failed" as const,
      rows: 0,
      staleRows: 0,
      sourceUrl: profile.sourceUrl,
      lastVerifiedAt: null,
      error: "Provider directory returned no campground rows",
    };
    await markProviderSync(profile, result);
    log.warn("Empty campground map — skipping sync", { platform });
    return result;
  }

  const verifiedAt = new Date();
  const rows = buildCatalogCampgroundRows(platform, map, verifiedAt);

  let allSucceeded = true;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const ok = await upsertCampgrounds(rows.slice(i, i + BATCH_SIZE));
    if (!ok) allSucceeded = false;
  }

  let staleRows = 0;
  if (allSucceeded) {
    staleRows = await markMissingCatalogRowsUnsupported(
      platform,
      rows.map(row => row.id),
      {
        sourceUrl: profile.sourceUrl,
        checkedAt: verifiedAt.toISOString(),
      },
    );
  }

  const result = {
    platform,
    status: allSucceeded ? "succeeded" as const : "failed" as const,
    rows: rows.length,
    staleRows,
    sourceUrl: profile.sourceUrl,
    lastVerifiedAt: allSucceeded ? verifiedAt.toISOString() : null,
    error: allSucceeded ? null : "One or more catalog upsert batches failed",
  };
  await markProviderSync(profile, result);

  if (allSucceeded) {
    log.info("Directory sync complete", { platform, count: rows.length });
  } else {
    log.warn("Directory sync completed with errors", { platform, count: rows.length });
  }
  return result;
}
