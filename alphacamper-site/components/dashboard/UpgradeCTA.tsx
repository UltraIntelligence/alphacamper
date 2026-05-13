import Link from 'next/link'

export function UpgradeCTA() {
  return (
    <aside className="upgrade-card">
      <p className="upgrade-card-kicker">Early access</p>
      <h3 className="upgrade-card-title">Start with a free watch.</h3>
      <p className="upgrade-card-body">
        Tell Alphacamper the park, dates, and site you want. We will keep the
        coverage status honest while paid passes and live alert proof come online.
      </p>
      <div className="upgrade-card-price-row">
        <span className="upgrade-card-price">
          <span className="upgrade-card-price-value">$29</span>
          <span className="upgrade-card-price-unit">planned summer</span>
        </span>
        <span className="upgrade-card-price-or">or</span>
        <span className="upgrade-card-price">
          <span className="upgrade-card-price-value">$49</span>
          <span className="upgrade-card-price-unit">planned year</span>
        </span>
      </div>
      <Link href="/watch/new" className="upgrade-card-cta">
        Set up free watch
        <span aria-hidden="true">→</span>
      </Link>
      <p className="upgrade-card-refund">
        Paid passes open after checkout is connected.
      </p>
    </aside>
  )
}
