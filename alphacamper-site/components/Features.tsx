import { ScrollReveal } from "./ScrollReveal";

const features = [
  { emoji: "🧠", title: "AI Trip Planner", desc: "Describe your trip in plain English. AI finds the best parks, dates, and sites — plus backup options you didn't know about." },
  { emoji: "🎯", title: "Practice Mode", desc: "One rehearsal run saves all your booking details and teaches AI exactly what to fill on launch day." },
  { emoji: "⚡", title: "Instant Form Fill", desc: 'Name, phone, email, vehicle, dates, party size — all filled the moment you hit "Go." You never type during the rush.' },
  { emoji: "🔀", title: "Spacebar Fallback", desc: "First choice gone? Press spacebar. Your next option loads instantly with everything already filled in." },
  { emoji: "⏱", title: "Precision Countdown", desc: "Synced to the actual server time, not your device. Most clocks are off by a few seconds. Ours isn't." },
  { emoji: "👆", title: "Click Guide", desc: "A sidebar shows you exactly where to click next on the booking page. No scanning. No guessing. Eyes go straight to the right button." },
  { emoji: "🔔", title: "Cancellation Scanner", desc: "Always watching your target parks. When a spot opens, we don't just tell you — we get you there ready to book." },
  { emoji: "📊", title: "Speed Score", desc: 'After practice: "11.2 seconds. Faster than 96% of users." Know exactly how ready you are before the real thing.' },
  { emoji: "🌲", title: "Hidden Gem Finder", desc: 'AI suggests lesser-known sites with better odds. "Wawona has 4× the availability of Upper Pines this weekend."' },
];

export function Features() {
  return (
    <section className="features-section" id="features">
      <div className="container">
        <ScrollReveal>
          <div className="eyebrow">Features</div>
        </ScrollReveal>
        <ScrollReveal>
          <h2>
            Everything that happens
            <br />
            so you only click three times.
          </h2>
        </ScrollReveal>
        <div className="feat-grid">
          {features.map((f) => (
            <ScrollReveal key={f.title}>
              <div className="feat-card">
                <div className="feat-emoji">{f.emoji}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
