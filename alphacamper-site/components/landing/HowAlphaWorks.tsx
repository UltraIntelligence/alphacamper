const steps = [
  {
    number: 1,
    title: 'Tell Alpha where.',
    body: 'Pick your park, dates, and preferred sites. Alpha starts watching immediately.',
  },
  {
    number: 2,
    title: 'Alpha watches.',
    body: 'We check every few minutes, 24/7. When someone cancels, you\'ll know first.',
  },
  {
    number: 3,
    title: 'You book it.',
    body: 'Instant alert + direct link. Our Chrome extension fills your forms in seconds.',
  },
]

export function HowAlphaWorks() {
  return (
    <section id="how-it-works" className="how-section">
      <h2>How Alpha Works</h2>
      <div className="how-grid">
        {steps.map((step) => (
          <div key={step.number} className="how-card">
            <div className="how-card-number">{step.number}</div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
