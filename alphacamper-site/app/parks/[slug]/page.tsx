import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { ContentLayout } from "@/components/content/ContentLayout";
import {
  findParkPageDefinition,
  getParkSlugsFromFilesystem,
  readParkFrontmatter,
  readParkSource,
  type ParkFrontmatter,
} from "@/lib/content";
import { buildContentMetadata, buildParkPlaceSchema } from "@/lib/content-meta";
import { useMDXComponents } from "@/mdx-components";

interface ParkPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getParkSlugsFromFilesystem().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ParkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const park = findParkPageDefinition(slug);
  const frontmatter = readParkFrontmatter(slug);

  if (!park || !frontmatter) {
    return {};
  }

  return buildContentMetadata({
    title: frontmatter.title,
    description: frontmatter.description,
    pathname: `/parks/${slug}`,
  });
}

export default async function ParkPage({ params }: ParkPageProps) {
  const { slug } = await params;
  const park = findParkPageDefinition(slug);
  const source = readParkSource(slug);

  if (!park || !source) {
    notFound();
  }

  const { content, frontmatter } = await compileMDX<ParkFrontmatter>({
    source,
    components: useMDXComponents(),
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  const placeSchema = buildParkPlaceSchema({
    park,
    title: frontmatter.title,
    description: frontmatter.description,
  });

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
        type="application/ld+json"
      />
      <ContentLayout
        title={frontmatter.title}
        eyebrow={`Field guide · ${park.region}`}
        subtitle={park.bookingSystem}
        intro={<p>{park.blurb}</p>}
      >
        {content}
      </ContentLayout>
    </>
  );
}
