import type { AvailableSite } from "./supabase.js";

export type AspiraPlatform = "alberta_parks" | "saskatchewan_parks";

export interface AspiraProviderProfile {
  platform: AspiraPlatform;
  providerName: string;
  contractCode: "ABPP" | "SKPP";
  baseUrl: string;
  province: "AB" | "SK";
  supportStatus: "search_only";
  availabilityMode: "html_calendar";
  verificationNote: string;
}

export interface AspiraCampground {
  platform: AspiraPlatform;
  parkId: string;
  name: string;
  province: string;
  bookingUrl: string;
  latitude: number | null;
  longitude: number | null;
  rawHtml: string;
}

export interface AspiraDirectoryParseResult {
  rows: AspiraCampground[];
  total: number | null;
  nextStartIdx: number | null;
}

export interface AspiraCalendarSite {
  siteId: string;
  siteName: string;
  loopName: string | null;
  availableDates: string[];
  bookingUrlsByDate: Record<string, string>;
}

export const ASPIRA_PROVIDER_PROFILES: Record<AspiraPlatform, AspiraProviderProfile> = {
  alberta_parks: {
    platform: "alberta_parks",
    providerName: "Alberta Parks",
    contractCode: "ABPP",
    baseUrl: "https://shop.albertaparks.ca",
    province: "AB",
    supportStatus: "search_only",
    availabilityMode: "html_calendar",
    verificationNote:
      "Official Shop.AlbertaParks.ca pages use Aspira/ReserveAmerica HTML directory and campsite calendar pages. Keep search-only until live polling and notification smoke tests pass.",
  },
  saskatchewan_parks: {
    platform: "saskatchewan_parks",
    providerName: "Saskatchewan Parks",
    contractCode: "SKPP",
    baseUrl: "https://parks.saskatchewan.ca",
    province: "SK",
    supportStatus: "search_only",
    availabilityMode: "html_calendar",
    verificationNote:
      "Official Parks.Saskatchewan.ca pages use the same Aspira/ReserveAmerica HTML directory and campsite calendar shape. Keep search-only until live polling and notification smoke tests pass.",
  },
};

export const ASPIRA_PROOF_PLATFORMS = Object.keys(
  ASPIRA_PROVIDER_PROFILES,
) as AspiraPlatform[];

export function isAspiraPlatform(platform: string): platform is AspiraPlatform {
  return Object.hasOwn(ASPIRA_PROVIDER_PROFILES, platform);
}

export function getAspiraProviderProfile(platform: string): AspiraProviderProfile | null {
  return isAspiraPlatform(platform) ? ASPIRA_PROVIDER_PROFILES[platform] : null;
}

export function buildAspiraDirectoryUrl(
  profile: AspiraProviderProfile,
  startIdx = 0,
): string {
  const url = new URL("/campgroundDirectoryList.do", profile.baseUrl);
  url.searchParams.set("contractCode", profile.contractCode);
  if (startIdx > 0) url.searchParams.set("startIdx", String(startIdx));
  return url.toString();
}

export function buildAspiraCalendarUrl(
  profile: AspiraProviderProfile,
  parkId: string,
  arrivalDate: string,
  startIdx = 0,
): string {
  const url = new URL("/campsiteCalendar.do", profile.baseUrl);
  url.searchParams.set("page", "matrix");
  url.searchParams.set("contractCode", profile.contractCode);
  url.searchParams.set("parkId", parkId);
  url.searchParams.set("calarvdate", formatAspiraCalendarDate(arrivalDate));
  if (startIdx > 0) url.searchParams.set("startIdx", String(startIdx));
  return url.toString();
}

