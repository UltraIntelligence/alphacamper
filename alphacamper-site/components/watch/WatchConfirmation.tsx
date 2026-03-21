import Link from 'next/link'

export function WatchConfirmation({
  campgroundName,
  platform,
  arrivalDate,
  departureDate,
  email,
  magicLinkSent,
  magicLinkError,
  onResend,
}: {
  campgroundName: string
  platform: string
  arrivalDate: string
  departureDate: string
  email: string
  magicLinkSent?: boolean
  magicLinkError?: string | null
  onResend?: () => void
}) {
  const platformLabels: Record<string, string> = { bc_parks: 'BC Parks', ontario_parks: 'Ontario Parks', recreation_gov: 'Recreation.gov', parks_canada: 'Parks Canada' }
  const platformLabel = platformLabels[platform] || platform

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
        We&apos;ll save your watch for <strong>{campgroundName}</strong> ({platformLabel})
        after you confirm your email, then start watching for openings
        from <strong>{arrivalDate}</strong> to <strong>{departureDate}</strong>.
      </p>

      <div className="confirm-card">
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Alerts will go to <strong>{email}</strong>.
          {!magicLinkError && ' Check your inbox for a link to activate your account.'}
        </p>
        {!magicLinkError && (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Open that link on this device to finish saving your watch automatically.
          </p>
        )}
        {magicLinkError && (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-error, #c0392b)', marginTop: '8px' }}>
            {magicLinkError}{' '}
            {onResend && (
              <button onClick={onResend} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}>
                Resend link
              </button>
            )}
          </p>
        )}
        {magicLinkSent && !magicLinkError && (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-success, #27ae60)', marginTop: '8px' }}>
            Login link sent — check your inbox.
          </p>
        )}
      </div>

      <Link href="/" className="btn-bold btn-bold-outline" style={{ textDecoration: 'none' }}>
        Back to home
      </Link>
    </div>
  )
}
