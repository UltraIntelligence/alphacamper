import { Countdown } from "./Countdown";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-badge">
        <span className="dot" /> Now building for Recreation.gov &amp; BC Parks
      </div>

      <h1>
        Get the campsite
        <br />
        <em>everyone else missed.</em>
      </h1>

      <p className="hero-sub">
        When the booking window opens, Alphacamper fills your forms, stages your
        backup options, and guides you through. You just click three times.
      </p>

      <div className="hero-actions">
        <a href="#waitlist" className="btn-primary">
          Get Early Access
        </a>
        <a href="#how" className="btn-outline">
          See How It Works
        </a>
      </div>

      <Countdown />
    </section>
  );
}
