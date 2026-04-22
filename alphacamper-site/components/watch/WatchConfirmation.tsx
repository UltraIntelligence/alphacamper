import Link from 'next/link'

const PLATFORM_LABELS: Record<string, string> = {
  bc_parks: 'BC Parks',
  ontario_parks: 'Ontario Parks',
  recreation_gov: 'Recreation.gov',
  parks_canada: 'Parks Canada',
}

function formatDate(isoDate: string): string {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateRange(arrival: string, departure: string): string {
  if (!arrival || !departure) return ''
  return `${formatDate(arrival)} → ${formatDate(departure)}`
}

function nightsBetween(arrival: string, departure: string): number {
  if (!arrival || !departure) return 0
  const a = new Date(arrival + 'T00:00:00')
  const d = new Date(departure + 'T00:00:00')
  return Math.max(1, Math.round((d.getTime() - a.getTime()) / 86400000))
}

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
  const platformLabel = PLATFORM_LABELS[platform] ?? platform
  const nights = nightsBetween(arrivalDate, departureDate)

  return (
    <div className="watch-confirm">
      <header className="watch-confirm-head">
        <p className="watch-confirm-kicker">
          <span className="watch-confirm-kicker-dot" aria-hidden="true" />
          Watch queued
        </p>
        <h1 className="watch-confirm-title">
          Your watch is set. <em>Check your email.</em>
        </h1>
        <p className="watch-confirm-lede">
          We&apos;ll save it the moment you click the login link we just sent,
          then start scanning around the clock.
        </p>
      </header>

      <section className="watch-confirm-card" aria-label="Your watch">
        <header className="watch-confirm-card-head">
          <p className="watch-confirm-card-label">Watching for you</p>
          <p className="watch-confirm-card-meta">{platformLabel}</p>
        </header>

        <h2 className="watch-confirm-card-park">{campgroundName}</h2>

        <div className="watch-confirm-card-rows">
          <div className="watch-confirm-card-row">
            <span className="watch-confirm-card-row-label">Dates</span>
            <span className="watch-confirm-card-row-value">
              {formatDateRange(arrivalDate, departureDate)}
            </span>
          </div>
          <div className="watch-confirm-card-row">
            <span className="watch-confirm-card-row-label">Nights</span>
            <span className="watch-confirm-card-row-value">{nights}</span>
          </div>
          <div className="watch-confirm-card-row">
            <span className="watch-confirm-card-row-label">Alerts to</span>
            <span className="watch-confirm-card-row-value watch-confirm-card-row-value-email">
              {email}
            </span>
          </div>
        </div>
      </section>

      <section
        className={`watch-confirm-inbox${magicLinkError ? ' watch-confirm-inbox-error' : ''}`}
        aria-labelledby="verify-title"
      >
        <div className="watch-confirm-inbox-head">
          <span className="watch-confirm-inbox-icon" aria-hidden="true">
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <rect x="1" y="1" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M1.5 2.5L9 8L16.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <h3 id="verify-title" className="watch-confirm-inbox-title">Verify your email</h3>
            <p className="watch-confirm-inbox-body">
              Open the link we sent to <strong>{email}</strong> on this device.
              Once you click it, we save your watch and start scanning.
            </p>
          </div>
        </div>

        {magicLinkError && onResend ? (
          <div className="watch-confirm-inbox-error-row" role="alert">
            <span>{magicLinkError}</span>
            <button
              type="button"
              className="watch-confirm-inbox-resend"
              onClick={onResend}
            >
              Resend link
            </button>
          </div>
        ) : null}

        {magicLinkSent && !magicLinkError ? (
          <p className="watch-confirm-inbox-sent">
            <span className="watch-confirm-inbox-sent-dot" aria-hidden="true" />
            Login link sent
          </p>
        ) : null}
      </section>

      <Link href="/" className="watch-confirm-cta">
        Back to home
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
