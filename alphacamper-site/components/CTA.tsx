import { ScrollReveal } from "./ScrollReveal";
import { WaitlistForm } from "./WaitlistForm";

export function CTA() {
  return (
    <section className="cta-section" id="waitlist">
      <ScrollReveal>
        <h2>
          Camping season is coming.
          <br />
          <em>Don&apos;t lose your spot again.</em>
        </h2>
      </ScrollReveal>
      <ScrollReveal>
        <p className="lead">
          Join the waitlist. Be the first to try Alphacamper when we launch for
          Recreation.gov and BC Parks.
        </p>
      </ScrollReveal>
      <ScrollReveal>
        <WaitlistForm />
        <p className="cta-fine">No spam. Just launch updates.</p>
      </ScrollReveal>
    </section>
  );
}
