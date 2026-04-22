import { WatchWizard } from '@/components/watch/WatchWizard'

export const metadata = {
  title: 'Create a Watch — Alphacamper',
  description:
    "Tell us the park, dates, and site. We'll scan 24/7 and text you the second it opens.",
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
    <main className="watch-new-shell">
      <WatchWizard
        initialParkId={params.park}
        initialParkName={params.name}
        initialProvince={params.province}
        initialQuery={params.q}
        initialPlatform={params.platform}
      />
    </main>
  )
}
