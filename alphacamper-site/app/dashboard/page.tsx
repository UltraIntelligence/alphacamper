import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const metadata = {
  title: 'Dashboard — Alphacamper',
  description: 'Your campsite watches and alerts.',
}

export default function DashboardPage() {
  return (
    <main className="wizard-container" style={{ background: 'var(--gray-bg)', minHeight: '100vh', maxWidth: '100%', padding: 0 }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
        <DashboardShell />
      </div>
    </main>
  )
}
