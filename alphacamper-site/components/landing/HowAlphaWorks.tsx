const steps = [
  {
    number: '01',
    title: 'Pick your dream park.',
    body: 'Tell us where you want to go and when. It takes two seconds to set up, and we scan all the big parks in the US and Canada.',
  },
  {
    number: '02',
    title: 'We do the waiting for you.',
    body: 'Life gets busy. While you work or watch the kids, our system constantly checks for cancellations 24/7 so you don\'t have to.',
  },
  {
    number: '03',
    title: 'Book it in seconds.',
    body: 'When a spot opens up, we alert you right away. Our smart browser extension even fills out the checkout forms for you, giving you the fastest way to book.',
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
