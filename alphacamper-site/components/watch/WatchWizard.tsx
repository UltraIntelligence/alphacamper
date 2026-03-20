'use client'

import { useState, useCallback } from 'react'
import { StepSummary } from './StepSummary'
import { StepSearch } from './StepSearch'

export type WizardStep = 'search' | 'dates' | 'site' | 'email'

export interface WatchData {
  campgroundId: string
  campgroundName: string
  platform: 'bc_parks' | 'ontario_parks' | ''
  province: string
  arrivalDate: string
  departureDate: string
  nights: number
  siteNumber: string
  email: string
}

const INITIAL_DATA: WatchData = {
  campgroundId: '',
  campgroundName: '',
  platform: '',
  province: '',
  arrivalDate: '',
  departureDate: '',
  nights: 1,
  siteNumber: '',
  email: '',
}

const STEPS: { key: WizardStep; number: number; title: string }[] = [
  { key: 'search', number: 1, title: 'Find your campground' },
  { key: 'dates', number: 2, title: 'Pick your dates' },
  { key: 'site', number: 3, title: 'Preferred site (optional)' },
  { key: 'email', number: 4, title: 'Get notified' },
]

function getStepSummary(step: WizardStep, data: WatchData): string | null {
  switch (step) {
    case 'search':
      if (!data.campgroundName) return null
      return `${data.campgroundName} — ${data.platform === 'bc_parks' ? 'BC Parks' : 'Ontario Parks'}`
    case 'dates':
      if (!data.arrivalDate || !data.departureDate) return null
      return `${data.arrivalDate} → ${data.departureDate} (${data.nights} night${data.nights !== 1 ? 's' : ''})`
    case 'site':
      return data.siteNumber ? `Site #${data.siteNumber}` : 'Any available site'
    case 'email':
      return data.email || null
    default:
      return null
  }
}

export function WatchWizard() {
  const [activeStep, setActiveStep] = useState<WizardStep>('search')
  const [data, setData] = useState<WatchData>(INITIAL_DATA)
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const updateData = useCallback((partial: Partial<WatchData>) => {
    setData((prev) => ({ ...prev, ...partial }))
  }, [])

  const completeStep = useCallback((step: WizardStep, nextStep: WizardStep) => {
    setCompletedSteps((prev) => new Set([...prev, step]))
    setActiveStep(nextStep)
  }, [])

  const handleCreateWatch = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const registerRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      if (!registerRes.ok) throw new Error('Failed to create account')
      const { user } = await registerRes.json()

      const watchRes = await fetch('/api/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          platform: data.platform,
          campgroundId: data.campgroundId,
          campgroundName: data.campgroundName,
          siteNumber: data.siteNumber || null,
          arrivalDate: data.arrivalDate,
          departureDate: data.departureDate,
        }),
      })
      if (!watchRes.ok) throw new Error('Failed to create watch')

      import('@/lib/auth').then(({ sendMagicLink }) => {
        sendMagicLink(data.email).catch(() => {})
      })

      setIsComplete(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1.75rem', marginBottom: '12px' }}>
          Alpha's on it!
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Watch created — confirmation component coming in Task 9.</p>
      </div>
    )
  }

  return (
    <div>
      {STEPS.map(({ key, number, title }) => {
        const isActive = activeStep === key
        const isCompleted = completedSteps.has(key)
        const summary = getStepSummary(key, data)

        return (
          <div key={key} className="step-card" data-state={isActive ? 'open' : 'closed'}>
            <div
              className="step-card-header"
              onClick={() => {
                if (isCompleted || isActive) setActiveStep(key)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (isCompleted || isActive) setActiveStep(key)
                }
              }}
            >
              <div className="step-number" data-completed={isCompleted ? 'true' : 'false'}>
                {isCompleted ? '✓' : number}
              </div>
              <div>
                <div className="step-title">{title}</div>
                {!isActive && summary && <StepSummary text={summary} />}
              </div>
            </div>
            {isActive && (
              <div className="step-content">
                {key === 'search' && (
                  <StepSearch
                    data={data}
                    onUpdate={updateData}
                    onComplete={() => completeStep('search', 'dates')}
                  />
                )}
                {key === 'dates' && <p style={{ color: 'var(--color-text-muted)' }}>Step 2 — coming next</p>}
                {key === 'site' && <p style={{ color: 'var(--color-text-muted)' }}>Step 3 — coming next</p>}
                {key === 'email' && <p style={{ color: 'var(--color-text-muted)' }}>Step 4 — coming next</p>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
