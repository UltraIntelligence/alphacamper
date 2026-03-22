const caps = [
  { value: 'Lightning Fast', label: 'We spot openings in seconds' },
  { value: 'Direct Links', label: 'Goes straight to official booking pages' },
  { value: 'Auto-Fill Magic', label: 'Our extension types for you at checkout' },
  { value: 'Always Awake', label: 'Checking parks 24/7, never sleeps' },
]

export function Capabilities() {
  return (
    <section className="cap-section-cinematic">
      <div className="container">
        <div className="cap-hero-wrap">
          <div className="cap-big-number">24/7</div>
          <p className="cap-hero-description">
            We are always watching out for you. The second another camper cancels their trip, you'll be the first to know—giving you the best chance to grab it.
          </p>
        </div>
        
        <div className="cap-grid-premium">
          {caps.map((cap) => (
            <div key={cap.value} className="cap-item-premium">
              <div className="cap-value">{cap.value}</div>
              <div className="cap-label">{cap.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
