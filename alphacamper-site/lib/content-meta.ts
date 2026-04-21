import type { Metadata } from "next";
import type { ParkPageDefinition } from "@/lib/content";
import { getTrustedOrigin } from "@/lib/site-url";

interface ContentMetadataInput {
  title: string;
  description: string;
  pathname: string;
  imagePath?: string;
}

interface ParkPlaceSchemaInput {
  park: ParkPageDefinition;
  title: string;
  description: string;
}

function getRegionCountry(region: string): "CA" | "US" {
  return region === "California" || region === "Wyoming" ? "US" : "CA";
}

function normalizePathname(pathname: string): string {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function buildCanonicalUrl(pathname: string): string {
  return `${getTrustedOrigin()}${normalizePathname(pathname)}`;
}

export function buildContentMetadata({
  title,
  description,
  pathname,
  imagePath,
}: ContentMetadataInput): Metadata {
  const canonical = buildCanonicalUrl(pathname);

  // TODO: add dedicated OG images for park and comparison pages once assets exist.
  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: imagePath
        ? [
            {
              url: imagePath,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imagePath ? "summary_large_image" : "summary",
      title,
      description,
      images: imagePath ? [imagePath] : undefined,
    },
  };
}

export function buildParkPlaceSchema({
  park,
  title,
  description,
}: ParkPlaceSchemaInput) {
  const pageUrl = buildCanonicalUrl(`/parks/${park.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: park.parkName,
    description,
    url: pageUrl,
    address: {
      "@type": "PostalAddress",
      addressRegion: park.region,
      addressCountry: getRegionCountry(park.region),
    },
    ...(park.officialUrl ? { sameAs: [park.officialUrl] } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
      name: title,
    },
  };
}
