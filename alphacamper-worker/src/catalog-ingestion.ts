import { DOMAINS } from "./config.js";
import type { CamisCampground } from "./id-resolver.js";

export type CatalogSupportStatus =
  | "alertable"
  | "search_only"
  | "coming_soon"
  | "unsupported";

export type CatalogAvailabilityMode =
  | "live_polling"
  | "directory_only"
  | "metadata_only";

export type CatalogConfidence =
  | "verified"
  | "inferred"
  | "seeded"
  | "unknown";

export interface CatalogProviderProfile {
  platform: string;
  providerKey: string;
  providerName: string;
  sourceUrl: string;
  province: string | null;
  supportStatus: CatalogSupportStatus;
  availabilityMode: CatalogAvailabilityMode;
  confidence: CatalogConfidence;
  verificationNote: string;
  staleAfterHours: number;
}

export interface CatalogCampgroundRow {
  id: string;
  platform: string;
  root_map_id: number;
  name: string;
  short_name: string | null;
  province: string | null;
  support_status: CatalogSupportStatus;
  provider_key: string;
  source_url: string;
  last_verified_at: string;
  availability_mode: CatalogAvailabilityMode;
  confidence: CatalogConfidence;
  source_evidence: Record<string, unknown>;
  raw_payload: Record<string, unknown>;
  synced_at: string;
}

const PARKS_CANADA_PROVINCE_CODES = new Set([
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
]);

const PARKS_CANADA_PROVINCE_PATH =
  /\/(?:pn-np|lhn-nhs|amnc-nmca)\/([a-z]{2})\//i;

export const CATALOG_PROVIDER_PROFILES: Record<string, CatalogProviderProfile> = {
  bc_parks: {
    platform: "bc_parks",
    providerKey: "bc_parks",
    providerName: "BC Parks",
    sourceUrl: "https://camping.bcparks.ca/api/resourceLocation",
    province: "BC",
    supportStatus: "alertable",
    availabilityMode: "live_polling",
    confidence: "verified",
    verificationNote: "Official BC Parks CAMIS directory and worker live polling are verified.",
    staleAfterHours: 24,
  },
  ontario_parks: {
    platform: "ontario_parks",
    providerKey: "ontario_parks",
    providerName: "Ontario Parks",
    sourceUrl: "https://reservations.ontarioparks.ca/api/resourceLocation",
    province: "ON",
    supportStatus: "alertable",
    availabilityMode: "live_polling",
    confidence: "verified",
    verificationNote: "Official Ontario Parks CAMIS directory and worker live polling are verified.",
    staleAfterHours: 24,
  },
  parks_canada: {
    platform: "parks_canada",
    providerKey: "parks_canada",
    providerName: "Parks Canada",
    sourceUrl: "https://reservation.pc.gc.ca/api/resourceLocation",
    province: null,
    supportStatus: "alertable",
    availabilityMode: "live_polling",
    confidence: "verified",
    verificationNote: "Official Parks Canada CAMIS directory and worker live polling are verified.",
    staleAfterHours: 24,
  },
  gtc_manitoba: {
    platform: "gtc_manitoba",
    providerKey: "gtc_manitoba",
    providerName: "Manitoba Parks",
    sourceUrl: "https://manitoba.goingtocamp.com/api/resourceLocation",
    province: "MB",
    supportStatus: "alertable",
    availabilityMode: "live_polling",
    confidence: "verified",
    verificationNote: "Official GoingToCamp directory and site-level CAMIS availability polling are verified. Count proof 2026-05-09: 45/45 countable rows, 5,480 campsite IDs, 0 failures. Pair with Railway heartbeat and notification proof before marketing reliability.",
    staleAfterHours: 24,
  },
  gtc_novascotia: {
    platform: "gtc_novascotia",
    providerKey: "gtc_novascotia",
    providerName: "Nova Scotia Parks",
    sourceUrl: "https://novascotia.goingtocamp.com/api/resourceLocation",
    province: "NS",
    supportStatus: "alertable",
    availabilityMode: "live_polling",
    confidence: "verified",
    verificationNote: "Official GoingToCamp directory and site-level CAMIS availability polling are verified. Count proof 2026-05-09: 20/20 countable rows, 1,700 campsite IDs, 0 failures. Pair with Railway heartbeat and notification proof before marketing reliability.",
    staleAfterHours: 24,
  },
  gtc_new_brunswick: {
    platform: "gtc_new_brunswick",
    providerKey: "gtc_new_brunswick",
    providerName: "New Brunswick Parks",
    sourceUrl: "https://reservations.parcsnbparks.ca/api/resourceLocation",
    province: "NB",
    supportStatus: "alertable",
    availabilityMode: "live_polling",
    confidence: "verified",
    verificationNote: "Official New Brunswick Parks CAMIS directory and worker live polling are verified.",
    staleAfterHours: 24,
  },
};

