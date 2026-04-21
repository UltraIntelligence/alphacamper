declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { MDXComponents } from "mdx/types";

  const MDXContent: ComponentType<{
    components?: MDXComponents;
    [key: string]: unknown;
  }>;

  export default MDXContent;
  export const frontmatter: Record<string, unknown>;
}
