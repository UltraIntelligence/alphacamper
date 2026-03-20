import { ParkSearch } from './ParkSearch'
import { IllustrationPlaceholder } from './IllustrationPlaceholder'

export function LandingHero() {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <h1>Never lose a campsite again.</h1>
          <p>
            Alpha watches sold-out campgrounds 24/7. When someone cancels,
            we alert you instantly — and help you book it before anyone else.
          </p>
          <ParkSearch />
          <p className="park-search-free">
            Your first watch is free. No card required.
          </p>
          <div className="hero-trust">
            <span className="hero-stars">★★★★★</span>
            <span>Trusted by frustrated parents, weekend warriors, and last-minute planners everywhere</span>
          </div>
        </div>

        <IllustrationPlaceholder
          description="Alpha sitting in a camping chair with binoculars, staring at laptop. Tent + campfire behind. Night sky with stars."
          dark
          hero
        />
      </div>
    </section>
  )
}
