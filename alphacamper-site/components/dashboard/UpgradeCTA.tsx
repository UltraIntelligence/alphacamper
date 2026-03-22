import Link from 'next/link'

export function UpgradeCTA() {
  return (
    <div className="upgrade-card">
      <div className="illustration-placeholder" style={{ maxWidth: '160px', marginInline: 'auto', marginBottom: '16px', minHeight: '100px', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
        Alpha wearing sunglasses, pointing at a laptop
      </div>
      <h3>Upgrade to Pro</h3>
      <p>
        Watch flexible date windows, run unlimited watches, and book
        faster with the Chrome extension.
      </p>
      <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '16px' }}>
        $6/mo or $29/yr
      </p>
      <Link
        href="/#pricing"
        className="btn-bold btn-bold-inverse"
        style={{ textDecoration: 'none' }}
      >
        See Pro features →
      </Link>
    </div>
  )
}
