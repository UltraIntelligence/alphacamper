import { ScrollReveal } from "./ScrollReveal";

export function Comparison() {
  return (
    <section className="compare-section" id="compare">
      <div className="container">
        <ScrollReveal>
          <div className="eyebrow">How We&apos;re Different</div>
        </ScrollReveal>
        <ScrollReveal>
          <h2>
            Other tools tell you about it.
            <br />
            We get you through it.
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                <th>Campnab / Campflare</th>
                <th>Doing It Yourself</th>
                <th className="ours">Alphacamper</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Watches for cancellations</td>
                <td><span className="yes">Yes</span></td>
                <td><span className="no">No</span></td>
                <td className="ours"><span className="yes">Yes</span></td>
              </tr>
              <tr>
                <td>Helps on booking day</td>
                <td><span className="no">No</span></td>
                <td><span className="no">No</span></td>
                <td className="ours"><span className="yes">Yes</span></td>
              </tr>
              <tr>
                <td>Fills your forms for you</td>
                <td><span className="no">No</span></td>
                <td><span className="no">No</span></td>
                <td className="ours"><span className="yes">Yes</span></td>
              </tr>
              <tr>
                <td>Backup options ready to go</td>
                <td><span className="no">No</span></td>
                <td><span className="meh">Manually</span></td>
                <td className="ours"><span className="yes">Instant</span></td>
              </tr>
              <tr>
                <td>Practice mode</td>
                <td><span className="no">No</span></td>
                <td><span className="no">No</span></td>
                <td className="ours"><span className="yes">Yes</span></td>
              </tr>
              <tr>
                <td>AI trip planning</td>
                <td><span className="no">No</span></td>
                <td><span className="no">No</span></td>
                <td className="ours"><span className="yes">Yes</span></td>
              </tr>
              <tr>
                <td>You&apos;re always in control</td>
                <td><span className="yes">Yes</span></td>
                <td><span className="yes">Yes</span></td>
                <td className="ours"><span className="yes">Always</span></td>
              </tr>
            </tbody>
          </table>
        </ScrollReveal>
      </div>
    </section>
  );
}
