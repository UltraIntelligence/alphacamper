'use client'

import type { WatchData } from './WatchWizard'

interface StepSiteNumberProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

import { CarFront, Tent, CheckCircle2, Zap, Waves, Check, Map } from 'lucide-react'

// ... (keep props interface unchanged) ...

export function StepSiteNumber({ data, onUpdate, onComplete }: StepSiteNumberProps) {
  const toggleAmenity = (amenity: string) => {
    const newAmenities = data.amenities.includes(amenity)
      ? data.amenities.filter(a => a !== amenity)
      : [...data.amenities, amenity]
    onUpdate({ amenities: newAmenities })
  }

  const toggleLoop = (loop: string) => {
    const newLoops = data.loops.includes(loop)
      ? data.loops.filter(b => b !== loop)
      : [...data.loops, loop]
    onUpdate({ loops: newLoops })
  }

  const activeFiltersCount = (data.siteType !== 'any' ? 1 : 0) + data.amenities.length + data.loops.length
  const continueText = activeFiltersCount === 0 ? 'Continue (Watch all sites)' : 'Save Preferences'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Site Type */}
      <div className="field-group">
        <label className="field-label">What are you camping in?</label>
        <span className="field-hint">Tell us your setup to filter out incompatible sites.</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <button 
            type="button"
            className="selectable-item"
            data-selected={data.siteType === 'rv'}
            onClick={() => onUpdate({ siteType: 'rv' })}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', textAlign: 'center' }}
          >
            <CarFront size={28} style={{ color: data.siteType === 'rv' ? 'var(--paradiso)' : 'var(--color-text-muted)' }} />
            <span style={{ fontWeight: 600 }}>RV / Trailer</span>
          </button>
          <button 
            type="button"
            className="selectable-item"
            data-selected={data.siteType === 'tent'}
            onClick={() => onUpdate({ siteType: 'tent' })}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', textAlign: 'center' }}
          >
            <Tent size={28} style={{ color: data.siteType === 'tent' ? 'var(--paradiso)' : 'var(--color-text-muted)' }} />
            <span style={{ fontWeight: 600 }}>Tent</span>
          </button>
          <button 
            type="button"
            className="selectable-item"
            data-selected={data.siteType === 'any'}
            onClick={() => onUpdate({ siteType: 'any' })}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', textAlign: 'center', position: 'relative' }}
          >
            {data.siteType === 'any' && <div style={{ position: 'absolute', top: 8, right: 8, color: 'var(--paradiso)' }}><CheckCircle2 size={18} fill="currentColor" stroke="#fff" /></div>}
            <Map size={28} style={{ color: data.siteType === 'any' ? 'var(--paradiso)' : 'var(--color-text-muted)' }} />
            <span style={{ fontWeight: 700, color: data.siteType === 'any' ? 'var(--paradiso)' : 'var(--color-text)' }}>Any</span>
            {data.siteType === 'any' && (
              <span className="field-hint" style={{ fontSize: '0.75rem', color: 'var(--paradiso)', margin: 0, lineHeight: 1, position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>Highest success</span>
            )}
          </button>
        </div>
      </div>

      {/* Amenities */}
      <div className="field-group">
        <label className="field-label">Required Amenities</label>
        <span className="field-hint">Only show sites that have these features (optional).</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            type="button"
            className="selectable-item"
            data-selected={data.amenities.includes('power')}
            onClick={() => toggleAmenity('power')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '8px 16px' }}
          >
             <Zap size={16} color={data.amenities.includes('power') ? '#f59e0b' : 'var(--color-text-muted)'} />
             <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Power Hookup</span>
          </button>
          <button 
            type="button"
            className="selectable-item"
            data-selected={data.amenities.includes('waterfront')}
            onClick={() => toggleAmenity('waterfront')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '8px 16px' }}
          >
             <Waves size={16} color={data.amenities.includes('waterfront') ? '#3b82f6' : 'var(--color-text-muted)'} />
             <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Waterfront</span>
          </button>
        </div>
      </div>

      {/* Loop Selector */}
      <div className="field-group">
        <label className="field-label">Specific Loops or Areas</label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="field-hint" style={{ margin: 0 }}>Filter by specific campground zones (optional).</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--paradiso)', background: 'rgba(47, 132, 124, 0.1)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {data.campgroundName || 'Park'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: 'var(--border-thin) solid var(--color-border)', overflow: 'hidden' }}>
          {[{name: 'Oceanfront Sites', sites: 14, id: 'ocean'}, {name: 'Walk-in Tents', sites: 8, id: 'walkin'}, {name: 'Drive-in Double', sites: 4, id: 'double'}].map((loop, idx) => (
            <button 
              key={loop.id}
              type="button"
              onClick={() => toggleLoop(loop.id)}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', 
                background: data.loops.includes(loop.id) ? 'rgba(47, 132, 124, 0.05)' : 'var(--color-surface)',
                border: 'none', borderTop: idx > 0 ? 'var(--border-thin) solid var(--color-border)' : 'none',
                cursor: 'pointer', textAlign: 'left', width: '100%'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <span style={{ fontWeight: data.loops.includes(loop.id) ? 700 : 600, fontSize: '1rem', color: data.loops.includes(loop.id) ? 'var(--paradiso)' : 'var(--color-text)' }}>{loop.name}</span>
                <span className="field-hint" style={{ margin: 0, color: data.loops.includes(loop.id) ? 'rgba(47, 132, 124, 0.6)' : 'var(--color-text-muted)' }}>{loop.sites} sites</span>
              </div>
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '4px', flexShrink: 0,
                border: data.loops.includes(loop.id) ? 'none' : '2px solid var(--color-border)', 
                background: data.loops.includes(loop.id) ? 'var(--paradiso)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {data.loops.includes(loop.id) && <Check size={16} color="#fff" strokeWidth={3} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button type="button" className="btn-bold btn-bold-primary" style={{ width: '100%' }} onClick={onComplete}>
          {continueText}
        </button>
      </div>
    </div>
  )
}
