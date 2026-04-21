import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { ContentLayout } from "@/components/content/ContentLayout";
import {
  readComparisonFrontmatter,
  readComparisonSource,
  type ComparisonFrontmatter,
} from "@/lib/content";
import { buildContentMetadata } from "@/lib/content-meta";
import { useMDXComponents } from "@/mdx-components";

const slug = "campflare";

export const metadata: Metadata = (() => {
  const frontmatter = readComparisonFrontmatter(slug);

  if (!frontmatter) {
    return {};
  }

  return buildContentMetadata({
    title: frontmatter.title,
    description: frontmatter.description,
    pathname: "/campflare-alternative",
  });
})();

export default async function CampflareAlternativePage() {
  const source = readComparisonSource(slug);
  const frontmatter = readComparisonFrontmatter(slug);

  if (!source || !frontmatter) {
    return null;
  }

  const { content } = await compileMDX<ComparisonFrontmatter>({
    source,
    components: useMDXComponents(),
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return (
    <ContentLayout
      title={frontmatter.title}
      subtitle="Comparison guide"
      intro={
        <p>
          This page is for customers deciding whether free or alert-first products are enough, or
          whether the booking speed problem is the part they still need solved.
        </p>
      }
    >
      {content}
    </ContentLayout>
  );
}
