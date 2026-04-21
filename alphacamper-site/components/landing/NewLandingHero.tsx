import Link from 'next/link'
import { PopularParks } from '@/components/landing/PopularParks'

export function NewLandingHero() {
  return (
    <>
      <section style={{ padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.6rem, 8vw, 5rem)', lineHeight: 0.95, marginBottom: '20px' }}>
            We get you the campsite.
          </h1>
          <Link
            href="/checkout?product=summer"
            className="btn-bold btn-bold-primary"
            style={{ display: 'inline-flex', textDecoration: 'none' }}
          >
            Get Summer Pass
          </Link>
        </div>
      </section>
      <PopularParks />
    </>
  )
}
