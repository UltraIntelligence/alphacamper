import type { Metadata } from "next";
import Link from "next/link";
import { ContentLayout } from "@/components/content/ContentLayout";
import { PARK_PAGE_DEFINITIONS } from "@/lib/content";
import { buildContentMetadata } from "@/lib/content-meta";

export const metadata: Metadata = buildContentMetadata({
  title: "Popular campground guides for tough-to-book parks",
  description:
    "Park-by-park booking guides for the campgrounds families keep missing on release day and through cancellation season.",
  pathname: "/parks",
});

export default function ParksIndexPage() {
  return (
    <ContentLayout
      title="Popular parks where booking speed matters"
      subtitle="10 park guides built around real booking pressure, not generic camping tips."
      intro={
        <p>
          These pages are for the trips where your customer already knows the park. The real problem
          is getting through the booking form before somebody else does.
        </p>
      }
    >
      <div className="park-index-grid">
        {PARK_PAGE_DEFINITIONS.map((park) => (
          <Link key={park.slug} className="park-index-card" href={`/parks/${park.slug}`}>
            <p className="park-index-region">{park.region}</p>
            <h2>{park.parkName}</h2>
            <p>{park.blurb}</p>
            <span>Read the guide</span>
          </Link>
        ))}
      </div>
    </ContentLayout>
  );
}
