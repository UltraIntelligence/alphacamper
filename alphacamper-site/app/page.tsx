import { LandingNav } from '@/components/landing/LandingNav'
import { LandingHero } from '@/components/landing/LandingHero'
import { HowAlphaWorks } from '@/components/landing/HowAlphaWorks'
import { Capabilities } from '@/components/landing/Capabilities'
import { TwoProducts } from '@/components/landing/TwoProducts'
import { PopularParks } from '@/components/landing/PopularParks'
import { FAQ } from '@/components/landing/FAQ'
import { LandingCTA } from '@/components/landing/LandingCTA'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function Home() {
  return (
    <>
      <LandingNav />
      <LandingHero />
      <HowAlphaWorks />
      <Capabilities />
      <TwoProducts />
      <PopularParks />
      <FAQ />
      <LandingCTA />
      <LandingFooter />
    </>
  )
}
