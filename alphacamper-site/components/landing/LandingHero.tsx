import { ParkSearch } from './ParkSearch'

export function LandingHero() {
  return (
    <section className="hero-section">
      {/* Illustration will wrap around this center content */}
      <div className="hero-content">
        <h1>Never lose a campsite again.</h1>
        <p>
          Alpha watches sold-out campgrounds 24/7 for cancellations.
          When a spot opens up, you hear about it first.
        </p>
        <ParkSearch />
        <p className="park-search-free">
          Your first watch is free. No card required.
        </p>
        <div className="hero-trust">
          <span className="hero-stars">★★★★★</span>
          <span>Trusted by campers across Canada</span>
        </div>
        <div className="hero-stats">
          <div>
            <span className="hero-stat-value">2.4M+</span>
            <span className="hero-stat-label">Checks this month</span>
          </div>
          <div>
            <span className="hero-stat-value">Every 2-5 min</span>
            <span className="hero-stat-label">Scan frequency</span>
          </div>
          <div>
            <span className="hero-stat-value">3 platforms</span>
            <span className="hero-stat-label">BC · Ontario · Rec.gov</span>
          </div>
        </div>
      </div>
    </section>
  )
}
