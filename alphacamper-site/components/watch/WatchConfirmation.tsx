import Link from 'next/link'

export function WatchConfirmation({
  campgroundName,
  platform,
  arrivalDate,
  departureDate,
  email,
}: {
  campgroundName: string
  platform: string
  arrivalDate: string
  departureDate: string
  email: string
}) {
  const platformLabel = platform === 'bc_parks' ? 'BC Parks' : 'Ontario Parks'

  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div
        className="illustration-placeholder"
        style={{ maxWidth: '200px', marginInline: 'auto', marginBottom: '24px', minHeight: '140px' }}
      >
        Alpha celebrating — thumbs up!
      </div>

      <h2 style={{ fontFamily: 'var(--font-inter, var(--font-display))', fontSize: '1.75rem', fontWeight: 600, marginBottom: '12px' }}>
        Alpha&apos;s on it!
      </h2>

      <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', marginBottom: '24px' }}>
        Watching <strong>{campgroundName}</strong> ({platformLabel}) for openings
        from <strong>{arrivalDate}</strong> to <strong>{departureDate}</strong>.
      </p>

      <div className="confirm-card">
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Alerts will go to <strong>{email}</strong>.
          Check your inbox for a link to activate your account.
        </p>
      </div>

      <Link href="/" className="btn-bold btn-bold-outline" style={{ textDecoration: 'none' }}>
        Back to home
      </Link>
    </div>
  )
}
