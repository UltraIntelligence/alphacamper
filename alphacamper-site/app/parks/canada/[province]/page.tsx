import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentLayout } from "@/components/content/ContentLayout";
import {
  findParksCanadaProvincePageDefinition,
  PARKS_CANADA_PROVINCE_PAGES,
} from "@/lib/content";
import { buildContentMetadata } from "@/lib/content-meta";

interface ParksCanadaProvincePageProps {
  params: Promise<{
    province: string;
  }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return PARKS_CANADA_PROVINCE_PAGES.map((province) => ({
    province: province.slug,
  }));
}

export async function generateMetadata({
  params,
}: ParksCanadaProvincePageProps): Promise<Metadata> {
  const { province } = await params;
  const definition = findParksCanadaProvincePageDefinition(province);

  if (!definition) {
    return {};
  }

  return buildContentMetadata({
    title: `Parks Canada camping in ${definition.provinceName}`,
    description: definition.description,
    pathname: `/parks/canada/${definition.slug}`,
  });
}

export default async function ParksCanadaProvincePage({
  params,
}: ParksCanadaProvincePageProps) {
  const { province } = await params;
  const definition = findParksCanadaProvincePageDefinition(province);

  if (!definition) {
    notFound();
  }

  const searchHref = `/watch/new?q=${encodeURIComponent(definition.provinceName)}`;

  return (
    <ContentLayout
      title={`Parks Canada camping in ${definition.provinceName}`}
      eyebrow={`Parks Canada coverage / ${definition.provinceCode}`}
      subtitle={`${definition.rowCount} province-matched Parks Canada rows`}
      intro={
        <p>
          Alphacamper now understands {definition.provinceName} as a Parks Canada search,
          so campers can start from the province instead of already knowing each exact
          campground name.
        </p>
      }
      cta={
        <Link className="watch-cta" href={searchHref}>
          <p className="watch-cta-kicker">Search this province</p>
          <span className="watch-cta-button">Open {definition.provinceName} campground search</span>
          <p className="watch-cta-note">
            Results use live catalog support labels, so search-only or unsupported rows are not
            treated like live alert coverage.
          </p>
        </Link>
      }
    >
      <p className="content-paragraph">
        This page is about customer discovery. It makes Parks Canada coverage easier to find
        by province, while the product still keeps campground support labels separate from
        notification delivery.
      </p>

      <h2 className="content-heading">What is covered</h2>
      <p className="content-paragraph">
        The live catalog currently has {definition.rowCount} Parks Canada rows tagged to{" "}
        {definition.provinceCode}. Searches for {definition.provinceName} can now return
        those rows directly.
      </p>

      <h2 className="content-heading">Example matches</h2>
      <ul className="content-list">
        {definition.examples.map((example) => (
          <li className="content-list-item" key={example}>
            <strong>{example}</strong> appears as a Parks Canada match with support status in
            campground search.
          </li>
        ))}
      </ul>

      <h2 className="content-heading">How to use it</h2>
      <ol className="content-list content-list-numbered">
        <li className="content-list-item">
          Search by province first when the camper is flexible on the exact park.
        </li>
        <li className="content-list-item">
          Open the campground result and check whether alerts are live for that row.
        </li>
        <li className="content-list-item">
          Create a watch for supported campgrounds and keep backup options nearby.
        </li>
      </ol>

      <h2 className="content-heading">What this is not</h2>
      <p className="content-paragraph">
        Province coverage is not a blanket claim that every campsite in the province can be
        alerted on. It is a cleaner way to find the Parks Canada rows Alphacamper knows about,
        with support status shown before a camper creates a watch.
      </p>
    </ContentLayout>
  );
}
