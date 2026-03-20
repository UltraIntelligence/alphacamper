export function PressLogos() {
  return (
    <section className="press-section">
      <p className="press-label">As seen on</p>
      <div className="press-grid">
        {['CBC', 'Vancouver Sun', 'Global News', 'Daily Hive', 'Reddit'].map((name) => (
          <div key={name} className="press-logo-placeholder">
            {name}
          </div>
        ))}
      </div>
    </section>
  )
}
