import Link from 'next/link'

export function TwoProducts() {
  return (
    <section id="pricing" className="landing-section section-gray">
      <div className="container">
        <h2 className="landing-heading" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', marginBottom: 48, textAlign: 'center' }}>
          Two ways to camp smarter
        </h2>
        <div className="products-grid">
          <div className="product-card">
            <div className="product-name">Watch &amp; Alert</div>
            <div className="product-tagline">Know the second a spot opens.</div>
            <div className="product-price">Free</div>
            <div className="product-price-note">forever</div>
            <ul className="product-features">
              <li>1 active watch</li>
              <li>Email alerts</li>
              <li>Checks every few minutes</li>
              <li>No card required</li>
            </ul>
            <Link href="/watch/new" className="product-cta product-cta-outline">
              Start watching — it&apos;s free
            </Link>
          </div>

          <div className="product-card product-card-featured">
            <span className="product-badge">Save 47%</span>
            <div className="product-name">Book Fast</div>
            <div className="product-tagline">Get the site before anyone else.</div>
            <div className="product-price">$3<span style={{ fontSize: '1rem', fontWeight: 400 }}>/mo</span></div>
            <div className="product-price-note">or $19/year</div>
            <ul className="product-features">
              <li>Unlimited watches</li>
              <li>Email + push alerts</li>
              <li>Chrome extension</li>
              <li>Auto-fill booking forms</li>
              <li>Practice mode</li>
              <li>Fallback sites</li>
              <li>Speed coaching</li>
            </ul>
            <Link href="/watch/new" className="product-cta product-cta-primary">
              Go Pro
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
