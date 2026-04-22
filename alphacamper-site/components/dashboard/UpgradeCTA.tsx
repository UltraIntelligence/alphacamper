import Link from 'next/link'

export function UpgradeCTA() {
  return (
    <aside className="upgrade-card">
      <p className="upgrade-card-kicker">Let Alphacamper close the booking</p>
      <h3 className="upgrade-card-title">Ready to let us book for you?</h3>
      <p className="upgrade-card-body">
        Unlimited watches, SMS the second a site opens, and the Chrome extension
        that autofills the booking form in your browser. Finish in ten seconds.
      </p>
      <div className="upgrade-card-price-row">
        <span className="upgrade-card-price">
          <span className="upgrade-card-price-value">$29</span>
          <span className="upgrade-card-price-unit">summer</span>
        </span>
        <span className="upgrade-card-price-or">or</span>
        <span className="upgrade-card-price">
          <span className="upgrade-card-price-value">$49</span>
          <span className="upgrade-card-price-unit">year</span>
        </span>
      </div>
      <Link href="/checkout?product=summer" className="upgrade-card-cta">
        Get Summer Pass
        <span aria-hidden="true">→</span>
      </Link>
      <p className="upgrade-card-refund">
        30-day refund if we don&apos;t book you a site.
      </p>
    </aside>
  )
}
