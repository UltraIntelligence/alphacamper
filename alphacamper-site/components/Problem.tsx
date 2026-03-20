import { ScrollReveal } from "./ScrollReveal";

export function Problem() {
  return (
    <section className="problem-section">
      <div className="container">
        <ScrollReveal>
          <div className="eyebrow">The Problem</div>
          <h2>
            Being ready
            <br />
            isn&apos;t enough anymore.
          </h2>
          <p className="lead">
            You already know to log in early and watch the clock. So does
            everyone else. The people who get the site aren&apos;t more ready —
            they&apos;re faster, they don&apos;t hesitate, and they have a plan
            when their first choice disappears.
          </p>
        </ScrollReveal>
        <div>
          <ul className="pain-list">
            <ScrollReveal>
              <li className="pain-item">
                <div className="pain-icon">⏳</div>
                <div>
                  <h4>You&apos;re still typing while others click &ldquo;Reserve&rdquo;</h4>
                  <p>
                    Name, email, phone, vehicle info — every second you spend on
                    the form is a second someone else uses to grab the site.
                  </p>
                </div>
              </li>
            </ScrollReveal>
            <ScrollReveal>
              <li className="pain-item">
                <div className="pain-icon">😶</div>
                <div>
                  <h4>Your first choice is gone. You freeze.</h4>
                  <p>
                    Five seconds of &ldquo;what do I do now?&rdquo; is all it takes. Your
                    backup sites disappear while you&apos;re still deciding.
                  </p>
                </div>
              </li>
            </ScrollReveal>
            <ScrollReveal>
              <li className="pain-item">
                <div className="pain-icon">🔔</div>
                <div>
                  <h4>Alert services just tell you it&apos;s too late</h4>
                  <p>
                    Campnab and Campflare notify you when something opens. By the
                    time you get there, it&apos;s already taken.
                  </p>
                </div>
              </li>
            </ScrollReveal>
            <ScrollReveal>
              <li className="pain-item">
                <div className="pain-icon">💻</div>
                <div>
                  <h4>You&apos;re on the wrong page when it matters</h4>
                  <p>
                    Wrong dates. Session expired. Still navigating. Everyone else
                    is already booking.
                  </p>
                </div>
              </li>
            </ScrollReveal>
          </ul>
        </div>
      </div>
    </section>
  );
}
