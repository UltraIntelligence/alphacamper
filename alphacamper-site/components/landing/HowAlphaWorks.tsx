import { IllustrationPlaceholder } from './IllustrationPlaceholder'

const steps = [
  {
    number: 1,
    title: 'Tell Alpha where you want to camp',
    body: 'Pick your park, dates, and preferred sites. Alpha starts watching immediately.',
    illustration: 'Alpha pointing at a map pinned to a tree, tongue out, excited expression',
  },
  {
    number: 2,
    title: 'Alpha watches around the clock',
    body: 'We check every few minutes, 24/7. When someone cancels, you\'ll know first.',
    illustration: 'Alpha in sleeping bag, one eye open, laptop on belly, coffee mug nearby',
  },
  {
    number: 3,
    title: 'You book it before anyone else',
    body: 'Get an instant alert with a direct link. Our Chrome extension fills your forms in seconds.',
    illustration: 'Alpha celebrating with arms up, confetti, human hand tapping phone screen',
  },
]

export function HowAlphaWorks() {
  return (
    <section id="how-it-works" className="landing-section section-white">
      <div className="container">
        <h2 className="landing-heading" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', marginBottom: 48, textAlign: 'center' }}>
          How Alpha Works
        </h2>
        <div className="how-grid">
          {steps.map((step) => (
            <div key={step.number} className="bold-card how-card">
              <div className="how-card-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <IllustrationPlaceholder description={step.illustration} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
