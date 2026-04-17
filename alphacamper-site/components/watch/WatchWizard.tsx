'use client'

import { useState, useCallback, useEffect } from 'react'
import { sendMagicLink, storeMagicLinkEmail } from '@/lib/auth'
import { getCampground } from '@/lib/parks'
import { StepSummary } from './StepSummary'
import { StepSearch } from './StepSearch'
import { StepDates } from './StepDates'
import { StepSiteNumber } from './StepSiteNumber'
import { StepEmail } from './StepEmail'
import { WatchConfirmation } from './WatchConfirmation'
import { WatchMapBackground } from './WatchMapBackground'

export type WizardStep = 'search' | 'dates' | 'site' | 'email'
const PENDING_WATCH_STORAGE_KEY = 'alphacamper.pendingWatch'

export interface WatchData {
  campgroundId: string
  campgroundName: string
  platform: 'bc_parks' | 'ontario_parks' | 'recreation_gov' | 'parks_canada' | ''
  province: string
  arrivalDate: string
  departureDate: string
  nights: number
  isAnyOpening: boolean
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
  isAnyOpening: false,
  siteNumber: '',
  email: '',
}

const STEPS: { key: WizardStep; number: number; title: string }[] = [
  { key: 'search', number: 1, title: 'Find your campground' },
  { key: 'dates', number: 2, title: 'Pick your dates' },
  { key: 'site', number: 3, title: 'Site preference' },
  { key: 'email', number: 4, title: 'Get notified' },
]

function getStepSummary(step: WizardStep, data: WatchData): string | null {
  switch (step) {
    case 'search': {
      if (!data.campgroundName) return null
      const platformLabels: Record<string, string> = { bc_parks: 'BC Parks', ontario_parks: 'Ontario Parks', recreation_gov: 'Recreation.gov', parks_canada: 'Parks Canada' }
      return `${data.campgroundName} — ${platformLabels[data.platform] || data.platform}`
    }
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
  initialPlatform?: WatchData['platform']
}

export function WatchWizard({ initialParkId, initialQuery, initialPlatform = '' }: WatchWizardProps) {
  const [activeStep, setActiveStep] = useState<WizardStep>('search')
  const [data, setData] = useState<WatchData>(INITIAL_DATA)
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null)

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
    } else if (initialPlatform) {
      setData((prev) => ({ ...prev, platform: initialPlatform }))
    }
  }, [initialParkId, initialPlatform])

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
      storeMagicLinkEmail(data.email)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PENDING_WATCH_STORAGE_KEY, JSON.stringify({
          platform: data.platform,
          campgroundId: data.campgroundId,
          campgroundName: data.campgroundName,
          siteNumber: data.siteNumber || null,
          arrivalDate: data.arrivalDate,
          departureDate: data.departureDate,
        }))
      }

      const { error } = await sendMagicLink(data.email, window.location.origin, {
        campgroundName: data.campgroundName,
      })
      if (error) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(PENDING_WATCH_STORAGE_KEY)
        }
        throw new Error(error)
      }

      setIsComplete(true)
      setMagicLinkSent(true)
      setMagicLinkError(null)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendMagicLink = async () => {
    setMagicLinkError(null)
    setMagicLinkSent(false)
    try {
      storeMagicLinkEmail(data.email)
      const { error } = await sendMagicLink(data.email, window.location.origin)
      if (error) {
        setMagicLinkError(error)
      } else {
        setMagicLinkSent(true)
      }
    } catch {
      setMagicLinkError('Failed to send login link. Please try again.')
    }
  }

  if (isComplete) {
    return (
      <>
        <WatchMapBackground campgroundName={data.campgroundName} platform={data.platform} isComplete={true} />
        <div className="wizard-glass-panel">
          <WatchConfirmation
            campgroundName={data.campgroundName}
            platform={data.platform}
            arrivalDate={data.arrivalDate}
            departureDate={data.departureDate}
            email={data.email}
            magicLinkSent={magicLinkSent}
            magicLinkError={magicLinkError}
            onResend={handleResendMagicLink}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <WatchMapBackground campgroundName={data.campgroundName} platform={data.platform} />
      <div className="wizard-glass-panel">
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
                    initialQuery={initialQuery}
                    platformFilter={initialPlatform}
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
    </>
  )
}
