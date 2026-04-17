'use client'

import { MapPinned, TentTree } from 'lucide-react'
import type { WatchData } from './WatchWizard'

interface StepSiteNumberProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

export function StepSiteNumber({ data, onUpdate, onComplete }: StepSiteNumberProps) {
  const hasExactSite = data.siteNumber.trim().length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          border: 'var(--border-thin) solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)',
          padding: '20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '999px',
            background: 'rgba(47, 132, 124, 0.08)',
            color: 'var(--paradiso)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <TentTree size={22} />
        </div>
        <div>
          <div className="field-label" style={{ marginBottom: '6px' }}>
            Watch any site for the best odds
          </div>
          <p className="field-hint" style={{ margin: 0 }}>
            Leave this blank and Alpha will alert you for any matching opening at {data.campgroundName}.
          </p>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="site-number">
          Specific site number
        </label>
        <span className="field-hint">
          Optional. Only enter this if you want one exact site, like `23` or `A12`.
        </span>
        <div style={{ position: 'relative' }}>
          <input
            id="site-number"
            className="field-input"
            type="text"
            placeholder="Leave blank to watch any site"
            value={data.siteNumber}
            onChange={(e) => onUpdate({ siteNumber: e.target.value })}
            autoCapitalize="characters"
            spellCheck={false}
            style={{ paddingLeft: '48px' }}
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <MapPinned size={18} />
          </span>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <button type="button" className="btn-bold btn-bold-primary" style={{ width: '100%' }} onClick={onComplete}>
          {hasExactSite ? 'Save site preference' : 'Continue'}
        </button>
        <p className="field-hint" style={{ margin: 0, textAlign: 'center' }}>
          {hasExactSite
            ? `Alpha will only alert you if site ${data.siteNumber.trim()} opens up.`
            : 'You will get alerted for any site that opens for these dates.'}
        </p>
      </div>
    </div>
  )
}
