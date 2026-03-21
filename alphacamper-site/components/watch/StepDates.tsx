'use client'

import type { WatchData } from './WatchWizard'

interface StepDatesProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function todayStr(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function StepDates({ data, onUpdate, onComplete }: StepDatesProps) {
  const handleArrivalChange = (arrivalDate: string) => {
    if (!arrivalDate) {
      onUpdate({ arrivalDate: '', departureDate: '' })
      return
    }
    onUpdate({ arrivalDate, departureDate: addDays(arrivalDate, data.nights) })
  }

  const handleNightsChange = (nights: number) => {
    if (nights < 1 || nights > 14) return
    const departureDate = data.arrivalDate ? addDays(data.arrivalDate, nights) : ''
    onUpdate({ nights, departureDate })
  }

  const canContinue = data.arrivalDate && data.departureDate && data.nights >= 1

  return (
    <div>
      <div className="field-group">
        <label className="field-label" htmlFor="arrival-date">
          What day do you want to arrive?
        </label>
        <span className="field-hint">
          This is the day you want to START your stay.
        </span>
        <input
          id="arrival-date"
          className="field-input"
          type="date"
          min={todayStr()}
          value={data.arrivalDate}
          onChange={(e) => handleArrivalChange(e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="field-label">How many nights?</label>
        <span className="field-hint">Fewer nights means more possible openings.</span>
        <div className="nights-counter">
          <button
            type="button"
            className="btn-bold btn-bold-outline"
            style={{ padding: '8px 16px', fontSize: '1.2rem' }}
            onClick={() => handleNightsChange(data.nights - 1)}
            disabled={data.nights <= 1}
            aria-label="Decrease nights"
          >
            −
          </button>
          <span className="nights-value">{data.nights}</span>
          <button
            type="button"
            className="btn-bold btn-bold-outline"
            style={{ padding: '8px 16px', fontSize: '1.2rem' }}
            onClick={() => handleNightsChange(data.nights + 1)}
            disabled={data.nights >= 14}
            aria-label="Increase nights"
          >
            +
          </button>
          <span style={{ color: 'var(--color-text-muted)' }}>
            night{data.nights !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {data.arrivalDate && data.departureDate && (
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          Watching for: <strong>{data.arrivalDate}</strong> to <strong>{data.departureDate}</strong>
        </p>
      )}

      {canContinue && (
        <button type="button" className="btn-bold btn-bold-primary btn-bold-full" onClick={onComplete}>
          Continue
        </button>
      )}
    </div>
  )
}
