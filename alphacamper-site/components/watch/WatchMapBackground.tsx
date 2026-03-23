'use client'

import { useRef, useEffect } from 'react'
import { PARK_LOCATIONS } from '@/lib/park-locations'

// The symbol layer IDs to hide
const LABEL_KEYWORDS = ['place', 'label', 'country', 'state', 'city', 'town', 'village', 'capital', 'waterway-name', 'water-name', 'road', 'rail', 'peak', 'settlement']

export function WatchMapBackground({
  campgroundName,
  platform,
  isComplete
}: {
  campgroundName?: string
  platform?: string
  isComplete?: boolean
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const key = process.env.NEXT_PUBLIC_MAPTILER_KEY
    if (!key) return

    const styleUrl = `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${key}`

    let disposed = false

    async function init() {
      const maplibregl = (await import('maplibre-gl')).default
      await import('maplibre-gl/dist/maplibre-gl.css')

      if (disposed || !mapRef.current) return
      
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: styleUrl,
        center: [-123.237, 49.554],
        zoom: 11,
        interactive: false,
        attributionControl: false
      })
      mapInstance.current = map

      map.on('load', () => {
        if (disposed) return

        // Hide text/place labels
        for (const layer of map.getStyle().layers ?? []) {
          if (layer.type === 'symbol' && LABEL_KEYWORDS.some(kw => layer.id.includes(kw))) {
            map.setLayoutProperty(layer.id, 'visibility', 'none')
          }
        }

        // Add pins for all parks
        map.addSource('parks', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: PARK_LOCATIONS
          }
        })

        map.addLayer({
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
      })
    }

    init()

    return () => {
      disposed = true
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstance.current || !campgroundName) return

    // Find the feature
    const feature = PARK_LOCATIONS.find(f => 
       f.properties.name === campgroundName || 
       f.properties.name.includes(campgroundName) || 
       campgroundName.includes(f.properties.name)
    )

    if (feature) {
      const [lng, lat] = feature.geometry.coordinates
      
      if (isComplete) {
        mapInstance.current.flyTo({
          center: [lng, lat],
          zoom: 16.5,
          pitch: 55,
          bearing: -15,
          speed: 0.3, // Ultra slow, luxurious final swoop
          curve: 1.2, // Flatter flight arc
          essential: true,
          easing: (t: number) => t * t * (3 - 2 * t) // Smooth step (ease-in-out)
        })
      } else {
        mapInstance.current.flyTo({
          center: [lng, lat],
          zoom: 13,
          pitch: 0,
          bearing: 0,
          speed: 0.6, // Relaxed panning speed
          curve: 1.4, // Standard flight arc
          essential: true,
          easing: (t: number) => t * t * (3 - 2 * t)
        })
      }
    }
  }, [campgroundName, platform, isComplete])

  return (
    <div className="fixed inset-0 w-full h-full z-[-1]" style={{ pointerEvents: 'none', background: '#000' }}>
      <div 
        ref={mapRef}
        className="absolute inset-0 w-full h-full z-0"
      />
      <div 
        className="absolute inset-0 z-10" 
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.6) 100%), linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.75) 100%)'
        }} 
      />
    </div>
  )
}
