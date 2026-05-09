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

function formatDateShort(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function nightCount(arrival: string, departure: string): number {
  const a = new Date(arrival + 'T00:00:00')
  const d = new Date(departure + 'T00:00:00')
  return Math.round((d.getTime() - a.getTime()) / 86400000)
}

function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
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
    gtc_new_brunswick: 'New Brunswick Parks',
  }
  return labels[platform] || platform
}

export function WatchCard({ watch, isPast, onDelete }: WatchCardProps) {
  const nights = nightCount(watch.arrival_date, watch.departure_date)

  const handleDelete = () => {
    if (window.confirm(`Delete watch for ${watch.campground_name}?`)) {
      onDelete(watch.id)
    }
  }

  return (
    <article className="watch-card" data-past={isPast ? 'true' : 'false'}>
      <header className="watch-card-head">
        <div className="watch-card-headline">
          <p className="watch-card-platform">{platformLabel(watch.platform)}</p>
          <h3 className="watch-card-name">{watch.campground_name}</h3>
        </div>
        {watch.site_number ? (
          <div className="watch-card-site">
            <span className="watch-card-site-hash">#</span>
            {watch.site_number}
          </div>
        ) : (
          <div className="watch-card-site watch-card-site-any">Any site</div>
        )}
      </header>

      <div className="watch-card-dates">
        <span className="watch-card-date">{formatDateShort(watch.arrival_date)}</span>
        <span className="watch-card-date-arrow" aria-hidden="true">
          →
        </span>
        <span className="watch-card-date">{formatDateShort(watch.departure_date)}</span>
        <span className="watch-card-nights">
          {nights} night{nights !== 1 ? 's' : ''}
        </span>
      </div>

      <footer className="watch-card-footer">
        <div className="watch-card-status" data-inactive={isPast ? 'true' : 'false'}>
          <span className="status-dot" data-inactive={isPast ? 'true' : 'false'} aria-hidden="true" />
          <span className="sr-only">{isPast ? 'Status: Expired' : 'Status: Watching'}</span>
          <span className="watch-card-status-label">{isPast ? 'Expired' : 'Watching'}</span>
          {!isPast && watch.last_checked_at ? (
            <span className="watch-card-status-time">
              · checked {timeAgo(watch.last_checked_at)}
            </span>
          ) : null}
        </div>
        {!isPast ? (
          <button
            type="button"
            className="btn-text-danger"
            onClick={handleDelete}
            aria-label={`Delete watch for ${watch.campground_name}`}
          >
            Delete
          </button>
        ) : null}
      </footer>
    </article>
  )
}

export type { Watch }
