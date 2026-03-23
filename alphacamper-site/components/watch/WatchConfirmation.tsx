import Link from 'next/link'
import { Check, MapPin, CalendarDays, Mail } from 'lucide-react'

export function WatchConfirmation({
  campgroundName,
  platform,
  arrivalDate,
  departureDate,
  email,
  magicLinkSent,
  magicLinkError,
  onResend,
}: {
  campgroundName: string
  platform: string
  arrivalDate: string
  departureDate: string
  email: string
  magicLinkSent?: boolean
  magicLinkError?: string | null
  onResend?: () => void
}) {
  const platformLabels: Record<string, string> = { bc_parks: 'BC Parks', ontario_parks: 'Ontario Parks', recreation_gov: 'Recreation.gov', parks_canada: 'Parks Canada' }
  const platformLabel = platformLabels[platform] || platform

  return (
    <div style={{ textAlign: 'center', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'rgba(47, 132, 124, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={40} color="var(--paradiso)" strokeWidth={3} />
        </div>
      </div>

      <p className="field-hint" style={{ fontSize: '1.05rem', marginBottom: '32px', maxWidth: '480px', marginInline: 'auto', lineHeight: 1.5 }}>
        We&apos;ll save your watch after you confirm your email, then start checking 24/7 for cancellations.
      </p>

      {/* Summary Card matches Step 3 Specific Loops UI language */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '24px', border: 'var(--border-thin) solid var(--color-border)', textAlign: 'left', marginBottom: '24px',
        display: 'flex', flexDirection: 'column', gap: '20px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(47, 132, 124, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--paradiso)', flexShrink: 0 }}>
             <MapPin size={22} />
           </div>
           <div>
             <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)', marginBottom: 2 }}>{campgroundName}</div>
             <div className="field-hint" style={{ fontSize: '0.85rem', margin: 0 }}>{platformLabel}</div>
           </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(47, 132, 124, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--paradiso)', flexShrink: 0 }}>
             <CalendarDays size={22} />
           </div>
           <div>
             <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: 2 }}>{arrivalDate} to {departureDate}</div>
             <div className="field-hint" style={{ fontSize: '0.85rem', margin: 0 }}>Watching 24/7 for openings</div>
           </div>
        </div>
      </div>

      {/* Inbox Action Box */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '24px', border: 'var(--border-thin) solid var(--color-border)', textAlign: 'left', display: 'flex', gap: '16px', marginBottom: '40px' }}>
        <Mail size={24} color="var(--color-text)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flexGrow: 1 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', marginBottom: 8 }}>Verify your email</h3>
          <p className="field-hint" style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: 0, color: 'var(--color-text-muted)' }}>
             Alerts will go to <strong style={{color: 'var(--color-text)'}}>{email}</strong>. 
             {!magicLinkError && ' Check your inbox for a link to activate your account. Open that link on this device to finish saving your watch automatically.'}
          </p>
          
          {magicLinkError && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-error, #c0392b)', marginTop: '8px', fontWeight: 600 }}>
              {magicLinkError}{' '}
              {onResend && (
                <button onClick={onResend} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}>
                  Resend link
                </button>
              )}
            </p>
          )}
          {magicLinkSent && !magicLinkError && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--paradiso)', marginTop: '12px', fontWeight: 600, background: 'rgba(47, 132, 124, 0.1)', padding: '6px 12px', borderRadius: '100px' }}>
              <Check size={14} strokeWidth={3} />
              Login link sent
            </div>
          )}
        </div>
      </div>

      <Link href="/" className="btn-bold btn-bold-primary" style={{ display: 'block', width: '100%', textDecoration: 'none' }}>
        Back to home
      </Link>
    </div>
  )
}
