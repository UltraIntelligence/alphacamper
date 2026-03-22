import Image from 'next/image'
import { ParkSearch } from './ParkSearch'
import { LandingNav } from './LandingNav'

export function LandingHero() {
  return (
    <section className="hero-section hero-cinematic-mode">
      <div className="hero-overlay-vignette" />
      <Image
        src="/images/hero-cinematic.png"
        alt="Cinematic Camping Dawn"
        fill
        priority
        unoptimized
        quality={100}
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'center 50%', zIndex: 0 }}
        className="hero-image-zoom"
      />
      <LandingNav />
      <div className="hero-content cinematic-content">
        <div className="hero-pre-title">THE EQUALIZER FOR CAMPERS</div>
        <h1 className="hero-title-massive">Beat the bots. Get the site.</h1>
        <p className="hero-description-refined">
          Campsites shouldn't only go to scalpers or people who can refresh a screen all day. 
          Alphacamper gives your family the exact tools you need to secure a sold-out spot without the stress.
        </p>
        <div className="hero-action-container">
          <ParkSearch />
        </div>
      </div>
        
      <div className="hero-bottom-cinematic">
        <div className="container">
           <div className="hero-specs-row">
             <div className="hero-spec">
               <span className="hero-spec-value">1,000s of campsites</span>
               <span className="hero-spec-label">Across Canada & the US</span>
             </div>
             <div className="hero-spec-divider" />
             <div className="hero-spec">
               <span className="hero-spec-value">360 checks/day</span>
               <span className="hero-spec-label">Per campground, every day</span>
             </div>
             <div className="hero-spec-divider" />
             <div className="hero-spec">
               <span className="hero-spec-value">Free to start</span>
               <span className="hero-spec-label">No card required</span>
             </div>
           </div>

           <div className="hero-social-proof">
             <div className="hero-trusted-row">
               <div className="hero-stars-elegant">★★★★★</div>
               <span>Trusted by campers across Canada</span>
             </div>
           </div>
        </div>
      </div>
    </section>
  )
}