export function getCatalogProviderProfile(platform: string): CatalogProviderProfile {
  const profile = CATALOG_PROVIDER_PROFILES[platform];
  if (profile) return profile;

  const domain = DOMAINS[platform];
  const sourceUrl = domain ? `https://${domain}/api/resourceLocation` : "";
  return {
    platform,
    providerKey: platform,
    providerName: platform,
    sourceUrl,
    province: null,
    supportStatus: "search_only",
    availabilityMode: "directory_only",
    confidence: "unknown",
    verificationNote: "Provider directory can be imported, but support status has not been classified yet.",
    staleAfterHours: 24,
  };
}

export function deriveCatalogProvince(
  platform: string,
  rawPayload: Record<string, unknown>,
  fallbackProvince: string | null,
): string | null {
  if (platform !== "parks_canada") return fallbackProvince;

  for (const candidate of collectStringValues(rawPayload)) {
    const code = candidate.match(PARKS_CANADA_PROVINCE_PATH)?.[1]?.toUpperCase();
    if (code && PARKS_CANADA_PROVINCE_CODES.has(code)) return code;
  }

  return fallbackProvince;
}

function collectStringValues(value: unknown, depth = 0): string[] {
  if (depth > 5 || value == null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.flatMap(item => collectStringValues(item, depth + 1));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(item =>
      collectStringValues(item, depth + 1),
    );
  }
  return [];
}

export function buildCatalogCampgroundRows(
  platform: string,
  campgroundMap: Map<string, CamisCampground>,
  verifiedAt: Date = new Date(),
): CatalogCampgroundRow[] {
  const profile = getCatalogProviderProfile(platform);
  const verifiedIso = verifiedAt.toISOString();
  const seenResourceIds = new Set<number>();
  const rows: CatalogCampgroundRow[] = [];

  for (const entry of campgroundMap.values()) {
    if (seenResourceIds.has(entry.resourceLocationId)) continue;
    seenResourceIds.add(entry.resourceLocationId);

    const name = (entry.fullName || entry.shortName || "").trim();
    if (!name || name.toLowerCase() === "internet") continue;

    const dedupeKey = `${platform}:${entry.resourceLocationId}`;
    const rawPayload = entry.rawPayload ?? {
      resourceLocationId: entry.resourceLocationId,
      rootMapId: entry.rootMapId,
      localizedValues: [{ shortName: entry.shortName, fullName: entry.fullName }],
    };
    const province = deriveCatalogProvince(platform, rawPayload, profile.province);
    const sourceEvidence = {
      source_type: "provider_directory",
      source_url: profile.sourceUrl,
      provider_key: profile.providerKey,
      provider_name: profile.providerName,
      imported_at: verifiedIso,
      external_id: String(entry.resourceLocationId),
      root_map_id: entry.rootMapId,
      dedupe_key: dedupeKey,
      dedupe_rule: "Use provider platform + resourceLocationId as the canonical row; name keys are lookup aliases only.",
      province,
      province_source: platform === "parks_canada" && province
        ? "parks_canada_official_url_path"
        : profile.province
          ? "provider_profile"
          : null,
      availability_mode: profile.availabilityMode,
      confidence: profile.confidence,
      verification_note: profile.verificationNote,
    };

    rows.push({
      id: String(entry.resourceLocationId),
      platform,
      root_map_id: entry.rootMapId,
      name,
      short_name: entry.shortName || null,
      province,
      support_status: profile.supportStatus,
      provider_key: profile.providerKey,
      source_url: profile.sourceUrl,
      last_verified_at: verifiedIso,
      availability_mode: profile.availabilityMode,
      confidence: profile.confidence,
      source_evidence: sourceEvidence,
      raw_payload: rawPayload,
      synced_at: verifiedIso,
    });
  }

  return rows;
}
