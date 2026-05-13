const steps = [
  {
    number: '01',
    title: 'Pick your dream park.',
    body: 'Tell us where you want to go and when. We show whether that park is alert-ready now or still being verified.',
  },
  {
    number: '02',
    title: 'We keep the watch organized.',
    body: 'Your watch gives us the exact park, dates, and site details so alerts can start cleanly as each provider goes live.',
  },
  {
    number: '03',
    title: 'Book it in seconds.',
    body: 'When alerts are live, the browser extension helps fill the official booking form so you can move fast without retyping everything.',
  },
]

export function HowAlphaWorks() {
  return (
    <section id="how-it-works" className="how-section-cinematic">
      <div className="container">
        <div className="how-header-cinematic">
          <span className="section-eyebrow">HOW IT WORKS</span>
          <h2 className="section-title-premium">From stressful to simple.</h2>
        </div>
        
        <div className="how-vertical-timeline">
          {steps.map((step) => (
            <div key={step.number} className="timeline-item-premium">
              <div className="timeline-marker">
                <span className="timeline-number">{step.number}</span>
              </div>
              <div className="timeline-content-premium">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
