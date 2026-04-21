import Link from "next/link";

interface WatchCTAProps {
  parkName: string;
}

export function WatchCTA({ parkName }: WatchCTAProps) {
  const href = `/watch/new?park=${encodeURIComponent(parkName)}`;

  return (
    <div className="watch-cta">
      <p className="watch-cta-kicker">Move faster when the site opens up</p>
      <Link className="watch-cta-button" href={href}>
        Watch {parkName} for cancellations - from $29/summer
      </Link>
      <p className="watch-cta-note">
        Alphacamper watches for openings and helps your customer-side booking form get filled fast.
      </p>
    </div>
  );
}
