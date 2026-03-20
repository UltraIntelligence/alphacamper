const caps = [
  { value: 'Every 2\u20135 min', label: 'Scan frequency' },
  { value: '3 platforms', label: 'BC Parks, Ontario Parks, Recreation.gov' },
  { value: 'Booking Assist\u2122', label: 'Chrome extension autofills in seconds' },
  { value: '24/7/365', label: 'Alpha never sleeps' },
]

export function Capabilities() {
  return (
    <section className="landing-section section-navy">
      <div className="container">
        <div className="cap-grid">
          {caps.map((cap) => (
            <div key={cap.value}>
              <div className="cap-value">{cap.value}</div>
              <div className="cap-label">{cap.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
