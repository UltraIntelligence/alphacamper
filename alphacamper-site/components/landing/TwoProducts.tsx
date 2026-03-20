import Link from 'next/link'

export function TwoProducts() {
  return (
    <section id="pricing" className="pricing-section">
      <h2>Simple pricing. No surprises.</h2>
      <p className="pricing-sub">No contracts. No per-scan fees. Cancel anytime.</p>

      <div className="pricing-grid">
        <div className="pricing-card">
          <div className="pricing-card-name">Watch &amp; Alert</div>
          <div className="pricing-card-desc">Everything you need to get started.</div>
          <div className="pricing-card-price">Free</div>
          <div className="pricing-card-note">forever</div>
          <ul className="pricing-card-features">
            <li><span className="check">&#10003;</span> 1 active watch</li>
            <li><span className="check">&#10003;</span> Email alerts</li>
            <li><span className="check">&#10003;</span> Checks every few minutes</li>
            <li><span className="check">&#10003;</span> No card required</li>
          </ul>
          <Link href="/watch/new" className="pricing-card-btn pricing-card-btn-outline">
            Get Started
          </Link>
        </div>

        <div className="pricing-card pricing-card-popular">
          <span className="pricing-popular-badge">POPULAR</span>
          <div className="pricing-card-name">Book Fast</div>
          <div className="pricing-card-desc">For campers who don&apos;t want to miss a spot.</div>
          <div className="pricing-card-price">$3<span className="pricing-card-period">/mo</span></div>
          <div className="pricing-card-note">or $19/year (save 47%)</div>
          <ul className="pricing-card-features">
            <li><span className="check">&#10003;</span> Everything in Free</li>
            <li><span className="check">&#10003;</span> Unlimited watches</li>
            <li><span className="check">&#10003;</span> Email + push alerts</li>
            <li><span className="check">&#10003;</span> Chrome extension</li>
            <li><span className="check">&#10003;</span> Auto-fill booking forms</li>
            <li><span className="check">&#10003;</span> Practice mode</li>
            <li><span className="check">&#10003;</span> Fallback sites</li>
          </ul>
          <Link href="/watch/new" className="pricing-card-btn pricing-card-btn-primary">
            Get Started
          </Link>
        </div>
      </div>

      <p className="pricing-fine">Cancel anytime. Your first watch is always free.</p>
    </section>
  )
}
