import Link from 'next/link'

export function TwoProducts() {
  return (
    <section id="pricing" className="pricing-section">
      <h2>Simple pricing. No surprises.</h2>
      <p className="pricing-sub">Start free. Upgrade when you want flexible dates and faster booking tools.</p>

      <div className="pricing-grid">
        <div className="pricing-card">
          <div className="pricing-card-name">Watch &amp; Alert</div>
          <div className="pricing-card-desc">One exact-date watch for one campground.</div>
          <div className="pricing-card-price">Free</div>
          <div className="pricing-card-note">forever</div>
          <ul className="pricing-card-features">
            <li><span className="check">&#10003;</span> 1 active watch</li>
            <li><span className="check">&#10003;</span> 1 park</li>
            <li><span className="check">&#10003;</span> Exact dates only</li>
            <li><span className="check">&#10003;</span> Email alerts</li>
            <li><span className="check">&#10003;</span> No card required</li>
          </ul>
          <Link href="/watch/new" className="pricing-card-btn pricing-card-btn-outline">
            Get Started
          </Link>
        </div>

        <div className="pricing-card pricing-card-popular">
          <span className="pricing-popular-badge">POPULAR</span>
          <div className="pricing-card-name">Book Fast</div>
          <div className="pricing-card-desc">Flexible dates, unlimited watches, and booking tools.</div>
          <div className="pricing-card-price">$6<span className="pricing-card-period">/mo</span></div>
          <div className="pricing-card-note">Best value: $29/year for early users · regularly $39/year</div>
          <ul className="pricing-card-features">
            <li><span className="check">&#10003;</span> Everything in Free</li>
            <li><span className="check">&#10003;</span> Unlimited watches</li>
            <li><span className="check">&#10003;</span> Flexible date windows</li>
            <li><span className="check">&#10003;</span> Up to 30-day search window</li>
            <li><span className="check">&#10003;</span> Required stay length</li>
            <li><span className="check">&#10003;</span> Email alerts</li>
            <li><span className="check">&#10003;</span> Chrome extension &amp; booking tools</li>
          </ul>
          <Link href="/watch/new" className="pricing-card-btn pricing-card-btn-primary">
            Get Started
          </Link>
        </div>
      </div>

      <p className="pricing-fine">Your first watch is free forever. Cancel Pro anytime.</p>
    </section>
  )
}
