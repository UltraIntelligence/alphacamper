import { LandingNav } from '@/components/landing/LandingNav'
import { LandingHero } from '@/components/landing/LandingHero'
import { HowAlphaWorks } from '@/components/landing/HowAlphaWorks'
import { Reviews } from '@/components/landing/Reviews'
import { PressLogos } from '@/components/landing/PressLogos'
import { Capabilities } from '@/components/landing/Capabilities'
import { TwoProducts } from '@/components/landing/TwoProducts'
import { WhyAlphacamper } from '@/components/landing/WhyAlphacamper'
import { PopularParks } from '@/components/landing/PopularParks'
import { ParkDirectory } from '@/components/landing/ParkDirectory'
import { FAQ } from '@/components/landing/FAQ'
import { LandingCTA } from '@/components/landing/LandingCTA'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function Home() {
  return (
    <>
      <LandingNav />
      <LandingHero />

      {/* Tagline */}
      <section className="tagline-section">
        <p>
          Campsites at popular parks sell out in seconds. Cancellations happen
          all season long. Alphacamper makes sure you hear about them first.
        </p>
      </section>

      <HowAlphaWorks />
      <Reviews />
      <PressLogos />
      <Capabilities />
      <TwoProducts />
      <WhyAlphacamper />
      <PopularParks />
      <ParkDirectory />
      <FAQ />
      <LandingCTA />
      <LandingFooter />
    </>
  )
}