export function parseAspiraDirectory(
  html: string,
  profile: AspiraProviderProfile,
): AspiraDirectoryParseResult {
  const rows: AspiraCampground[] = [];
  const seenParkIds = new Set<string>();
  const rowMatches = html.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? [];

  for (const rowHtml of rowMatches) {
    if (!rowHtml.includes(`contractCode=${profile.contractCode}`)) continue;
    if (!/\/(?:camping\/[^"']+\/r\/)?(?:campgroundDetails|facilityDetails)\.do/i.test(rowHtml)) {
      continue;
    }

    const parkId = firstMatch(rowHtml, /parkId=(\d+)/i);
    if (!parkId || seenParkIds.has(parkId)) continue;

    const name = extractDirectoryName(rowHtml, parkId);
    if (!name) continue;

    seenParkIds.add(parkId);
    const href = extractDirectoryHref(rowHtml, parkId) ?? `/campgroundDetails.do?contractCode=${profile.contractCode}&parkId=${parkId}`;
    const coords = extractDirectoryCoordinates(rowHtml);

    rows.push({
      platform: profile.platform,
      parkId,
      name,
      province: extractProvince(rowHtml) ?? profile.province,
      bookingUrl: absoluteAspiraUrl(profile.baseUrl, href),
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      rawHtml: rowHtml,
    });
  }

  return {
    rows,
    total: parseInteger(firstMatch(html, /id=['"]resulttotal_top['"][^>]*>\s*(\d+)/i)),
    nextStartIdx: parseInteger(firstMatch(html, /startIdx=(\d+)/i)),
  };
}

export function parseAspiraCalendar(html: string, baseUrl: string): AspiraCalendarSite[] {
  const rows: AspiraCalendarSite[] = [];
  const rowMatches = html.match(/<div class=['"]br['"]>[\s\S]*?(?=<div class=['"]br['"]>|<div class=['"]thead['"]|<script\b|$)/gi) ?? [];

  for (const rowHtml of rowMatches) {
    const siteId = firstMatch(rowHtml, /campsiteDetails\.do\?[^'"]*siteId=(\d+)/i);
    if (!siteId) continue;

    const siteName = extractSiteName(rowHtml, siteId);
    if (!siteName) continue;

    const loopName = cleanHtmlText(
      firstMatch(rowHtml, /<div class=['"]td loopName['"][^>]*>([\s\S]*?)<\/div>/i) ?? "",
    ) || null;
    const bookingUrlsByDate: Record<string, string> = {};
    const availableDates: string[] = [];
    const availabilityLinks = rowHtml.match(/<a\b[^>]*class=['"][^'"]*\bavail\b[^'"]*['"][^>]*>[\s\S]*?<\/a>/gi) ?? [];

    for (const linkHtml of availabilityLinks) {
      const href = decodeHtmlText(firstMatch(linkHtml, /href=['"]([^'"]+)['"]/i) ?? "");
      const rawDate = firstMatch(href, /(?:\?|&)arvdate=([^&]+)/i);
      const isoDate = rawDate ? parseAspiraDateParam(decodeURIComponent(rawDate)) : null;
      if (!isoDate) continue;

      availableDates.push(isoDate);
      bookingUrlsByDate[isoDate] = absoluteAspiraUrl(baseUrl, href);
    }

    rows.push({
      siteId,
      siteName,
      loopName,
      availableDates: [...new Set(availableDates)].sort(),
      bookingUrlsByDate,
    });
  }

  return rows;
}

export function findAspiraAvailableSitesForStay(
  html: string,
  baseUrl: string,
  arrivalDate: string,
  departureDate: string,
): AvailableSite[] {
  const requiredDates = stayNights(arrivalDate, departureDate);
  if (requiredDates.length === 0) return [];

  return parseAspiraCalendar(html, baseUrl)
    .filter(site => {
      const available = new Set(site.availableDates);
      return requiredDates.every(date => available.has(date));
    })
    .map(site => ({
      siteId: site.siteId,
      siteName: site.loopName ? `${site.siteName} (${site.loopName})` : site.siteName,
    }));
}

function extractDirectoryName(rowHtml: string, parkId: string): string | null {
  const links = [...rowHtml.matchAll(/<a\b[^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi)];
  for (const match of links) {
    const href = decodeHtmlText(match[1] ?? "");
    if (!href.includes(`parkId=${parkId}`)) continue;
    if (!/(campgroundDetails|facilityDetails)\.do/i.test(href)) continue;

    const label = cleanHtmlText(match[2] ?? "");
    if (!label || /^enter date$/i.test(label) || /^map$/i.test(label)) continue;
    return label;
  }
  return null;
}

function extractDirectoryHref(rowHtml: string, parkId: string): string | null {
  const links = [...rowHtml.matchAll(/<a\b[^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi)];
  for (const match of links) {
    const href = decodeHtmlText(match[1] ?? "");
    const label = cleanHtmlText(match[2] ?? "");
    if (!href.includes(`parkId=${parkId}`)) continue;
    if (!/(campgroundDetails|facilityDetails)\.do/i.test(href)) continue;
    if (!label || /^enter date$/i.test(label) || /^map$/i.test(label)) continue;
    return href;
  }
  return null;
}

function extractDirectoryCoordinates(rowHtml: string): { latitude: number; longitude: number } | null {
  const match = rowHtml.match(/(?:&#39;|')(-?\d+(?:\.\d+)?):(-?\d+(?:\.\d+)?)(?:&#39;|')/i);
  if (!match) return null;

  const longitude = Number(match[1]);
  const latitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function extractProvince(rowHtml: string): string | null {
  return firstMatch(rowHtml, /<td[^>]*>\s*([A-Z]{2})\s*<br/i);
}

function extractSiteName(rowHtml: string, siteId: string): string | null {
  const ariaLabel = firstMatch(rowHtml, new RegExp(`aria-label=['"]Site:\\s*([^'"]*?)\\s*\\(${siteId}\\)['"]`, "i"));
  if (ariaLabel) return cleanHtmlText(ariaLabel);

  const label = firstMatch(rowHtml, /<div class=['"]siteListLabel['"][^>]*>\s*<a\b[^>]*>([\s\S]*?)<\/a>/i);
  return label ? cleanHtmlText(label) : null;
}

function firstMatch(input: string, regex: RegExp): string | null {
  const match = input.match(regex);
  if (!match) return null;
  if (match.length > 2) return match.slice(1).filter(Boolean).join(":");
  return match[1] ?? null;
}

function parseInteger(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanHtmlText(value: string): string {
  return decodeHtmlText(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function absoluteAspiraUrl(baseUrl: string, href: string): string {
  return new URL(decodeHtmlText(href), baseUrl).toString();
}

function formatAspiraCalendarDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return [
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    String(date.getUTCFullYear()),
  ].join("/");
}

function parseAspiraDateParam(value: string): string | null {
  const parts = value.split("/").map(part => Number.parseInt(part, 10));
  if (parts.length !== 3) return null;
  const [month, day, year] = parts;
  if (!month || !day || !year) return null;
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function stayNights(arrivalDate: string, departureDate: string): string[] {
  const arrival = parseIsoDate(arrivalDate);
  const departure = parseIsoDate(departureDate);
  if (departure <= arrival) return [];

  const dates: string[] = [];
  for (let cursor = new Date(arrival); cursor < departure; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

function parseIsoDate(value: string): Date {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error(`Expected YYYY-MM-DD date, got ${value}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}
