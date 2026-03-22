import { ParkSearch } from './ParkSearch'

export function LandingCTA() {
  return (
    <section className="landing-section section-green cta-section">
      <div className="container" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '420px' }}>
        <h2 className="landing-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 24 }}>
          Start watching a campsite
        </h2>
        <ParkSearch />
        <p className="cta-sub">
          Your first watch is free. Alphacamper&apos;s already awake.
        </p>
      </div>
    </section>
  )
}
