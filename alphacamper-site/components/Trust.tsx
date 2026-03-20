import { ScrollReveal } from "./ScrollReveal";

export function Trust() {
  return (
    <section className="trust-section">
      <div className="container">
        <ScrollReveal>
          <div className="eyebrow">Our Promise</div>
          <h2>
            You&apos;re always the one booking.
            <br />
            AI just makes you faster.
          </h2>
          <p className="lead">
            Alphacamper is not a bot. It doesn&apos;t book for you, click for
            you, or pretend to be you. It prepares everything around the booking
            so the booking itself takes you three clicks instead of thirty.
          </p>
          <div className="trust-grid">
            <div className="trust-item">
              <span className="ti" style={{ color: "var(--green)" }}>✓</span> AI fills your form fields
            </div>
            <div className="trust-item">
              <span className="ti" style={{ color: "var(--green)" }}>✓</span> AI sets up your backup options
            </div>
            <div className="trust-item">
              <span className="ti" style={{ color: "var(--green)" }}>✓</span> AI shows you where to click
            </div>
            <div className="trust-item">
              <span className="ti" style={{ color: "var(--green)" }}>✓</span> AI coaches you to be faster
            </div>
            <div className="trust-item">
              <span className="ti" style={{ color: "#dc2626" }}>✕</span> AI never clicks Reserve for you
            </div>
            <div className="trust-item">
              <span className="ti" style={{ color: "#dc2626" }}>✕</span> AI never grabs a site for you
            </div>
            <div className="trust-item">
              <span className="ti" style={{ color: "#dc2626" }}>✕</span> AI never bypasses security
            </div>
            <div className="trust-item">
              <span className="ti" style={{ color: "#dc2626" }}>✕</span> AI never pretends to be you
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
