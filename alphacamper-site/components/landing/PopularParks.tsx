import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const parks = [
  { id: '-2430', name: 'Alice Lake', province: 'BC' },
  { id: '-2504', name: 'Rathtrevor Beach', province: 'BC' },
  { id: '-2493', name: 'Golden Ears', province: 'BC' },
  { id: '-2740399', name: 'Algonquin', province: 'ON' },
  { id: '232447', name: 'Upper Pines (Yosemite)', province: 'CA' },
  { id: '232493', name: 'Fish Creek (Glacier NP)', province: 'MT' },
  { id: '10171274', name: 'Apgar (Glacier NP)', province: 'MT' },
  { id: '272300', name: 'Jumbo Rocks (Joshua Tree)', province: 'CA' },
]

export function PopularParks() {
  const formatName = (fullName: string) => {
    const match = fullName.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return { name: match[1], bracketText: match[2] };
    }
    return { name: fullName, bracketText: null };
  };

  return (
    <section id="parks" className="parks-section">
      <div className="container">
        <h2 className="section-title-elegant" style={{ color: '#ffffff', textAlign: 'center', marginBottom: '64px' }}>Popular parks we monitor</h2>
        <div className="parks-grid">
          {parks.map((park) => {
            const { name, bracketText } = formatName(park.name);
            return (
              <Link key={park.id} href={`/watch/new?park=${park.id}`} className="park-card">
                <div className="park-card-name">{name}</div>
                {bracketText && <div className="park-card-subname">{bracketText}</div>}
                <div className="park-card-province">{park.province}</div>
                <div className="park-card-arrow">
                  Watch this park <ArrowRight size={14} strokeWidth={2} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle', position: 'relative', top: '-1px' }} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
