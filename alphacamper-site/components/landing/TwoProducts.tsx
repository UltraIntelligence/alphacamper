import Link from 'next/link'
import { UpgradeLink, hasStripePaymentLink } from '@/components/billing/UpgradeLink'

export function TwoProducts() {
  const hasPaymentLink = hasStripePaymentLink()

  return (
    <section id="pricing" className="pricing-v2">
      <div className="container">
        <div className="pricing-v2-header">
          <h2>Simple pricing. No surprises.</h2>
          <p>Start free. Upgrade when you want flexible dates and our lightning-fast checkout assistant.</p>
        </div>

        <div className="pricing-v2-grid">
          {/* FREE TIER */}
          <div className="pricing-v2-card">
            <div className="pricing-v2-top">
              <span className="pricing-v2-eyebrow">WATCH & ALERT</span>
              <h3 className="pricing-v2-title">One exact-date watch for one campground.</h3>
              <div className="pricing-v2-price-wrap">
                <span className="pricing-v2-price-main">Free</span>
                <span className="pricing-v2-price-note">forever</span>
              </div>
            </div>

            <ul className="pricing-v2-features">
              <li><span className="v2-check">✔</span> 1 active watch</li>
              <li><span className="v2-check">✔</span> 1 park</li>
              <li><span className="v2-check">✔</span> Exact dates only</li>
              <li><span className="v2-check">✔</span> Email alerts</li>
              <li><span className="v2-check">✔</span> No card required</li>
            </ul>

            <Link href="/watch/new" className="pricing-v2-button-secondary">
              Get Started
            </Link>
          </div>

          {/* PRO TIER */}
          <div className="pricing-v2-card pricing-v2-pro">
            <div className="pricing-v2-popular">POPULAR</div>
            <div className="pricing-v2-top">
              <span className="pricing-v2-eyebrow pro">BOOK FAST</span>
              <h3 className="pricing-v2-title">Flexible dates, unlimited watches, and the checkout assistant.</h3>
              <div className="pricing-v2-price-wrap">
                <span className="pricing-v2-price-main">$6<span className="v2-mo">/mo</span></span>
                <span className="pricing-v2-promo-note">Best value: $29/year for early users · regularly $39/year</span>
              </div>
            </div>

            <ul className="pricing-v2-features pro">
              <li><span className="v2-check pro">✔</span> Everything in Free</li>
              <li><span className="v2-check pro">✔</span> Unlimited watches</li>
              <li><span className="v2-check pro">✔</span> Flexible date windows</li>
              <li><span className="v2-check pro">✔</span> Up to 30-day search window</li>
              <li><span className="v2-check pro">✔</span> Required stay length</li>
              <li><span className="v2-check pro">✔</span> Email alerts</li>
              <li><span className="v2-check pro">✔</span> Alphacamper Browser Extension (Checkout Assist)</li>
            </ul>

            <UpgradeLink
              className="pricing-v2-button-primary"
              fallbackHref="/watch/new"
            >
              {hasPaymentLink ? 'Unlock Pro' : 'Start free for now'}
            </UpgradeLink>
          </div>
        </div>

        <div className="pricing-v2-footer">
          Your first watch is free forever. Cancel Pro anytime.
        </div>
      </div>
    </section>
  )
}
