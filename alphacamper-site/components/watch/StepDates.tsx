'use client'

import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import type { DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import type { WatchData } from './WatchWizard'

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

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-CA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

  return (
    <div>
      <div className="rdp-two-col">
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

        <div className="rdp-summary-panel">
          <div>
            <div className="rdp-summary-label">Campground</div>
            <div className="rdp-summary-campground">{data.campgroundName}</div>
          </div>

          <hr className="rdp-summary-divider" />

          {data.arrivalDate && data.departureDate ? (
            <>
              <div className="rdp-summary-date-block">
                <div>
                  <div className="rdp-summary-label">Check-in</div>
                  <div className="rdp-summary-date-value">{formatDate(data.arrivalDate)}</div>
                </div>
                <div>
                  <div className="rdp-summary-label">Check-out</div>
                  <div className="rdp-summary-date-value">{formatDate(data.departureDate)}</div>
                </div>
              </div>
              <div className="rdp-summary-nights-badge">
                {data.nights} night{data.nights !== 1 ? 's' : ''}
              </div>
            </>
          ) : (
            <div className="rdp-summary-placeholder">
              {!data.arrivalDate
                ? 'Select your arrival date on the calendar.'
                : 'Now select your departure date.'}
            </div>
          )}
        </div>
      </div>

      {tooLong && (
        <p style={{ color: '#cc3333', fontSize: '0.85rem', marginTop: '8px' }}>
          Max {MAX_NIGHTS} nights — try a shorter stay.
        </p>
      )}

      {canContinue && (
        <button
          type="button"
          className="btn-bold btn-bold-primary btn-bold-full"
          onClick={onComplete}
          style={{ marginTop: '16px' }}
        >
          Continue
        </button>
      )}
    </div>
  )
}
