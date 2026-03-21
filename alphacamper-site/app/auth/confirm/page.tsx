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

function AuthConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'creating' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('This magic link has expired or was already used.')

  useEffect(() => {
    let isMounted = true
    let redirectTimer: ReturnType<typeof setTimeout> | undefined

    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    const validTypes = ['email', 'magiclink', 'signup', 'recovery']
    if (!tokenHash || !type || !validTypes.includes(type)) {
      queueMicrotask(() => { if (isMounted) setStatus('error') })
      return () => { isMounted = false }
    }

    const supabase = getSupabase()
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: type as 'email' })
      .then(async ({ error }) => {
        if (!isMounted) return
        if (error) {
          setStatus('error')
          return
        }

        setStatus('creating')

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('Your email was confirmed, but we could not finish signing you in. Please try the link again.')
        }

        const authHeaders = { Authorization: `Bearer ${session.access_token}` }
        const registerRes = await fetch('/api/register', {
          method: 'POST',
          headers: authHeaders,
        })

        if (!registerRes.ok) {
          throw new Error('Your email was confirmed, but we could not finish setting up your account.')
        }

        const draft = readPendingWatchDraft()
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
          <h1 style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', marginBottom: '16px' }}>Finishing your watch...</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Alpha&apos;s saving your account and watch now.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', marginBottom: '16px' }}>You&apos;re in!</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Your watch is ready. Redirecting to your dashboard...</p>
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
    <Suspense>
      <AuthConfirmContent />
    </Suspense>
  )
}
