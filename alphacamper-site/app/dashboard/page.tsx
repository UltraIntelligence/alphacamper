import Link from 'next/link'

export const metadata = {
  title: 'Dashboard — Alphacamper',
  description: 'Your campsite watches and alerts.',
}

export default function DashboardPage() {
  return (
    <main className="wizard-container">
      <div className="wizard-header">
        <h1>Your Dashboard</h1>
        <p>Alpha's watching your campsites. We'll email you when something opens up.</p>
      </div>

      <div className="illustration-placeholder" style={{ marginBottom: '32px', maxWidth: '280px', marginInline: 'auto' }}>
        Alpha sleeping with one eye open — watching your campsites
      </div>

      <div className="confirm-card" style={{ textAlign: 'center', padding: '32px' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
          Your active watches will appear here. Full dashboard coming soon.
        </p>
        <Link href="/watch/new" className="btn-bold btn-bold-primary" style={{ textDecoration: 'none' }}>
          Create a watch
        </Link>
      </div>
    </main>
  )
}
