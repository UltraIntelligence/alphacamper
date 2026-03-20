'use client'

import { getPlatformDomain } from '@/lib/parks'

interface Alert {
  id: string
  site_details: { sites?: { siteId: string; siteName: string }[] } | null
  notified_at: string
  watched_targets: {
    campground_name: string
    campground_id: string
    platform: string
    arrival_date: string
    departure_date: string
  } | null
}

interface AlertCardProps {
  alert: Alert
  onDismiss: (id: string) => void
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function buildBookingLink(platform: string, campgroundId: string): string | null {
  const domain = getPlatformDomain(platform)
  if (!domain) return null
  return `https://${domain}/create-booking/results?resourceLocationId=${campgroundId}`
}

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const target = alert.watched_targets
  const sites = alert.site_details?.sites ?? []
  const siteNames = sites.map((s) => s.siteName).join(', ') || 'a site'
  const campgroundName = target?.campground_name ?? 'Unknown campground'
  const bookingLink = target ? buildBookingLink(target.platform, target.campground_id) : null

  function handleDismiss() {
    onDismiss(alert.id)
  }

  return (
    <div className="alert-card">
      <div className="alert-card-title">
        {campgroundName} — {siteNames} opened up!
      </div>
      <div className="alert-card-time">
        {formatTime(alert.notified_at)}
      </div>
      <div className="alert-card-actions">
        {bookingLink && (
          <a
            href={bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-text-accent"
          >
            Book now →
          </a>
        )}
        <button type="button" className="btn-text-muted" onClick={handleDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  )
}

export type { Alert }
