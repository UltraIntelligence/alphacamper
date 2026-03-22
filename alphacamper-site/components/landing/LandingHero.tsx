import Image from 'next/image'
import { ParkSearch } from './ParkSearch'
import { LandingNav } from './LandingNav'

export function LandingHero() {
  return (
    <section className="hero-section">
      <Image
        src="/hero-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover', zIndex: 0 }}
      />
      <LandingNav />
      <div className="hero-content">
        <h1>Stop refreshing. Start camping.</h1>
        <p>
          Alphacamper watches sold-out campgrounds 24/7 for cancellations.
          When a spot opens up, you hear about it first.
        </p>
        <ParkSearch />
        <div className="hero-stats">
          <div>
            <span className="hero-stat-value">1,000s of campsites</span>
            <span className="hero-stat-label">Across Canada &amp; the US</span>
          </div>
          <div>
            <span className="hero-stat-value">360 checks/day</span>
            <span className="hero-stat-label">Per campground, every day</span>
          </div>
          <div>
            <span className="hero-stat-value">Free to start</span>
            <span className="hero-stat-label">No card required</span>
          </div>
        </div>
      </div>

      <div className="hero-bottom">
        <p className="park-search-free">Your first watch is free. No card required.</p>
        <div className="hero-trust">
          <span className="hero-stars">★★★★★</span>
          <span>Trusted by campers across Canada</span>
        </div>
      </div>
    </section>
  )
}
