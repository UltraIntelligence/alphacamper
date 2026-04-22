import Link from "next/link";

const CHROME_WEB_STORE_URL = process.env.NEXT_PUBLIC_CHROME_WEB_STORE_URL?.trim();

const BEATS = [
  {
    time: "+00s",
    title: "Your site opens.",
    body: "Someone cancels. The park's reservation system lists the site for exactly the dates you asked for.",
  },
  {
    time: "+03s",
    title: "We text you.",
    body: "Direct link to the booking page — already on the right site, already on the right dates.",
  },
  {
    time: "+10s",
    title: "You're booked.",
    body: "The extension autofills your party, vehicle, payment, and equipment. You review and confirm. Done.",
  },
] as const;

export function ExtensionStory() {
  return (
    <section className="ext-story" id="how-it-works">
      <div className="ext-story-inner">
        <header className="ext-story-head">
          <p className="ext-story-kicker">
            <span className="ext-story-kicker-dot" aria-hidden="true" />
            How it works
          </p>
          <h2 className="ext-story-title">
            Most people lose the site in <em>the form</em>.
          </h2>
          <p className="ext-story-lede">
            They knew the park. They knew the date. They just typed slower than the next person.
            Our Chrome extension fills the reservation form from the moment your alert fires — so you finish in
            ten seconds, not four minutes.
          </p>
        </header>

        <ol className="ext-story-beats" aria-label="Booking timeline">
          {BEATS.map((beat, idx) => (
            <li key={beat.time} className="ext-story-beat">
              <span className="ext-story-beat-time" aria-hidden="true">
                {beat.time}
              </span>
              <span className="ext-story-beat-index" aria-hidden="true">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <h3 className="ext-story-beat-title">{beat.title}</h3>
              <p className="ext-story-beat-body">{beat.body}</p>
              {idx < BEATS.length - 1 ? (
                <span className="ext-story-beat-connector" aria-hidden="true" />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="ext-story-cta-row">
          {CHROME_WEB_STORE_URL ? (
            <Link
              href={CHROME_WEB_STORE_URL}
              className="ext-story-install"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="ext-story-install-glyph" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 1V8M8 8L14 4.5M8 8L2 4.5M8 8V15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              Install the extension
              <span className="ext-story-install-meta">Chrome</span>
            </Link>
          ) : (
            <div className="ext-story-install ext-story-install-pending" aria-disabled="true">
              <span className="ext-story-install-glyph" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Email me when it&apos;s live
              <span className="ext-story-install-meta">Beta · invite only</span>
            </div>
          )}
          <Link href="/watch/new" className="ext-story-secondary">
            Or set up a free watch first
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <footer className="ext-story-foot">
          <p className="ext-story-legal">
            <strong>Same tech as 1Password, Honey, and Keepa.</strong> The extension fills forms
            in <em>your</em> browser, on <em>your</em> session. We never bypass captchas or
            scrape the reservation sites server-side. This is the line you can walk right up
            to and not cross.
          </p>
        </footer>
      </div>
    </section>
  );
}
