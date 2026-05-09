import { describe, expect, it } from "vitest";

import {
  ASPIRA_PROVIDER_PROFILES,
  ASPIRA_PROOF_PLATFORMS,
  buildAspiraCalendarUrl,
  buildAspiraDirectoryUrl,
  findAspiraAvailableSitesForStay,
  parseAspiraCalendar,
  parseAspiraDirectory,
} from "../src/aspira.js";
import { DOMAINS, SUPPORTED_PLATFORMS } from "../src/config.js";

const albertaDirectoryHtml = `
<span id='resulttotal_top'>109</span>
<tr>
  <td><a href='/camping/aspen-beach-provincial-park/r/campgroundDetails.do?contractCode=ABPP&amp;parkId=330101'>Enter Date</a></td>
  <td><a href='/camping/aspen-beach-provincial-park/r/campgroundDetails.do?contractCode=ABPP&amp;parkId=330101'>Aspen Beach Provincial Park<br></a></td>
  <td>AB<br><a href='javascript: new UnifiedSearchEngine().switchViewType(&#39;view_map&#39;, &#39;/unifSearchResults.do?contractCode=ABPP&amp;parkId=330101&amp;reset&#39;, &#39;ABPP330101&#39;, &#39;-113.9777778:52.4569444&#39; )'>Map</a></td>
</tr>
<tr>
  <td><a href='/camping/bow-valley-provincial-park/r/campgroundDetails.do?contractCode=ABPP&amp;parkId=330258'>Enter Date</a></td>
  <td><a href='/camping/bow-valley-provincial-park/r/campgroundDetails.do?contractCode=ABPP&amp;parkId=330258'>Bow Valley Provincial Park<br></a></td>
  <td>AB<br><a href='javascript: new UnifiedSearchEngine().switchViewType(&#39;view_map&#39;, &#39;/unifSearchResults.do?contractCode=ABPP&amp;parkId=330258&amp;reset&#39;, &#39;ABPP330258&#39;, &#39;-115.1024778:51.0828694&#39; )'>Map</a></td>
</tr>`;

const saskatchewanDirectoryHtml = `
<span id='resulttotal_top'>24</span>
<tr>
  <td><a href='/camping/buffalo-pound-provincial-park/r/campgroundDetails.do?contractCode=SKPP&amp;parkId=290170'>Enter Date</a></td>
  <td><a href='/camping/buffalo-pound-provincial-park/r/facilityDetails.do?contractCode=SKPP&amp;parkId=290170'>Buffalo Pound Provincial Park<br></a></td>
  <td>SK<br><a href='javascript: new UnifiedSearchEngine().switchViewType(&#39;view_map&#39;, &#39;/unifSearchResults.do?contractCode=SKPP&amp;parkId=290170&amp;reset&#39;, &#39;SKPP290170&#39;, &#39;-105.4227972:50.5852778&#39; )'>Map</a></td>
</tr>`;

const albertaCalendarHtml = `
<div class='br'>
  <div class='td sn'>
    <div class='siteListLabel'><a href='/camping/bow-valley-provincial-park/r/campsiteDetails.do?siteId=41737&amp;contractCode=ABPP&amp;parkId=330258' aria-label='Site: 04 (41737)'>04</a></div>
  </div>
  <div class='td loopName' title='Bow River'>Bow River</div>
  <div class='td status a'><a href='/camping/bow-valley-provincial-park/r/campsiteDetails.do?siteId=41737&amp;contractCode=ABPP&amp;parkId=330258&amp;arvdate=5/9/2026&amp;lengthOfStay=1' class='avail'>A</a></div>
  <div class='td status a'><a href='/camping/bow-valley-provincial-park/r/campsiteDetails.do?siteId=41737&amp;contractCode=ABPP&amp;parkId=330258&amp;arvdate=5/10/2026&amp;lengthOfStay=1' class='avail'>A</a></div>
  <div class='td status r'>R</div>
</div>
<div class='br'>
  <div class='td sn'>
    <div class='siteListLabel'><a href='/camping/bow-valley-provincial-park/r/campsiteDetails.do?siteId=41738&amp;contractCode=ABPP&amp;parkId=330258' aria-label='Site: 05 (41738)'>05</a></div>
  </div>
  <div class='td loopName' title='Bow River'>Bow River</div>
  <div class='td status a'><a href='/camping/bow-valley-provincial-park/r/campsiteDetails.do?siteId=41738&amp;contractCode=ABPP&amp;parkId=330258&amp;arvdate=5/9/2026&amp;lengthOfStay=1' class='avail'>A</a></div>
  <div class='td status x'>X</div>
</div>`;

const saskatchewanCalendarHtml = `
<div class='br'>
  <div class='td sn'>
    <div class='siteListLabel'><a href='/camping/buffalo-pound-provincial-park/r/campsiteDetails.do?siteId=13383&amp;contractCode=SKPP&amp;parkId=290170' aria-label='Site: Pavilion (13383)'>Pavilion</a></div>
  </div>
  <div class='td loopName' title='Buffalo Pound Provincial Park'>Buffalo Pound Provincial Park</div>
  <div class='td status x'>X</div>
  <div class='td status a'><a href='/camping/buffalo-pound-provincial-park/r/campsiteDetails.do?siteId=13383&amp;contractCode=SKPP&amp;parkId=290170&amp;arvdate=5/15/2026&amp;lengthOfStay=1' class='avail'>A</a></div>
  <div class='td status a'><a href='/camping/buffalo-pound-provincial-park/r/campsiteDetails.do?siteId=13383&amp;contractCode=SKPP&amp;parkId=290170&amp;arvdate=5/16/2026&amp;lengthOfStay=1' class='avail'>A</a></div>
  <div class='td status a'><a href='/camping/buffalo-pound-provincial-park/r/campsiteDetails.do?siteId=13383&amp;contractCode=SKPP&amp;parkId=290170&amp;arvdate=5/17/2026&amp;lengthOfStay=1' class='avail'>A</a></div>
</div>`;

