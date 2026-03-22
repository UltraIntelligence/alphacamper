'use client'

import { useState } from 'react'

const faqs = [
  {
    q: 'What is Alphacamper?',
    a: 'Alphacamper monitors sold-out campgrounds for cancellations and alerts you the moment a spot opens up. Our Chrome extension also helps you book faster with auto-fill and practice mode.',
  },
  {
    q: 'How does it work?',
    a: 'Tell us which park and dates you want. We check the reservation website every few minutes, around the clock. When someone cancels, you get an instant alert with a direct link to book. Pro users can search flexible date windows — just set your earliest date, latest date, and minimum stay length.',
  },
  {
    q: 'Do you book campsites for me?',
    a: 'No. We alert you and help you book faster, but you always book directly through the park\'s official website. We never book on your behalf.',
  },
  {
    q: 'How much does it cost?',
    a: 'Free lets you track one exact stay at one campground — no credit card required. Pro is $6/month, or $29/year for early users (regularly $39/year), and includes unlimited watches, flexible date windows, and the Chrome extension.',
  },
  {
    q: 'What parks do you monitor?',
    a: 'We currently monitor BC Parks, Ontario Parks, Parks Canada, and Recreation.gov campgrounds. We\'re adding more parks regularly.',
  },
  {
    q: 'How fast are the alerts?',
    a: 'We scan reservation sites every 2 to 5 minutes. When a cancellation appears, you\'ll get an alert within minutes.',
  },
  {
    q: 'What\'s the Chrome extension?',
    a: 'Our extension auto-fills booking forms in seconds, lets you practice the booking flow before the real thing, and sets up fallback sites in case your first choice gets taken.',
  },
  {
    q: 'Is it really free?',
    a: 'Yes. One active exact-date watch with email alerts is free forever — no credit card, no trial period, no catch. Upgrade to Pro for flexible date windows up to 30 days and unlimited watches.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="faq-section">
      <h2>Questions? Answers.</h2>
      <div className="faq-list">
        {faqs.map((faq, i) => (
          <div key={i} className="faq-item">
            <button
              className="faq-question"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
            >
              {faq.q}
              <span className="faq-chevron" data-open={openIndex === i}>&#9662;</span>
            </button>
            {openIndex === i && (
              <div className="faq-answer">{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
