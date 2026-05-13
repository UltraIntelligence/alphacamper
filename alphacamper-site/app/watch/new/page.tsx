import { WatchWizard } from '@/components/watch/WatchWizard'
import type { CampgroundPlatform } from '@/lib/parks'

export const metadata = {
  title: 'Create a Watch — Alphacamper',
  description:
    "Tell us the park, dates, and site. We'll show whether alerts are live or still being verified.",
}

export default async function WatchNewPage({
  searchParams,
}: {
  searchParams: Promise<{
    park?: string
    q?: string
    name?: string
    province?: string
    platform?: CampgroundPlatform
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