describe("Aspira provider proof registry", () => {
  it("tracks Alberta and Saskatchewan without enabling active worker alerts", () => {
    expect(ASPIRA_PROOF_PLATFORMS).toEqual(["alberta_parks", "saskatchewan_parks"]);
    expect(ASPIRA_PROVIDER_PROFILES.alberta_parks).toMatchObject({
      providerName: "Alberta Parks",
      contractCode: "ABPP",
      baseUrl: "https://shop.albertaparks.ca",
      supportStatus: "search_only",
    });
    expect(ASPIRA_PROVIDER_PROFILES.saskatchewan_parks).toMatchObject({
      providerName: "Saskatchewan Parks",
      contractCode: "SKPP",
      baseUrl: "https://parks.saskatchewan.ca",
      supportStatus: "search_only",
    });
    expect(DOMAINS.alberta_parks).toBeUndefined();
    expect(DOMAINS.saskatchewan_parks).toBeUndefined();
    expect(SUPPORTED_PLATFORMS).not.toContain("alberta_parks");
    expect(SUPPORTED_PLATFORMS).not.toContain("saskatchewan_parks");
  });

  it("builds official directory and calendar URLs", () => {
    const profile = ASPIRA_PROVIDER_PROFILES.alberta_parks;
    const directoryUrl = new URL(buildAspiraDirectoryUrl(profile));
    const calendarUrl = new URL(buildAspiraCalendarUrl(profile, "330258", "2026-05-23"));

    expect(directoryUrl.origin + directoryUrl.pathname).toBe("https://shop.albertaparks.ca/campgroundDirectoryList.do");
    expect(directoryUrl.searchParams.get("contractCode")).toBe("ABPP");
    expect(calendarUrl.origin + calendarUrl.pathname).toBe("https://shop.albertaparks.ca/campsiteCalendar.do");
    expect(calendarUrl.searchParams.get("page")).toBe("matrix");
    expect(calendarUrl.searchParams.get("parkId")).toBe("330258");
    expect(calendarUrl.searchParams.get("calarvdate")).toBe("05/23/2026");
  });
});

describe("parseAspiraDirectory", () => {
  it("normalizes Alberta ABPP campground directory rows", () => {
    const result = parseAspiraDirectory(albertaDirectoryHtml, ASPIRA_PROVIDER_PROFILES.alberta_parks);

    expect(result.total).toBe(109);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]).toMatchObject({
      platform: "alberta_parks",
      parkId: "330258",
      name: "Bow Valley Provincial Park",
      province: "AB",
      bookingUrl: "https://shop.albertaparks.ca/camping/bow-valley-provincial-park/r/campgroundDetails.do?contractCode=ABPP&parkId=330258",
      latitude: 51.0828694,
      longitude: -115.1024778,
    });
  });

  it("normalizes Saskatchewan SKPP rows with the same parser", () => {
    const result = parseAspiraDirectory(
      saskatchewanDirectoryHtml,
      ASPIRA_PROVIDER_PROFILES.saskatchewan_parks,
    );

    expect(result.total).toBe(24);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      platform: "saskatchewan_parks",
      parkId: "290170",
      name: "Buffalo Pound Provincial Park",
      province: "SK",
      bookingUrl: "https://parks.saskatchewan.ca/camping/buffalo-pound-provincial-park/r/facilityDetails.do?contractCode=SKPP&parkId=290170",
      latitude: 50.5852778,
      longitude: -105.4227972,
    });
  });
});

describe("parseAspiraCalendar", () => {
  it("finds Alberta sites available for every requested night", () => {
    const sites = parseAspiraCalendar(albertaCalendarHtml, ASPIRA_PROVIDER_PROFILES.alberta_parks.baseUrl);
    const availableForStay = findAspiraAvailableSitesForStay(
      albertaCalendarHtml,
      ASPIRA_PROVIDER_PROFILES.alberta_parks.baseUrl,
      "2026-05-09",
      "2026-05-11",
    );

    expect(sites[0]).toMatchObject({
      siteId: "41737",
      siteName: "04",
      loopName: "Bow River",
      availableDates: ["2026-05-09", "2026-05-10"],
    });
    expect(availableForStay).toEqual([
      { siteId: "41737", siteName: "04 (Bow River)" },
    ]);
  });

  it("finds Saskatchewan sites using the shared calendar shape", () => {
    const availableForStay = findAspiraAvailableSitesForStay(
      saskatchewanCalendarHtml,
      ASPIRA_PROVIDER_PROFILES.saskatchewan_parks.baseUrl,
      "2026-05-15",
      "2026-05-18",
    );

    expect(availableForStay).toEqual([
      {
        siteId: "13383",
        siteName: "Pavilion (Buffalo Pound Provincial Park)",
      },
    ]);
  });
});
