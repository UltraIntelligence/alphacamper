import type { ReactNode } from "react";

interface ContentLayoutProps {
  title: string;
  /** Small uppercase label above the title. Defaults to "Alphacamper field guide". */
  eyebrow?: string;
  subtitle?: string;
  intro?: ReactNode;
  children: ReactNode;
  cta?: ReactNode;
  relatedLinks?: ReactNode;
}

export function ContentLayout({
  title,
  eyebrow = "Alphacamper field guide",
  subtitle,
  intro,
  children,
  cta,
  relatedLinks,
}: ContentLayoutProps) {
  return (
    <main className="content-shell">
      <div className="content-hero">
        <div className="content-hero-inner">
          <p className="content-eyebrow">{eyebrow}</p>
          <h1 className="content-title">{title}</h1>
          {subtitle ? <p className="content-subtitle">{subtitle}</p> : null}
          {intro ? <div className="content-intro">{intro}</div> : null}
        </div>
      </div>

      <div className="content-body-shell">
        <article className="content-article">{children}</article>
        {cta ? <aside className="content-cta-slot">{cta}</aside> : null}
        {relatedLinks ? <aside className="content-related-slot">{relatedLinks}</aside> : null}
      </div>
    </main>
  );
}
