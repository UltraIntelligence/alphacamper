'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'

function AuthConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

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
      .then(({ error }) => {
        if (!isMounted) return
        if (error) {
          setStatus('error')
        } else {
          setStatus('success')
          redirectTimer = setTimeout(() => { if (isMounted) router.push('/dashboard') }, 1500)
        }
      })
      .catch(() => { if (isMounted) setStatus('error') })

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
      {status === 'success' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', marginBottom: '16px' }}>You&apos;re in!</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Redirecting to your dashboard...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', marginBottom: '16px' }}>Link expired</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            This magic link has expired or was already used.
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
