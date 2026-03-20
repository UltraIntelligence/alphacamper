import Link from 'next/link'

const provinces = [
  { name: 'British Columbia', slug: 'bc', count: '120+ campgrounds' },
  { name: 'Ontario', slug: 'on', count: '300+ campgrounds' },
  { name: 'Alberta', slug: 'ab', count: 'Coming soon' },
  { name: 'Quebec', slug: 'qc', count: 'Coming soon' },
  { name: 'Manitoba', slug: 'mb', count: 'Coming soon' },
  { name: 'Saskatchewan', slug: 'sk', count: 'Coming soon' },
]

const usStates = [
  { name: 'California', slug: 'ca', count: 'Recreation.gov' },
  { name: 'Washington', slug: 'wa', count: 'Recreation.gov' },
  { name: 'Oregon', slug: 'or', count: 'Recreation.gov' },
  { name: 'Colorado', slug: 'co', count: 'Recreation.gov' },
  { name: 'Utah', slug: 'ut', count: 'Recreation.gov' },
  { name: 'Montana', slug: 'mt', count: 'Recreation.gov' },
]

export function ParkDirectory() {
  return (
    <section className="directory-section">
      <h2>Find a campsite in your province or state</h2>
      <div className="directory-grid">
        <div>
          <h3>Canada</h3>
          <div className="directory-list">
            {provinces.map((p) => (
              <Link key={p.slug} href={`/watch/new`} className="directory-item">
                <span className="directory-name">Camping in {p.name}</span>
                <span className="directory-count">{p.count}</span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3>United States</h3>
          <div className="directory-list">
            {usStates.map((s) => (
              <Link key={s.slug} href={`/watch/new`} className="directory-item">
                <span className="directory-name">Camping in {s.name}</span>
                <span className="directory-count">{s.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
