'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { LandingNav } from './LandingNav'
import { PARK_LOCATIONS_GEOJSON } from '@/lib/park-locations'

const SQUAMISH: [number, number] = [-123.1558, 49.7016]

const LABEL_KEYWORDS = [
  'place', 'label', 'country', 'state', 'city', 'town', 'village',
  'capital', 'waterway-name', 'water-name', 'road', 'rail', 'peak', 'settlement',
]

export function NewLandingHero() {
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
        attributionControl: { compact: true },
      })

      map.on('load', () => {
        if (disposed) return

        for (const layer of map!.getStyle().layers ?? []) {
          if (layer.type === 'symbol' && LABEL_KEYWORDS.some((kw) => layer.id.includes(kw))) {
            map!.setLayoutProperty(layer.id, 'visibility', 'none')
          }
        }

        map!.addSource('parks', { type: 'geojson', data: PARK_LOCATIONS_GEOJSON })
        map!.addLayer({
          id: 'parks-dots',
          type: 'circle',
          source: 'parks',
          paint: {
            'circle-radius': 6,
            'circle-color': '#6FAE75',
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(255,255,255,0.75)',
          },
        })

        const scheduleZoomOut = (delay = 0) => {
          zoomOutTimer = setTimeout(() => {
            if (disposed) return
            map!.easeTo({ zoom: 7.5, duration: 45000 })
          }, delay)
        }

        fetch('/api/geo', { signal: controller.signal })
          .then((r) => r.json())
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
    <section className="hero-v2">
        <div
          ref={mapRef}
          className="hero-v2-map"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
        />
        <div className="hero-v2-scrim" aria-hidden="true" />

        <LandingNav />

        <div className="hero-v2-inner">
          <div className="hero-v2-eyebrow">
            <span className="hero-v2-eyebrow-dot" aria-hidden="true" />
            Campsite concierge — booking season 2026
          </div>

          <h1 className="hero-v2-title">
            We get <span className="hero-v2-title-you">you</span> the campsite.
          </h1>

          <p className="hero-v2-lede">
            We watch sold-out parks around the clock. The second your site opens,
            we text you and autofill the booking form in your browser.{' '}
            <span className="hero-v2-lede-emph">You finish in ten seconds.</span>
          </p>

          <div className="hero-v2-demo" role="group" aria-label="Product demo">
            <button
              type="button"
              className="hero-v2-demo-button"
              onClick={() => {
                const el = document.getElementById('demo')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              aria-label="Watch 30-second product demo"
            >
              <span className="hero-v2-demo-playicon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 4.5v11L16 10 6 4.5z" />
                </svg>
              </span>
              <span className="hero-v2-demo-caption">30 seconds · 10-second booking</span>
            </button>
          </div>

          <div className="hero-v2-cta-row">
            <Link href="/checkout?product=summer" className="hero-v2-cta">
              Get Summer Pass
              <span className="hero-v2-cta-price">$29</span>
            </Link>
            <Link href="/watch/new" className="hero-v2-cta-secondary">
              Or set up a free watch first
            </Link>
          </div>

          <p className="hero-v2-trust">
            <strong>30-day refund if we don&apos;t book you a site.</strong>{' '}
            Built for families running annual-ritual trips — Algonquin site #47,
            every August.
          </p>
        </div>

        <div className="hero-v2-rail">
          <div className="hero-v2-rail-inner">
            <div className="hero-v2-rail-item">
              <span className="hero-v2-rail-value">Every 45s</span>
              <span className="hero-v2-rail-label">Scanning your site</span>
            </div>
            <div className="hero-v2-rail-item">
              <span className="hero-v2-rail-value">~10 sec</span>
              <span className="hero-v2-rail-label">SMS to booked</span>
            </div>
            <div className="hero-v2-rail-item">
              <span className="hero-v2-rail-value">4 networks</span>
              <span className="hero-v2-rail-label">BC, Ontario, Parks Canada, US</span>
            </div>
          </div>
        </div>
      </section>
  )
}
