const benefits = [
  {
    title: 'Substantial park coverage',
    body: 'We monitor thousands of campsites across BC Parks, Ontario Parks, and Recreation.gov. More parks added regularly.',
  },
  {
    title: 'We don\'t just alert — we help you book',
    body: 'Our Chrome extension auto-fills booking forms in seconds, sets up fallback sites, and lets you practice before the real thing.',
  },
  {
    title: '100% focused on campsite availability',
    body: 'We don\'t do gear reviews or trip planning fluff. We do one thing: find you a campsite when everything looks sold out.',
  },
  {
    title: 'Honest, simple pricing',
    body: 'One free watch forever. Pro is $6/month, or $29/year for early users. No surprise fees. Cancel anytime.',
  },
  {
    title: 'Built by campers who get it',
    body: 'We\'re West Vancouverites who kept losing our own campsites. Alphacamper exists because we needed it ourselves.',
  },
  {
    title: 'You always book directly',
    body: 'We never book on your behalf or access your account. You get the alert, you book through the park\'s official site. Full control.',
  },
]

export function WhyAlphacamper() {
  return (
    <section className="why-section">
      <h2>Why campers choose Alphacamper</h2>
      <div className="why-grid">
        {benefits.map((b, i) => (
          <div key={i} className="why-card">
            <h3>{b.title}</h3>
            <p>{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
