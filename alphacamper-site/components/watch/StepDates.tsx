'use client'

import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import type { DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import type { WatchData } from './WatchWizard'
import { UpgradeLink } from '@/components/billing/UpgradeLink'

interface StepDatesProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

function dateToStr(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function strToDate(str: string): Date | undefined {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function nightsBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

const MAX_NIGHTS = 14

export function StepDates({ data, onUpdate, onComplete }: StepDatesProps) {
  const [tooLong, setTooLong] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selected: DateRange | undefined = data.arrivalDate
    ? { from: strToDate(data.arrivalDate), to: strToDate(data.departureDate) }
    : undefined

  const handleSelect = (range: DateRange | undefined) => {
    setTooLong(false)
    if (!range?.from) {
      onUpdate({ arrivalDate: '', departureDate: '', nights: 1 })
      return
    }
    if (!range.to) {
      onUpdate({ arrivalDate: dateToStr(range.from), departureDate: '', nights: 1 })
      return
    }
    const nights = nightsBetween(range.from, range.to)
    if (nights < 1) {
      onUpdate({ arrivalDate: dateToStr(range.from), departureDate: '', nights: 1 })
      return
    }
    if (nights > MAX_NIGHTS) {
      setTooLong(true)
      onUpdate({ arrivalDate: dateToStr(range.from), departureDate: '', nights: 1 })
      return
    }
    onUpdate({
      arrivalDate: dateToStr(range.from),
      departureDate: dateToStr(range.to),
      nights,
    })
  }

  const canContinue = Boolean(data.arrivalDate && data.departureDate && data.nights >= 1)

  const formatLongDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-CA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

  return (
    <div className="step-pane">
      <h2 className="step-question">
        When do you want to <em>be there</em>?
      </h2>
      <p className="step-lede">
        Pick your exact arrival and departure. Up to 14 nights. We&apos;ll scan
        every day you&apos;re watching, around the clock.
      </p>

      <div className="step-date-modes" role="tablist" aria-label="Date mode">
        <button
          role="tab"
          type="button"
          className="step-date-mode"
          data-active={!data.isAnyOpening ? 'true' : undefined}
          onClick={() => onUpdate({ isAnyOpening: false })}
          aria-selected={!data.isAnyOpening}
        >
          My trip
        </button>
        <button
          role="tab"
          type="button"
          className="step-date-mode"
          data-active={data.isAnyOpening ? 'true' : undefined}
          onClick={() => onUpdate({ isAnyOpening: true })}
          aria-selected={data.isAnyOpening}
        >
          Any opening
          <span className="step-date-mode-lock" aria-hidden="true">PRO</span>
        </button>
      </div>

      {data.isAnyOpening ? (
        <div className="step-date-upsell">
          <p className="step-date-upsell-kicker">Locked for the beta</p>
          <h3 className="step-date-upsell-title">
            Unlock &quot;Any Opening&quot; mode
          </h3>
          <p className="step-date-upsell-body">
            Give us an entire season to track and we grab the first cancellation
            that matches. Available with Pro — rolling out to paying members after
            the beta.
          </p>
          <UpgradeLink className="step-date-upsell-cta">
            Upgrade to Alpha Pro
          </UpgradeLink>
        </div>
      ) : (
        <>
          <div className="step-date-calendar">
            <div className="rdp-wrapper">
              <DayPicker
                mode="range"
                selected={selected}
                onSelect={handleSelect}
                disabled={{ before: today }}
                defaultMonth={selected?.from ?? today}
                showOutsideDays
              />
            </div>

            <div className="step-date-readout">
              <div className="step-date-readout-row">
                <p className="step-date-readout-label">Check-in</p>
                <p className="step-date-readout-value">
                  {data.arrivalDate ? formatLongDate(data.arrivalDate) : <span className="step-date-readout-dash">—</span>}
                </p>
              </div>
              <div className="step-date-readout-row">
                <p className="step-date-readout-label">Check-out</p>
                <p className="step-date-readout-value">
                  {data.departureDate ? formatLongDate(data.departureDate) : <span className="step-date-readout-dash">—</span>}
                </p>
              </div>
              <div className="step-date-readout-row step-date-readout-row-chip">
                <p className="step-date-readout-label">Nights</p>
                <p className="step-date-readout-chip">
                  {data.arrivalDate && data.departureDate ? data.nights : 0}
                </p>
              </div>
            </div>
          </div>

          {tooLong ? (
            <p className="step-date-error" role="alert">
              Max {MAX_NIGHTS} nights — try a shorter stay.
            </p>
          ) : null}

          {!tooLong && (!data.arrivalDate || !data.departureDate) ? (
            <p className="step-date-hint">
              {!data.arrivalDate
                ? 'Click your arrival date on the calendar.'
                : 'Now pick your departure date.'}
            </p>
          ) : null}

          <div className="step-actions">
            <button
              type="button"
              className="step-cta"
              onClick={onComplete}
              disabled={!canContinue}
            >
              Continue
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
