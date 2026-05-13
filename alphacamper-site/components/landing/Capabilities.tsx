const caps = [
  { value: 'Coverage Map', label: 'Search Canadian and US park systems' },
  { value: 'Direct Links', label: 'Go to official booking pages' },
  { value: 'Checkout Assist', label: 'Extension helps fill forms in your browser' },
  { value: 'Honest Labels', label: 'See what is alert-ready or still verifying' },
]

export function Capabilities() {
  return (
    <section className="cap-section-cinematic">
      <div className="container">
        <div className="cap-hero-wrap">
          <div className="cap-big-number">24/7</div>
          <p className="cap-hero-description">
            Start with the park you actually want. Alphacamper keeps the coverage status clear, captures demand for missing parks, and prepares you to move fast when alerts are live.
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
