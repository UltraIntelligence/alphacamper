const caps = [
  { value: 'Every 2\u20135 min', label: 'Scan frequency' },
  { value: '4 platforms', label: 'BC Parks \u00b7 Ontario Parks \u00b7 Parks Canada \u00b7 Recreation.gov' },
  { value: 'Booking Assist\u2122', label: 'Auto-fill forms in seconds' },
  { value: '24/7/365', label: 'Alphacamper never sleeps' },
]

export function Capabilities() {
  return (
    <section className="cap-section">
      <div className="cap-big-number">24/7</div>
      <p className="cap-big-label">
        Alphacamper watches campgrounds around the clock so you don&apos;t have to.
      </p>
      <div className="cap-grid">
        {caps.map((cap) => (
          <div key={cap.value}>
            <div className="cap-value">{cap.value}</div>
            <div className="cap-label">{cap.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
