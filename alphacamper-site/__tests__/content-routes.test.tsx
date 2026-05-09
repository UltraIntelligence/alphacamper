// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ParkPage, {
  generateMetadata as generateParkMetadata,
  generateStaticParams,
} from "@/app/parks/[slug]/page";
import ParksCanadaProvincePage, {
  generateMetadata as generateParksCanadaProvinceMetadata,
  generateStaticParams as generateParksCanadaProvinceStaticParams,
} from "@/app/parks/canada/[province]/page";
import ParksIndexPage, { metadata as parksIndexMetadata } from "@/app/parks/page";
import CampnabAlternativePage, {
  metadata as campnabMetadata,
} from "@/app/campnab-alternative/page";
import CampflareAlternativePage, {
  metadata as campflareMetadata,
} from "@/app/campflare-alternative/page";
import sitemap from "@/app/sitemap";
import { PARK_PAGE_DEFINITIONS, PARKS_CANADA_PROVINCE_PAGES } from "@/lib/content";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("content routes", () => {
  it("lists all 10 park pages for static generation", () => {
    const generatedSlugs = generateStaticParams()
      .map((entry) => entry.slug)
      .sort();
    const expectedSlugs = PARK_PAGE_DEFINITIONS.map((park) => park.slug).sort();

    expect(generatedSlugs).toEqual(expectedSlugs);
  });

  it("lists Parks Canada province pages for static generation", () => {
    const generatedSlugs = generateParksCanadaProvinceStaticParams()
      .map((entry) => entry.province)
      .sort();
    const expectedSlugs = PARKS_CANADA_PROVINCE_PAGES.map((province) => province.slug).sort();

    expect(generatedSlugs).toEqual(expectedSlugs);
  });

  it("renders every park page with the correct CTA and Place schema", async () => {
    for (const park of PARK_PAGE_DEFINITIONS) {
      const page = await ParkPage({
        params: Promise.resolve({ slug: park.slug }),
      });
      const html = renderToStaticMarkup(page);

      expect(html).toContain(park.parkName);
      expect(html).toContain(`Watch ${park.parkName} for cancellations - from $29/summer`);
      expect(html).toContain('"@type":"Place"');
      expect(html).toContain(`"name":"${park.parkName}"`);
      expect(html).toContain(`"url":"http://localhost:3000/parks/${park.slug}"`);
    }
  });

  it("renders the parks index and both comparison pages", async () => {
    const parksHtml = renderToStaticMarkup(<ParksIndexPage />);
    const campnabHtml = renderToStaticMarkup(await CampnabAlternativePage());
    const campflareHtml = renderToStaticMarkup(await CampflareAlternativePage());

    expect(parksHtml).toContain("Popular parks where booking speed matters");
    expect(parksHtml).toContain("/parks/algonquin");
    expect(parksHtml).toContain("/parks/canada/alberta");
    expect(campnabHtml).toContain("Campnab deserves respect.");
    expect(campflareHtml).toContain("Campflare is easy to like.");
  });

  it("renders Parks Canada province pages without overclaiming delivery", async () => {
    for (const province of PARKS_CANADA_PROVINCE_PAGES) {
      const page = await ParksCanadaProvincePage({
        params: Promise.resolve({ province: province.slug }),
      });
      const html = renderToStaticMarkup(page);

      expect(html).toContain(`Parks Canada camping in ${province.provinceName}`);
      expect(html).toContain(`${province.rowCount} province-matched Parks Canada rows`);
      expect(html).toContain("support status shown before a camper creates a watch");
      expect(html).toContain(`/watch/new?q=${encodeURIComponent(province.provinceName)}`);
    }
  });

  it("includes the new content pages in the sitemap", () => {
    const entries = sitemap().map((entry) => entry.url);

    expect(entries).toContain("http://localhost:3000/parks");
    expect(entries).toContain("http://localhost:3000/campnab-alternative");
    expect(entries).toContain("http://localhost:3000/campflare-alternative");

    for (const park of PARK_PAGE_DEFINITIONS) {
      expect(entries).toContain(`http://localhost:3000/parks/${park.slug}`);
    }

    for (const province of PARKS_CANADA_PROVINCE_PAGES) {
      expect(entries).toContain(`http://localhost:3000/parks/canada/${province.slug}`);
    }
  });

  it("keeps park page metadata within title and description limits", async () => {
    for (const park of PARK_PAGE_DEFINITIONS) {
      const metadata = await generateParkMetadata({
        params: Promise.resolve({ slug: park.slug }),
      });

      expect((metadata.title as string).length).toBeLessThanOrEqual(60);
      expect((metadata.description as string).length).toBeLessThanOrEqual(155);
      expect(metadata.alternates?.canonical).toBe(`http://localhost:3000/parks/${park.slug}`);
    }
  });

  it("keeps Parks Canada province metadata within title and description limits", async () => {
    for (const province of PARKS_CANADA_PROVINCE_PAGES) {
      const metadata = await generateParksCanadaProvinceMetadata({
        params: Promise.resolve({ province: province.slug }),
      });

      expect((metadata.title as string).length).toBeLessThanOrEqual(60);
      expect((metadata.description as string).length).toBeLessThanOrEqual(155);
      expect(metadata.alternates?.canonical).toBe(
        `http://localhost:3000/parks/canada/${province.slug}`,
      );
    }
  });

  it("keeps the index and comparison metadata within SEO limits", () => {
    const pages = [parksIndexMetadata, campnabMetadata, campflareMetadata];

    for (const metadata of pages) {
      expect((metadata.title as string).length).toBeLessThanOrEqual(60);
      expect((metadata.description as string).length).toBeLessThanOrEqual(155);
      expect(metadata.alternates?.canonical).toBeTruthy();
    }
  });
});
