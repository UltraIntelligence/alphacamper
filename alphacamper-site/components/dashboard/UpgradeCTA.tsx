import Link from 'next/link'

export function UpgradeCTA() {
  return (
    <div className="upgrade-card">
      <div className="illustration-placeholder" style={{ maxWidth: '160px', marginInline: 'auto', marginBottom: '16px', minHeight: '100px', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
        Alpha wearing sunglasses, pointing at a laptop
      </div>
      <h3>Want to book faster?</h3>
      <p>
        Get the Chrome extension — autofill forms, practice booking,
        and grab sites the moment they open.
      </p>
      <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '16px' }}>
        $3.99/mo or $19/yr
      </p>
      <Link
        href="/#pricing"
        className="btn-bold btn-bold-inverse"
        style={{ textDecoration: 'none' }}
      >
        Get the Extension →
      </Link>
    </div>
  )
}
