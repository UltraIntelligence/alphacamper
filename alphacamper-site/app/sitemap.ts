import type { MetadataRoute } from "next";
import { PARK_PAGE_DEFINITIONS } from "@/lib/content";
import { buildCanonicalUrl } from "@/lib/content-meta";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: buildCanonicalUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: buildCanonicalUrl("/watch/new"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: buildCanonicalUrl("/parks"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: buildCanonicalUrl("/campnab-alternative"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: buildCanonicalUrl("/campflare-alternative"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const parkRoutes: MetadataRoute.Sitemap = PARK_PAGE_DEFINITIONS.map((park) => ({
    url: buildCanonicalUrl(`/parks/${park.slug}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...parkRoutes];
}
