import Link from "next/link";
import { PARK_PAGE_DEFINITIONS } from "@/lib/content";

export function PopularParks() {
  return (
    <section id="parks" className="parks-section">
      <div className="container">
        <div className="popular-parks-simple">
          <p className="popular-parks-label">Popular parks</p>
          <h2 className="section-title-elegant">Booking guides for the parks people keep missing</h2>
          <div className="popular-park-links">
            {PARK_PAGE_DEFINITIONS.map((park) => (
              <Link key={park.slug} href={`/parks/${park.slug}`}>
                {park.shortName}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
