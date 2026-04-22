import Link from "next/link";

export interface BookingSuccessProps {
  parkName: string;
  siteNumber?: string | null;
  arrivalDate: string;
  departureDate: string;
  bookedAt?: string;
}

function formatDateRange(arrival: string, departure: string): string {
  const [ay, am, ad] = arrival.split("-").map(Number);
  const [dy, dm, dd] = departure.split("-").map(Number);
  const a = new Date(ay, (am ?? 1) - 1, ad ?? 1);
  const d = new Date(dy, (dm ?? 1) - 1, dd ?? 1);

  const sameMonth = a.getMonth() === d.getMonth() && a.getFullYear() === d.getFullYear();
  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });

  if (sameMonth) {
    return `${monthFmt.format(a)} ${a.getDate()}–${d.getDate()}, ${d.getFullYear()}`;
  }
  return `${monthFmt.format(a)} ${a.getDate()} – ${monthFmt.format(d)} ${d.getDate()}, ${d.getFullYear()}`;
}

function nightCount(arrival: string, departure: string): number {
  const a = new Date(arrival + "T00:00:00");
  const d = new Date(departure + "T00:00:00");
  return Math.max(1, Math.round((d.getTime() - a.getTime()) / 86400000));
}

export function BookingSuccess({
  parkName,
  siteNumber,
  arrivalDate,
  departureDate,
  bookedAt,
}: BookingSuccessProps) {
  const dateRange = formatDateRange(arrivalDate, departureDate);
  const nights = nightCount(arrivalDate, departureDate);
  const bookedDisplay = bookedAt
    ? new Date(bookedAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const shareText = siteNumber
    ? `Just got ${parkName} Site #${siteNumber} for ${dateRange}. Alphacamper autofilled the booking in ten seconds.`
    : `Just got ${parkName} for ${dateRange}. Alphacamper autofilled the booking in ten seconds.`;

  return (
    <main className="booked-shell">
      <div className="booked-confetti" aria-hidden="true">
        <span className="booked-confetti-dot booked-confetti-dot-1" />
        <span className="booked-confetti-dot booked-confetti-dot-2" />
        <span className="booked-confetti-dot booked-confetti-dot-3" />
        <span className="booked-confetti-dot booked-confetti-dot-4" />
        <span className="booked-confetti-dot booked-confetti-dot-5" />
      </div>

      <div className="booked-inner">
        <div className="booked-heading">
          <p className="booked-kicker">
            <span className="booked-kicker-dot" aria-hidden="true" />
            Booking confirmed
          </p>
          <h1 className="booked-headline">
            We got <em>you</em> the site.
          </h1>
        </div>

        <article className="booked-card" aria-label="Your reservation">
          <header className="booked-card-head">
            <p className="booked-card-label">Reservation</p>
            <p className="booked-card-time">{bookedDisplay ? `Booked ${bookedDisplay}` : "Booked"}</p>
          </header>

          <h2 className="booked-card-park">{parkName}</h2>

          {siteNumber ? (
            <div className="booked-card-site">
              <span className="booked-card-site-hash" aria-hidden="true">#</span>
              <span className="booked-card-site-number">{siteNumber}</span>
            </div>
          ) : (
            <div className="booked-card-site booked-card-site-any">
              <span className="booked-card-site-any-label">Your site</span>
            </div>
          )}

          <div className="booked-card-dates">
            <span className="booked-card-dates-range">{dateRange}</span>
            <span className="booked-card-dates-nights">
              {nights} night{nights !== 1 ? "s" : ""}
            </span>
          </div>

          <footer className="booked-card-signature">
            <span className="booked-card-mark">Alphacamper</span>
            <span className="booked-card-tagline">— closed in ten seconds</span>
          </footer>
        </article>

        <div className="booked-actions">
          <Link
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="booked-share-primary"
          >
            Tell a friend
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/dashboard" className="booked-share-secondary">
            Back to your dashboard
          </Link>
        </div>

        <p className="booked-invite">
          Know another family who loses sites? Share Alphacamper. If three of
          them pick up a pass, your summer is on us.
        </p>
      </div>
    </main>
  );
}
