'use client'

import type { WatchData } from './WatchWizard'

interface StepSiteNumberProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

export function StepSiteNumber({ data, onUpdate, onComplete }: StepSiteNumberProps) {
  return (
    <div>
      <div className="field-group">
        <label className="field-label" htmlFor="site-number">
          Want a specific site?
        </label>
        <span className="field-hint">
          Leave blank to watch all sites at this campground. Enter a site number if you have a favourite.
        </span>
        <input
          id="site-number"
          className="field-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="e.g. 42"
          value={data.siteNumber}
          onChange={(e) => onUpdate({ siteNumber: e.target.value })}
          style={{ maxWidth: '200px' }}
        />
      </div>

      <button type="button" className="btn-bold btn-bold-primary btn-bold-full" onClick={onComplete}>
        {data.siteNumber ? 'Continue' : 'Skip — watch all sites'}
      </button>
    </div>
  )
}
