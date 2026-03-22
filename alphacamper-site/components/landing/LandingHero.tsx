'use client'

import { useRef, useEffect } from 'react'
import { ParkSearch } from './ParkSearch'
import { LandingNav } from './LandingNav'
import { PARK_LOCATIONS_GEOJSON } from '@/lib/park-locations'

const SQUAMISH: [number, number] = [-123.1558, 49.7016]

// Symbol layer IDs containing these keywords are text/place labels — hide them.
// POI icon layers (campsite, amenity, etc.) don't match and stay visible.
const LABEL_KEYWORDS = ['place', 'label', 'country', 'state', 'city', 'town', 'village', 'capital', 'waterway-name', 'water-name', 'road', 'rail', 'peak', 'settlement']

export function LandingHero() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const key = process.env.NEXT_PUBLIC_MAPTILER_KEY
    if (!key) {
      console.warn('NEXT_PUBLIC_MAPTILER_KEY not set — hero map will not render')
      return
    }
    const styleUrl = `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${key}`

    let disposed = false
    const controller = new AbortController()
    let map: import('maplibre-gl').Map | undefined
    let zoomOutTimer: ReturnType<typeof setTimeout> | undefined

    async function init() {
      const maplibregl = (await import('maplibre-gl')).default
      await import('maplibre-gl/dist/maplibre-gl.css')

      if (disposed || !mapRef.current) return

      map = new maplibregl.Map({
        container: mapRef.current,
        style: styleUrl,
        center: SQUAMISH,
        zoom: 10,
      })

      map.on('load', () => {
        if (disposed) return

        // Hide text/place label layers; keep POI icon layers (campsite, amenity, etc.)
        for (const layer of map!.getStyle().layers ?? []) {
          if (layer.type === 'symbol' && LABEL_KEYWORDS.some(kw => layer.id.includes(kw))) {
            map!.setLayoutProperty(layer.id, 'visibility', 'none')
          }
        }

        // Overlay all parks we track as teal dots
        map!.addSource('parks', { type: 'geojson', data: PARK_LOCATIONS_GEOJSON })
        map!.addLayer({
          id: 'parks-dots',
          type: 'circle',
          source: 'parks',
          paint: {
            'circle-radius': 6,
            'circle-color': '#2F847C',
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(255,255,255,0.7)',
          },
        })

        // Slowly ease out to show broad coverage across Canada & the US
        const scheduleZoomOut = (delay = 0) => {
          zoomOutTimer = setTimeout(() => {
            if (disposed) return
            map!.easeTo({ zoom: 5.5, duration: 45000 })
          }, delay)
        }

        // IP geolocation fly-in via server-side proxy (uses Vercel edge geo headers),
        // then zoom out to regional context
        fetch('/api/geo', { signal: controller.signal })
          .then(r => r.json())
          .then((data: { lat?: number; lon?: number }) => {
            if (disposed) return
            if (data.lat !== undefined && data.lon !== undefined) {
              map!.flyTo({ center: [data.lon, data.lat], zoom: 10, duration: 2000 })
              map!.once('moveend', () => scheduleZoomOut())
            } else {
              scheduleZoomOut(1000)
            }
          })
          .catch(() => scheduleZoomOut(1000))

      })
    }

    init()

    return () => {
      disposed = true
      controller.abort()
      clearTimeout(zoomOutTimer)
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
        <div className="hero-pre-title">CAMPSITE ALERTS FOR CANADA &amp; THE US</div>
        <h1 className="hero-title-massive">Never miss a campsite opening.</h1>
        <p className="hero-description-refined">
          We check sold-out parks continually, day and night.<br />
          You get an alert the moment a spot opens up.
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
