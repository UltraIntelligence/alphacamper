'use client'

import { useState, useCallback, useEffect } from 'react'
import { getCampground } from '@/lib/parks'
import { StepSummary } from './StepSummary'
import { StepSearch } from './StepSearch'
import { StepDates } from './StepDates'
import { StepSiteNumber } from './StepSiteNumber'
import { StepEmail } from './StepEmail'
import { WatchConfirmation } from './WatchConfirmation'

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

interface WatchWizardProps {
  initialParkId?: string
  initialQuery?: string
}

export function WatchWizard({ initialParkId }: WatchWizardProps) {
  const [activeStep, setActiveStep] = useState<WizardStep>('search')
  const [data, setData] = useState<WatchData>(INITIAL_DATA)
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (initialParkId) {
      const park = getCampground(initialParkId)
      if (park) {
        setData((prev) => ({
          ...prev,
          campgroundId: park.id,
          campgroundName: park.name,
          platform: park.platform,
          province: park.province,
        }))
        setCompletedSteps((prev) => new Set([...prev, 'search']))
        setActiveStep('dates')
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateData = useCallback((partial: Partial<WatchData>) => {
    setData((prev) => ({ ...prev, ...partial }))
  }, [])

  const completeStep = useCallback((step: WizardStep, nextStep: WizardStep) => {
    setCompletedSteps((prev) => new Set([...prev, step]))
    setActiveStep(nextStep)
  }, [])

  const handleCreateWatch = async () => {
    if (isSubmitting) return
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
        sendMagicLink(data.email, window.location.origin).catch(() => {})
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
      <WatchConfirmation
        campgroundName={data.campgroundName}
        platform={data.platform}
        arrivalDate={data.arrivalDate}
        departureDate={data.departureDate}
        email={data.email}
      />
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
              aria-expanded={isActive}
              aria-controls={`step-content-${key}`}
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
              <div className="step-content" id={`step-content-${key}`} role="region">
                {key === 'search' && (
                  <StepSearch
                    data={data}
                    onUpdate={updateData}
                    onComplete={() => completeStep('search', 'dates')}
                  />
                )}
                {key === 'dates' && (
                  <StepDates data={data} onUpdate={updateData} onComplete={() => completeStep('dates', 'site')} />
                )}
                {key === 'site' && (
                  <StepSiteNumber data={data} onUpdate={updateData} onComplete={() => completeStep('site', 'email')} />
                )}
                {key === 'email' && (
                  <StepEmail
                    data={data}
                    onUpdate={updateData}
                    onSubmit={handleCreateWatch}
                    isSubmitting={isSubmitting}
                    error={submitError}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
