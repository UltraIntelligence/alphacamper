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
    <div className="step-pane">
      <h2 className="step-question">
        Where should we <em>reach you</em>?
      </h2>
      <p className="step-lede">
        We&apos;ll email you the moment a matching site opens. Same email becomes
        your login — no password, we send you a one-time link.
      </p>

      <div className="step-field">
        <label className="step-field-label" htmlFor="email">
          Email
        </label>
        <div className="step-email-wrap">
          <span className="step-email-glyph" aria-hidden="true">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="1" y="1" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M1.5 2.5L8 6.5L14.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <input
            id="email"
            className={`step-email-input${touched && !isValid && data.email ? ' step-email-input-error' : ''}`}
            type="email"
            placeholder="you@example.com"
            value={data.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            onBlur={() => setTouched(true)}
            autoComplete="email"
          />
        </div>
        {touched && !isValid && data.email ? (
          <p className="step-field-error">Please enter a valid email address.</p>
        ) : null}
      </div>

      {error ? <p className="step-submit-error" role="alert">{error}</p> : null}

      <button
        type="button"
        className="step-cta step-cta-primary"
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? 'Setting up your watch…' : 'Start watching'}
        <span aria-hidden="true">→</span>
      </button>

      <p className="step-trust">
        Free to set up. No credit card. Pay <strong>$29</strong> only when
        you&apos;re ready to let us book for you.
      </p>
    </div>
  )
}
