import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { WatchCTA } from "@/components/content/WatchCTA";

export function useMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    h1: () => null,
    h2: ({ children }) => <h2 className="content-heading">{children}</h2>,
    h3: ({ children }) => <h3 className="content-subheading">{children}</h3>,
    h4: ({ children }) => <h4 className="content-miniheading">{children}</h4>,
    p: ({ children }) => <p className="content-paragraph">{children}</p>,
    ul: ({ children }) => <ul className="content-list">{children}</ul>,
    ol: ({ children }) => <ol className="content-list content-list-numbered">{children}</ol>,
    li: ({ children }) => <li className="content-list-item">{children}</li>,
    blockquote: ({ children }) => <blockquote className="content-blockquote">{children}</blockquote>,
    table: ({ children }) => (
      <div className="content-table-wrap">
        <table className="content-table">{children}</table>
      </div>
    ),
    th: ({ children }) => <th>{children}</th>,
    td: ({ children }) => <td>{children}</td>,
    hr: () => <hr className="content-divider" />,
    a: ({ href = "#", children }) => {
      const isExternal = href.startsWith("http");

      if (isExternal) {
        return (
          <a className="content-link" href={href} rel="noreferrer" target="_blank">
            {children}
          </a>
        );
      }

      return (
        <Link className="content-link" href={href}>
          {children}
        </Link>
      );
    },
    WatchCTA,
    ...components,
  };
}
