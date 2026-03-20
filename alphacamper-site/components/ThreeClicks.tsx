import { ScrollReveal } from "./ScrollReveal";

export function ThreeClicks() {
  return (
    <section className="what-we-do">
      <div className="container">
        <div className="eyebrow" style={{ color: "var(--green-light)" }}>
          What Alphacamper Does
        </div>
        <h2>
          We do one thing.
          <br />
          We get you the campsite.
        </h2>
        <p className="lead">
          AI handles the forms, the timing, the fallbacks, and the guidance. You
          handle three clicks.
        </p>

        <div className="outcome-grid">
          <ScrollReveal>
            <div className="outcome-card">
              <div className="outcome-num">1</div>
              <h3>Pick your site</h3>
              <p>
                AI shows you what&apos;s available in your order of preference.
                You choose the one you want.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="outcome-card">
              <div className="outcome-num">2</div>
              <h3>Add to cart</h3>
              <p>
                You click the button that holds the site for 15 minutes. This is
                the moment that matters most.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="outcome-card">
              <div className="outcome-num">3</div>
              <h3>Checkout</h3>
              <p>
                Confirm and pay. You just got the campsite that 5,000 other
                people were trying to book.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
