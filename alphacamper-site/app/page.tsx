import { NewLandingHero } from '@/components/landing/NewLandingHero'
import { ExtensionStory } from '@/components/landing/ExtensionStory'
import { PopularParks } from '@/components/landing/PopularParks'

export default function Home() {
  return (
    <>
      <NewLandingHero />
      <ExtensionStory />
      <PopularParks />
    </>
  )
}
