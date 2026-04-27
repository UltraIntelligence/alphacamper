'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { sendMagicLink, storeMagicLinkEmail } from '@/lib/auth'
import { getCampground, type CampgroundPlatform } from '@/lib/parks'
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
  platform: CampgroundPlatform | ''
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

interface StepDef {
  key: WizardStep
  number: string
  label: string
}

const STEPS: StepDef[] = [
  { key: 'search', number: '01', label: 'Park' },
  { key: 'dates', number: '02', label: 'Dates' },
  { key: 'site', number: '03', label: 'Site' },
  { key: 'email', number: '04', label: 'Notify' },
]

const PLATFORM_LABELS: Record<string, string> = {
  bc_parks: 'BC Parks',
  ontario_parks: 'Ontario Parks',
  recreation_gov: 'Recreation.gov',
  parks_canada: 'Parks Canada',
  gtc_manitoba: 'Manitoba Parks',
  gtc_novascotia: 'Nova Scotia Parks',
  gtc_longpoint: 'Long Point Region',
  gtc_maitland: 'Maitland Valley',
  gtc_stclair: 'St. Clair Region',
  gtc_nlcamping: 'Newfoundland & Labrador Parks',
}

function formatIntakeDate(str: string): string {
  if (!str) return ''
  const [y, m, d] = str.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface WatchWizardProps {
  initialParkId?: string
  initialParkName?: string
  initialProvince?: string
  initialQuery?: string
  initialPlatform?: WatchData['platform']
}

export function WatchWizard({
  initialParkId,
  initialParkName,
  initialProvince,
  initialQuery,
  initialPlatform = '',
}: WatchWizardProps) {
  const [activeStep, setActiveStep] = useState<WizardStep>('search')
  const [data, setData] = useState<WatchData>(INITIAL_DATA)
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null)
  const userChangedCampgroundRef = useRef(false)

  useEffect(() => {
    let isCancelled = false

    const applySelectedPark = (park: {
      id: string
      name: string
      platform: WatchData['platform']
      province: string | null
    }) => {
      if (isCancelled) return
      setData((prev) => ({
        ...prev,
        campgroundId: park.id,
        campgroundName: park.name,
        platform: park.platform,
        province: park.province ?? '',
      }))
      setCompletedSteps((prev) => new Set([...prev, 'search']))
      setActiveStep('dates')
    }

    const hydrateSelectedPark = async () => {
      if (!initialParkId) {
        if (initialPlatform) {
          setData((prev) => ({ ...prev, platform: initialPlatform }))
        }
        return
      }

      try {
        const params = new URLSearchParams({ id: initialParkId })
        if (initialPlatform) params.set('platform', initialPlatform)

        const response = await fetch(`/api/campgrounds?${params.toString()}`)
        if (response.ok) {
          const body = await response.json()
          const park = body.campgrounds?.[0]
          const matchesInitialSelection =
            park?.id === initialParkId &&
            Boolean(park?.name) &&
            Boolean(park?.platform) &&
            (!initialPlatform || park.platform === initialPlatform)

          if (matchesInitialSelection && !userChangedCampgroundRef.current) {
            applySelectedPark({
              id: park.id,
              name: park.name,
              platform: park.platform,
              province: park.province ?? '',
            })
            return
          }
        }
      } catch {
        // Fall through to the static backup list.
      }

      const park = getCampground(initialParkId)
      if (park && (!initialPlatform || park.platform === initialPlatform) && !userChangedCampgroundRef.current) {
        applySelectedPark({
          id: park.id,
          name: park.name,
          platform: park.platform,
          province: park.province,
        })
      } else if (initialPlatform && !isCancelled) {
        setData((prev) => ({ ...prev, platform: initialPlatform }))
      }
    }

    void hydrateSelectedPark()

    return () => {
      isCancelled = true
    }
  }, [initialParkId, initialParkName, initialPlatform, initialProvince])

  const updateData = useCallback((partial: Partial<WatchData>) => {
    if (
      Object.prototype.hasOwnProperty.call(partial, 'campgroundId') ||
      Object.prototype.hasOwnProperty.call(partial, 'campgroundName') ||
      Object.prototype.hasOwnProperty.call(partial, 'platform') ||
      Object.prototype.hasOwnProperty.call(partial, 'province')
    ) {
      userChangedCampgroundRef.current = true
    }
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
        <div className="watch-confirm-shell">
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

  const activeIndex = STEPS.findIndex((s) => s.key === activeStep)
  const activeStepDef = STEPS[activeIndex] ?? STEPS[0]

  const siteLabel = data.siteNumber
    ? `#${data.siteNumber}`
    : completedSteps.has('site')
      ? 'Any site'
      : null

  const datesLabel =
    data.arrivalDate && data.departureDate
      ? `${formatIntakeDate(data.arrivalDate)} – ${formatIntakeDate(data.departureDate)}`
      : null

  return (
    <>
      <WatchMapBackground campgroundName={data.campgroundName} platform={data.platform} />

      <div className="wizard-desk">
        {/* Progress rail — named beats, not numbered balloons */}
        <nav className="wizard-rail" aria-label="Watch setup progress">
          {STEPS.map((step, idx) => {
            const isActive = step.key === activeStep
            const isDone = completedSteps.has(step.key)
            const canJump = isDone || isActive
            const state = isActive ? 'active' : isDone ? 'done' : 'upcoming'
            return (
              <button
                key={step.key}
                type="button"
                className="wizard-rail-beat"
                data-state={state}
                disabled={!canJump}
                onClick={() => {
                  if (canJump) setActiveStep(step.key)
                }}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="wizard-rail-index" aria-hidden="true">
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M1.5 5L4 7.5L8.5 2.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    step.number
                  )}
                </span>
                <span className="wizard-rail-label">{step.label}</span>
                {idx < STEPS.length - 1 ? (
                  <span className="wizard-rail-joint" aria-hidden="true" />
                ) : null}
              </button>
            )
          })}
        </nav>

        <div className="wizard-layout">
          {/* Left: the active step. Keyed on step so transitions fire. */}
          <section className="wizard-stage" aria-live="polite">
            <header className="wizard-stage-head">
              <p className="wizard-stage-kicker">
                <span className="wizard-stage-kicker-dot" aria-hidden="true" />
                Step {activeStepDef.number} of {STEPS.length} · {activeStepDef.label}
              </p>
            </header>

            <div key={activeStep} className="wizard-stage-body">
              {activeStep === 'search' && (
                <StepSearch
                  data={data}
                  initialQuery={initialQuery}
                  platformFilter={initialPlatform}
                  onUpdate={updateData}
                  onComplete={() => completeStep('search', 'dates')}
                />
              )}
              {activeStep === 'dates' && (
                <StepDates
                  data={data}
                  onUpdate={updateData}
                  onComplete={() => completeStep('dates', 'site')}
                />
              )}
              {activeStep === 'site' && (
                <StepSiteNumber
                  data={data}
                  onUpdate={updateData}
                  onComplete={() => completeStep('site', 'email')}
                />
              )}
              {activeStep === 'email' && (
                <StepEmail
                  data={data}
                  onUpdate={updateData}
                  onSubmit={handleCreateWatch}
                  isSubmitting={isSubmitting}
                  error={submitError}
                />
              )}
            </div>
          </section>

          {/* Right: the boarding-pass intake card. Updates live as data fills. */}
          <aside className="wizard-intake" aria-label="What we'll watch for you">
            <div className="wizard-intake-sticker" aria-hidden="true" />
            <header className="wizard-intake-head">
              <p className="wizard-intake-mark">Alphacamper</p>
              <p className="wizard-intake-label">Intake</p>
            </header>

            <div className="wizard-intake-rows">
              <IntakeRow
                label="Park"
                placeholder="Pick a park to start"
                value={
                  data.campgroundName
                    ? data.campgroundName
                    : null
                }
                sub={
                  data.campgroundName
                    ? PLATFORM_LABELS[data.platform] ?? data.platform ?? null
                    : null
                }
                active={activeStep === 'search'}
                done={completedSteps.has('search')}
              />
              <IntakeRow
                label="Dates"
                placeholder="Next"
                value={datesLabel}
                sub={
                  data.arrivalDate && data.departureDate
                    ? `${data.nights} night${data.nights !== 1 ? 's' : ''}`
                    : null
                }
                active={activeStep === 'dates'}
                done={completedSteps.has('dates')}
                mono
              />
              <IntakeRow
                label="Site"
                placeholder="Optional"
                value={siteLabel}
                sub={data.siteNumber ? 'Exact match only' : completedSteps.has('site') ? 'We watch every site' : null}
                active={activeStep === 'site'}
                done={completedSteps.has('site')}
                mono
              />
              <IntakeRow
                label="Notify"
                placeholder="Email"
                value={data.email || null}
                sub={data.email ? 'Magic link + alerts' : null}
                active={activeStep === 'email'}
                done={completedSteps.has('email')}
                mono
              />
            </div>

            <footer className="wizard-intake-foot">
              <p className="wizard-intake-promise">
                <strong>We get you the site.</strong> Setup is free — we only charge
                when you&apos;re ready to let us book.
              </p>
            </footer>
          </aside>
        </div>
      </div>
    </>
  )
}

interface IntakeRowProps {
  label: string
  placeholder: string
  value: string | null
  sub: string | null
  active: boolean
  done: boolean
  mono?: boolean
}

function IntakeRow({ label, placeholder, value, sub, active, done, mono }: IntakeRowProps) {
  const state = done ? 'done' : active ? 'active' : 'pending'
  return (
    <div className="wizard-intake-row" data-state={state}>
      <span className="wizard-intake-row-label">{label}</span>
      {value ? (
        <>
          <span className={`wizard-intake-row-value${mono ? ' wizard-intake-row-value-mono' : ''}`}>
            {value}
          </span>
          {sub ? <span className="wizard-intake-row-sub">{sub}</span> : null}
        </>
      ) : (
        <span className="wizard-intake-row-placeholder">{placeholder}</span>
      )}
    </div>
  )
}
