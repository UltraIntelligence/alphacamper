'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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

async function sendTokenToExtension(extensionId: string, token: string, email: string): Promise<boolean> {
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
  const [hasPendingWatch, setHasPendingWatch] = useState(false)
  const isExtensionFlow = Boolean(searchParams.get('extensionId'))

  useEffect(() => {
    let isMounted = true
    let redirectTimer: ReturnType<typeof setTimeout> | undefined

    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const extensionId = searchParams.get('extensionId')

    if (!tokenHash || !type || !VALID_OTP_TYPES.includes(type as ValidOtpType)) {
      queueMicrotask(() => { if (isMounted) setStatus('error') })
      return () => { isMounted = false }
    }

    const supabase = getSupabase()
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: type as ValidOtpType })
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
        const draft = readPendingWatchDraft()
        if (!isMounted) return

        setHasPendingWatch(Boolean(draft))
        setStatus('creating')

        const registerRes = await fetch('/api/register', {
          method: 'POST',
          headers: authHeaders,
        })

        if (!registerRes.ok) {
          throw new Error('Your email was confirmed, but we could not finish setting up your account.')
        }

        if (extensionId) {
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

  return (
    <main className="wizard-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
      {status === 'verifying' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', marginBottom: '16px' }}>Verifying your email...</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Hang tight, Alpha&apos;s checking your credentials.</p>
        </>
      )}
      {status === 'creating' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', marginBottom: '16px' }}>
            {hasPendingWatch ? 'Finishing your watch...' : 'Finishing sign-in...'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {hasPendingWatch ? 'Alpha&apos;s saving your account and watch now.' : 'Alpha&apos;s setting up your account now.'}
          </p>
        </>
      )}
      {status === 'success' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', marginBottom: '16px' }}>You&apos;re in!</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {hasPendingWatch ? 'Your watch is ready. Redirecting to your dashboard...' : 'Your account is ready. Redirecting to your dashboard...'}
            {isExtensionFlow ? ' Your extension is connected too.' : ''}
          </p>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', marginBottom: '16px' }}>We couldn&apos;t finish sign-in</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            {errorMessage}
          </p>
          <Link href="/watch/new" className="btn-bold btn-bold-primary" style={{ textDecoration: 'none' }}>
            Create a new watch
          </Link>
        </>
      )}
    </main>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<main className="wizard-container" style={{ textAlign: 'center', paddingTop: '80px' }}>Loading...</main>}>
      <AuthConfirmContent />
    </Suspense>
  )
}
