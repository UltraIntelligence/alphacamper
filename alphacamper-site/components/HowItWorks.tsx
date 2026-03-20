import { ScrollReveal } from "./ScrollReveal";

const steps = [
  {
    dot: "1", when: "A few days before", title: "Tell us where you want to go",
    desc: 'Pick a park, choose your dates, or just describe what you want — "lakeside, 3 nights, power hookup, within 4 hours of Vancouver." AI finds the best targets, checks when booking opens, and picks smart backup options in case your top pick is gone.',
    badges: [{ label: "AI picks targets", type: "ai" }, { label: "AI finds backups", type: "ai" }],
  },
  {
    dot: "2", when: "The night before", title: "Do one practice run",
    desc: "Walk through a fake booking that looks just like the real site. Fill in your name, phone, vehicle info — all of it. Alphacamper saves everything you type and learns your preferences. It also times you and shows you where you were slow.",
    badges: [{ label: "AI builds your profile", type: "ai" }, { label: "AI coaches speed", type: "ai" }, { label: "You practice", type: "you" }],
  },
  {
    dot: "3", when: "10–15 minutes before", title: "Everything is set up for you",
    desc: "AI gets you logged in early — an active session looks human to the booking site and won't get dropped when traffic spikes. It opens your target pages, loads your saved details, and counts down to the exact second. You see a dashboard showing every target and its status. All you do is wait.",
    badges: [{ label: "AI stages tabs", type: "ai" }, { label: "AI checks login", type: "ai" }, { label: "AI syncs clock", type: "ai" }],
  },
  {
    dot: "4", when: "The booking window opens", title: 'Hit "Go" — AI fills everything instantly',
    desc: "One click. Every tab goes to the live page. Every form fills with your saved details. AI highlights which sites are still available. A guide shows you exactly where to click. You pick the site, add to cart, and check out. Three clicks. Done.",
    badges: [{ label: "AI fills forms", type: "ai" }, { label: "AI guides clicks", type: "ai" }, { label: "You click 3 times", type: "you" }],
  },
  {
    dot: "5", when: "If your first choice is gone", title: "Press spacebar. Next option. Instantly.",
    desc: "Your backup is already loaded in the next tab with all your details filled in. One keypress and you're ready to book your second choice. Then your third. No panic. No starting over. Just keep going.",
    badges: [{ label: "AI pre-fills backup", type: "ai" }, { label: "You press spacebar", type: "you" }],
  },
  {
    dot: "∞", when: "Always running", title: "We also watch for cancellations",
    desc: "Between booking windows, Alphacamper keeps scanning your target parks. When someone cancels, we don't just send you an alert — we open the page with your details already filled in so you can grab it in seconds.",
    badges: [{ label: "AI scans 24/7", type: "ai" }, { label: "AI pre-fills on alert", type: "ai" }, { label: "You click 3 times", type: "you" }],
  },
];

export function HowItWorks() {
  return (
    <section className="how-section" id="how">
      <div className="container">
        <ScrollReveal>
          <div className="eyebrow">How It Works</div>
        </ScrollReveal>
        <ScrollReveal>
          <h2>
            From &ldquo;I want to camp&rdquo;
            <br />
            to &ldquo;I&apos;m going camping.&rdquo;
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <p className="lead">
            Six steps. Most of them happen before booking day. By the time the
            window opens, you&apos;re already in position.
          </p>
        </ScrollReveal>

        <div className="steps">
          {steps.map((step) => (
            <ScrollReveal key={step.dot}>
              <div className="step">
                <div className="step-dot">{step.dot}</div>
                <div>
                  <div className="step-when">{step.when}</div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                  <div className="step-badges">
                    {step.badges.map((b) => (
                      <span key={b.label} className={`badge ${b.type}`}>
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
