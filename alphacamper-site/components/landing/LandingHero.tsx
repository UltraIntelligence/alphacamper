'use client'

import { useRef, useEffect } from 'react'
import { ParkSearch } from './ParkSearch'
import { LandingNav } from './LandingNav'

interface HeroMarker {
  id: string
  name: string
  lng: number
  lat: number
  available: boolean
}

const MOCK_MARKERS: HeroMarker[] = [
  { id: '1', name: 'Alice Lake Provincial Park', lng: -123.1098, lat: 49.7611, available: true },
  { id: '2', name: 'Garibaldi Lake Camp', lng: -122.9912, lat: 49.9327, available: true },
  { id: '3', name: 'Brandywine Falls Camp', lng: -123.1204, lat: 50.0442, available: false },
  { id: '4', name: 'Squamish Valley Camp', lng: -123.2300, lat: 49.7800, available: true },
  { id: '5', name: 'Cheakamus Lake Camp', lng: -123.0100, lat: 50.0050, available: false },
  { id: '6', name: 'Porteau Cove Park', lng: -123.2367, lat: 49.5542, available: true },
]

const SQUAMISH: [number, number] = [-123.1558, 49.7016]

export function LandingHero() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const key = process.env.NEXT_PUBLIC_MAPTILER_KEY
    const styleUrl = `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${key}`

    let map: import('maplibre-gl').Map
    let gpsTimer: ReturnType<typeof setTimeout> | undefined

    async function init() {
      const maplibregl = (await import('maplibre-gl')).default
      await import('maplibre-gl/dist/maplibre-gl.css')

      map = new maplibregl.Map({
        container: mapRef.current!,
        style: styleUrl,
        center: SQUAMISH,
        zoom: 9,
      })

      map.on('load', () => {
        // Hide all place/city label layers
        for (const layer of map.getStyle().layers ?? []) {
          if (layer.type === 'symbol') {
            map.setLayoutProperty(layer.id, 'visibility', 'none')
          }
        }

        // Add mock campground markers
        for (const marker of MOCK_MARKERS) {
          const el = document.createElement('div')
          el.style.cssText = [
            'width:14px',
            'height:14px',
            'border-radius:50%',
            `background:${marker.available ? '#2F847C' : '#888888'}`,
            'border:2px solid rgba(255,255,255,0.8)',
            'box-shadow:0 1px 4px rgba(0,0,0,0.4)',
            'cursor:pointer',
          ].join(';')

          const popup = new maplibregl.Popup({ offset: 10, closeButton: false })
            .setText(marker.name)

          new maplibregl.Marker({ element: el })
            .setLngLat([marker.lng, marker.lat])
            .setPopup(popup)
            .addTo(map)
        }

        // IP geolocation fly-in (ipapi.co supports HTTPS on free tier)
        fetch('https://ipapi.co/json/')
          .then(r => r.json())
          .then((data: { latitude?: number; longitude?: number; error?: boolean }) => {
            if (!data.error && data.latitude != null && data.longitude != null) {
              map.flyTo({ center: [data.longitude, data.latitude], zoom: 9, duration: 2000 })

              // GPS upgrade after IP fly-in settles
              gpsTimer = setTimeout(() => {
                navigator.geolocation?.getCurrentPosition(
                  pos => {
                    map.flyTo({
                      center: [pos.coords.longitude, pos.coords.latitude],
                      zoom: 10,
                      duration: 1500,
                    })
                  },
                  () => { /* denied or unavailable — stay on IP result */ }
                )
              }, 2500)
            }
          })
          .catch(() => { /* stay on Squamish */ })
      })
    }

    init()

    return () => {
      clearTimeout(gpsTimer)
      map?.remove()
    }
  }, [])

  return (
    <section className="hero-section hero-cinematic-mode">
      <div className="hero-overlay-vignette" />
      <div
        ref={mapRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      />
      <LandingNav />
      <div className="hero-content cinematic-content" style={{ position: 'relative', zIndex: 10 }}>
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
