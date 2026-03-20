import { ParkSearch } from './ParkSearch'
import { IllustrationPlaceholder } from './IllustrationPlaceholder'

export function LandingCTA() {
  return (
    <section className="landing-section section-green cta-section">
      <div className="container" style={{ textAlign: 'center' }}>
        <h2 className="landing-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 24 }}>
          Start watching a campsite
        </h2>
        <ParkSearch />
        <p className="cta-sub">
          Your first watch is free. Alphacamper&apos;s already awake.
        </p>
        <div style={{ marginTop: 40, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
          <IllustrationPlaceholder
            description="Alpha giving thumbs up with both paws, huge grin, backpack on, sunrise behind mountains"
            dark
          />
        </div>
      </div>
    </section>
  )
}
