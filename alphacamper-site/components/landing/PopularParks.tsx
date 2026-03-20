import Link from 'next/link'

const parks = [
  { id: '-2430', name: 'Alice Lake', province: 'BC' },
  { id: '-2504', name: 'Rathtrevor Beach', province: 'BC' },
  { id: '-2493', name: 'Golden Ears', province: 'BC' },
  { id: '-2499', name: 'Joffre Lakes', province: 'BC' },
  { id: '-2740399', name: 'Algonquin', province: 'ON' },
  { id: '-2740523', name: 'Killarney', province: 'ON' },
  { id: '-2740285', name: 'Sandbanks', province: 'ON' },
  { id: '-2740575', name: 'Pinery', province: 'ON' },
]

export function PopularParks() {
  return (
    <section id="parks" className="parks-section">
      <h2>Popular parks we monitor</h2>
      <div className="parks-grid">
        {parks.map((park) => (
          <Link key={park.id} href={`/watch/new?park=${park.id}`} className="park-card">
            <div className="park-card-name">{park.name}</div>
            <div className="park-card-province">{park.province}</div>
            <div className="park-card-arrow">Watch this park &rarr;</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
