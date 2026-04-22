'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { clearMagicLinkEmail, readMagicLinkEmail, sendMagicLink } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'

const PENDING_WATCH_STORAGE_KEY = 'alphacamper.pendingWatch'

interface PendingWatchDraft {
  platform: 'bc_parks' | 'ontario_parks' | 'recreation_gov' | 'parks_canada' | ''
  campgroundId: string
  campgroundName: string
  siteNumber: string | null
  arrivalDate: string
  departureDate: string
}

const VALID_OTP_TYPES = ['email', 'magiclink', 'signup', 'recovery'] as const
type ValidOtpType = typeof VALID_OTP_TYPES[number]

function readPendingWatchDraft(): PendingWatchDraft | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(PENDING_WATCH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PendingWatchDraft
    if (!parsed.platform || !parsed.campgroundId || !parsed.arrivalDate || !parsed.departureDate) {
      window.localStorage.removeItem(PENDING_WATCH_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    window.localStorage.removeItem(PENDING_WATCH_STORAGE_KEY)
    return null
  }
}

// Allowlist of known legitimate Alphacamper extension IDs.
// In production, the Chrome Web Store assigns a fixed ID based on the signing key.
// During local development, Chrome creates a different ID for unpacked extensions.
const ALLOWED_EXTENSION_IDS: ReadonlySet<string> = new Set(
  (process.env.NEXT_PUBLIC_ALLOWED_EXTENSION_IDS ?? '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
)

function isAllowedExtensionId(extensionId: string): boolean {
  // If no allowlist is configured (e.g., early dev), reject all extension auth
  // to fail-closed rather than allowing any extension to receive tokens.
  if (ALLOWED_EXTENSION_IDS.size === 0) return false
  return ALLOWED_EXTENSION_IDS.has(extensionId)
}

async function sendTokenToExtension(extensionId: string, token: string, email: string): Promise<boolean> {
  if (!isAllowedExtensionId(extensionId)) return false

  const chromeApi = (window as Window & {
    chrome?: {
      runtime?: {
        sendMessage?: (extensionId: string, message: unknown, callback?: (response?: unknown) => void) => void
      }
    }
  }).chrome as undefined | {
    runtime?: {
      sendMessage?: (extensionId: string, message: unknown, callback?: (response?: unknown) => void) => void
    }
  }

  const sendMessage = chromeApi?.runtime?.sendMessage
  if (!sendMessage) return false

  return await new Promise((resolve) => {
    try {
      sendMessage(extensionId, { action: 'store_extension_auth', token, email }, (response) => {
        resolve(Boolean((response as { success?: boolean } | undefined)?.success))
      })
    } catch {
      resolve(false)
    }
  })
}

function AuthConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'creating' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('This magic link has expired or was already used.')
  const [hasPendingWatch] = useState(() => Boolean(readPendingWatchDraft()))
  const [magicLinkEmail] = useState<string | null>(() => readMagicLinkEmail())
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [resendError, setResendError] = useState<string | null>(null)
  const isExtensionFlow = Boolean(searchParams.get('extensionId'))

  useEffect(() => {
    let isMounted = true
    let redirectTimer: ReturnType<typeof setTimeout> | undefined

    // PKCE flow (client has flowType:'pkce'): Supabase redirects with ?code=<code>.
    // The code is exchanged for a session using the code_verifier stored in
    // localStorage by signInWithOtp. This defeats email-client link prefetching
    // (Apple Mail MPP, Outlook, corporate scanners) because a prefetcher hitting
    // the link has no code_verifier.
    //
    // Legacy OTP flow (admin.generateLink non-PKCE): Supabase redirects with
    // ?token_hash=<hash>&type=<type>. Kept for the wizard + extension paths
    // that mint links server-side via the service role.
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const extensionId = searchParams.get('extensionId')
    const draft = readPendingWatchDraft()

    const hasPkceCode = Boolean(code)
    const hasLegacyOtp =
      Boolean(tokenHash) && Boolean(type) && VALID_OTP_TYPES.includes(type as ValidOtpType)

    if (!hasPkceCode && !hasLegacyOtp) {
      queueMicrotask(() => { if (isMounted) setStatus('error') })
      return () => { isMounted = false }
    }

    const supabase = getSupabase()
    const verifyPromise = hasPkceCode
      ? supabase.auth.exchangeCodeForSession(code!).then(({ error }) => ({ error }))
      : supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type as ValidOtpType })

    verifyPromise
      .then(async ({ error }) => {
        if (!isMounted) return
        if (error) {
          setStatus('error')
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('Your email was confirmed, but we could not finish signing you in. Please try the link again.')
        }

        const authHeaders = { Authorization: `Bearer ${session.access_token}` }
        if (!isMounted) return

        setStatus('creating')

        const registerRes = await fetch('/api/register', {
          method: 'POST',
          headers: authHeaders,
        })

        if (!registerRes.ok) {
          throw new Error('Your email was confirmed, but we could not finish setting up your account.')
        }

        if (extensionId) {
          // Validate extension ID BEFORE minting a token — don't create
          // credentials for extensions that aren't on the allowlist.
          if (!isAllowedExtensionId(extensionId)) {
            throw new Error('Your email was confirmed, but the extension ID is not recognized. Open the extension and try Connect again.')
          }

          const extensionSessionRes = await fetch('/api/extension-auth/session', {
            method: 'POST',
            headers: authHeaders,
          })

          if (!extensionSessionRes.ok) {
            throw new Error('Your email was confirmed, but we could not reconnect the extension.')
          }

          const extensionSession = await extensionSessionRes.json()
          const sentToExtension = await sendTokenToExtension(
            extensionId,
            extensionSession.token,
            extensionSession.user?.email ?? ''
          )

          if (!sentToExtension) {
            throw new Error('Your email was confirmed, but we could not reconnect the extension. Open the extension and try Connect again.')
          }
        }

        if (draft) {
          const watchRes = await fetch('/api/watch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders,
            },
            body: JSON.stringify(draft),
          })

          if (!watchRes.ok) {
            throw new Error('Your email was confirmed, but we could not save your watch yet.')
          }

          window.localStorage.removeItem(PENDING_WATCH_STORAGE_KEY)
        }

        if (!isMounted) return
        clearMagicLinkEmail()
        setStatus('success')
        redirectTimer = setTimeout(() => { if (isMounted) router.push('/dashboard') }, 1500)
      })
      .catch((error) => {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : 'We could not complete sign-in.')
        setStatus('error')
      })

    return () => {
      isMounted = false
      clearTimeout(redirectTimer)
    }
  }, [searchParams, router])

  const handleResendMagicLink = async () => {
    if (!magicLinkEmail || resendState === 'sending') return

    setResendState('sending')
    setResendError(null)

    const { error } = await sendMagicLink(magicLinkEmail, window.location.origin, {
      campgroundName: readPendingWatchDraft()?.campgroundName,
      extensionId: searchParams.get('extensionId'),
      flow: searchParams.get('flow'),
    })

    if (error) {
      setResendError(error)
      setResendState('error')
      return
    }

    setResendState('sent')
  }

  const fallbackHref = hasPendingWatch ? '/watch/new' : '/dashboard'
  const fallbackLabel = hasPendingWatch ? 'Start over with a new watch' : 'Back to sign in'

  return (
    <main className="auth-confirm">
      <div className="auth-confirm-inner">
        {status === 'verifying' && (
          <>
            <p className="auth-confirm-kicker">
              <span className="auth-confirm-kicker-dot" aria-hidden="true" />
              Verifying
            </p>
            <h1 className="auth-confirm-title">Checking your email…</h1>
            <p className="auth-confirm-body">
              Hang tight — this usually takes a second.
            </p>
          </>
        )}

        {status === 'creating' && (
          <>
            <p className="auth-confirm-kicker">
              <span className="auth-confirm-kicker-dot" aria-hidden="true" />
              Almost there
            </p>
            <h1 className="auth-confirm-title">
              {hasPendingWatch ? 'Finishing your watch…' : 'Finishing sign-in…'}
            </h1>
            <p className="auth-confirm-body">
              {hasPendingWatch
                ? 'Saving your account and setting up the watch now.'
                : 'Setting up your account now.'}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <p className="auth-confirm-kicker auth-confirm-kicker-success">
              <span className="auth-confirm-kicker-dot" aria-hidden="true" />
              Signed in
            </p>
            <h1 className="auth-confirm-title">
              You&apos;re <em>in</em>.
            </h1>
            <p className="auth-confirm-body">
              {hasPendingWatch
                ? 'Your watch is ready. Jumping to the dashboard…'
                : 'Jumping to the dashboard…'}
              {isExtensionFlow ? ' Your extension is reconnected too.' : ''}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="auth-confirm-kicker auth-confirm-kicker-error">
              <span className="auth-confirm-kicker-dot" aria-hidden="true" />
              Link didn&apos;t work
            </p>
            <h1 className="auth-confirm-title">We couldn&apos;t finish sign-in</h1>
            <p className="auth-confirm-body">{errorMessage}</p>

            {magicLinkEmail && (
              <div className="auth-confirm-actions">
                <button
                  type="button"
                  className="auth-confirm-primary"
                  onClick={handleResendMagicLink}
                  disabled={resendState === 'sending'}
                >
                  {resendState === 'sending' ? 'Sending a new link…' : 'Email me a new link'}
                  <span aria-hidden="true">→</span>
                </button>
                {resendState === 'sent' ? (
                  <p className="auth-confirm-status auth-confirm-status-success">
                    We sent a fresh link to {magicLinkEmail}.
                  </p>
                ) : null}
                {resendState === 'error' ? (
                  <p className="auth-confirm-status auth-confirm-status-error">
                    {resendError}
                  </p>
                ) : null}
              </div>
            )}

            <Link href={fallbackHref} className="auth-confirm-fallback">
              {fallbackLabel}
            </Link>
          </>
        )}
      </div>
    </main>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<main className="auth-confirm"><div className="auth-confirm-inner"><p className="auth-confirm-body">Loading…</p></div></main>}>
      <AuthConfirmContent />
    </Suspense>
  )
}
