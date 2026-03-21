'use client'

interface Watch {
  id: string
  campground_name: string
  platform: string
  arrival_date: string
  departure_date: string
  site_number: string | null
  last_checked_at: string | null
  created_at: string
}

interface WatchCardProps {
  watch: Watch
  isPast: boolean
  onDelete: (id: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function nightCount(arrival: string, departure: string): number {
  const a = new Date(arrival + 'T00:00:00')
  const d = new Date(departure + 'T00:00:00')
  return Math.round((d.getTime() - a.getTime()) / 86400000)
}

function platformLabel(platform: string): string {
  const labels: Record<string, string> = { bc_parks: 'BC Parks', ontario_parks: 'Ontario Parks', recreation_gov: 'Recreation.gov', parks_canada: 'Parks Canada' }
  return labels[platform] || platform
}

export function WatchCard({ watch, isPast, onDelete }: WatchCardProps) {
  const nights = nightCount(watch.arrival_date, watch.departure_date)
  const siteLabel = watch.site_number ? `Site #${watch.site_number}` : 'Any site'

  const handleDelete = () => {
    if (window.confirm(`Delete watch for ${watch.campground_name}?`)) {
      onDelete(watch.id)
    }
  }

  return (
    <div className="watch-card" data-past={isPast ? 'true' : 'false'}>
      <div className="watch-card-name">
        {watch.campground_name}
        <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
          {platformLabel(watch.platform)}
        </span>
      </div>
      <div className="watch-card-details">
        {watch.arrival_date} → {watch.departure_date} ({nights} night{nights !== 1 ? 's' : ''}) · {siteLabel}
      </div>
      <div className="watch-card-footer">
        <div className="watch-card-status">
          <span className="status-dot" data-inactive={isPast ? 'true' : 'false'} aria-hidden="true" />
          <span className="sr-only">{isPast ? 'Status: Expired' : 'Status: Watching'}</span>
          {isPast ? 'Expired' : 'Watching'}
          {!isPast && watch.last_checked_at && (
            <span> · Last checked {timeAgo(watch.last_checked_at)}</span>
          )}
        </div>
        {!isPast && (
          <button type="button" className="btn-text-danger" onClick={handleDelete} aria-label={`Delete watch for ${watch.campground_name}`}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

export type { Watch }
