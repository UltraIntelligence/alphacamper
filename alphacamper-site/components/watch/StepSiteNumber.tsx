'use client'

import type { WatchData } from './WatchWizard'

interface StepSiteNumberProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

export function StepSiteNumber({ data, onUpdate, onComplete }: StepSiteNumberProps) {
  const trimmed = data.siteNumber.trim()
  const hasExactSite = trimmed.length > 0

  return (
    <div className="step-pane">
      <h2 className="step-question">
        Any site — <em>or the one</em>?
      </h2>
      <p className="step-lede">
        If you have a specific site number you want (because it&apos;s been your
        family&apos;s spot for fifteen years), tell us. Otherwise we watch every
        site for your dates.
      </p>

      <div className="step-site-choice" role="radiogroup" aria-label="Site preference">
        <button
          type="button"
          role="radio"
          aria-checked={!hasExactSite}
          className="step-site-tile"
          data-active={!hasExactSite ? 'true' : undefined}
          onClick={() => onUpdate({ siteNumber: '' })}
        >
          <span className="step-site-tile-kicker">DEFAULT</span>
          <span className="step-site-tile-title">Any site</span>
          <span className="step-site-tile-body">
            Best odds. Alerts fire the moment anything opens for your dates.
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={hasExactSite}
          className="step-site-tile"
          data-active={hasExactSite ? 'true' : undefined}
          onClick={() => {
            const input = document.getElementById('site-number') as HTMLInputElement | null
            input?.focus()
          }}
        >
          <span className="step-site-tile-kicker">SPECIFIC</span>
          <span className="step-site-tile-title">The one</span>
          <span className="step-site-tile-body">
            Only notify me if this exact site opens.
          </span>
        </button>
      </div>

      <div className="step-site-input-group" data-active={hasExactSite ? 'true' : undefined}>
        <label className="step-field-label" htmlFor="site-number">
          Specific site number
        </label>
        <div className="step-site-input-wrap">
          <span className="step-site-input-hash" aria-hidden="true">#</span>
          <input
            id="site-number"
            className="step-site-input"
            type="text"
            placeholder="47, A12, B-203"
            value={data.siteNumber}
            onChange={(e) => onUpdate({ siteNumber: e.target.value })}
            autoCapitalize="characters"
            spellCheck={false}
          />
        </div>
        <p className="step-site-hint">
          {hasExactSite
            ? `Alpha will only alert you if site ${trimmed} opens up.`
            : `Leave this blank and Alpha will alert you for any matching opening at ${data.campgroundName || 'this park'}.`}
        </p>
      </div>

      <div className="step-actions">
        <button type="button" className="step-cta" onClick={onComplete}>
          {hasExactSite ? 'Save site preference' : 'Continue'}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}
