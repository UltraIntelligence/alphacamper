'use client'

import { useState } from 'react'
import { validateEmail } from '@/lib/auth'
import type { WatchData } from './WatchWizard'

interface StepEmailProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onSubmit: () => Promise<void>
  isSubmitting: boolean
  error: string | null
}

export function StepEmail({ data, onUpdate, onSubmit, isSubmitting, error }: StepEmailProps) {
  const [touched, setTouched] = useState(false)
  const isValid = validateEmail(data.email)

  return (
    <div>
      <div className="field-group">
        <label className="field-label" htmlFor="email">
          Where should we send alerts?
        </label>
        <span className="field-hint">
          We'll email you when a site opens up. We'll also create your free account.
        </span>
        <input
          id="email"
          className={`field-input ${touched && !isValid && data.email ? 'field-input-error' : ''}`}
          type="email"
          placeholder="you@example.com"
          value={data.email}
          onChange={(e) => onUpdate({ email: e.target.value })}
          onBlur={() => setTouched(true)}
        />
        {touched && !isValid && data.email && (
          <p style={{ color: '#cc3333', fontSize: '0.85rem', marginTop: '4px' }}>
            Please enter a valid email address.
          </p>
        )}
      </div>

      {error && <p className="error-banner">{error}</p>}

      <button
        type="button"
        className="btn-bold btn-bold-primary btn-bold-full"
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? 'Setting up your watch...' : 'Start watching'}
      </button>

      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '12px' }}>
        Free for your first watch. No credit card required.
      </p>
    </div>
  )
}
