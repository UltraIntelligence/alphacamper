import { WatchWizard } from '@/components/watch/WatchWizard'

export const metadata = {
  title: 'Create a Watch — Alphacamper',
  description: "Tell Alpha where you want to camp. We'll watch 24/7 and alert you when a site opens up.",
}

export default async function WatchNewPage({
  searchParams,
}: {
  searchParams: Promise<{
    park?: string
    q?: string
    name?: string
    province?: string
    platform?: 'bc_parks' | 'ontario_parks' | 'recreation_gov' | 'parks_canada'
  }>
}) {
  const params = await searchParams
  return (
    <main className="wizard-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '60px 24px' }}>
      <div style={{ position: 'relative', zIndex: 10 }}>
        <div className="wizard-header" style={{ marginBottom: '40px' }}>
        <h1 style={{ color: '#ffffff', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>Set up your campsite watch</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>We&apos;ll watch 24/7 and alert you when a site opens.</p>
      </div>
      <WatchWizard
        initialParkId={params.park}
        initialParkName={params.name}
        initialProvince={params.province}
        initialQuery={params.q}
        initialPlatform={params.platform}
      />
      </div>
    </main>
  )
}
