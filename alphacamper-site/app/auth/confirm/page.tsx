'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

function AuthConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (!tokenHash || !type) {
      setStatus('error')
      return
    }

    const supabase = getSupabase()
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: type as 'email' })
      .then(({ error }) => {
        if (error) {
          setStatus('error')
        } else {
          setStatus('success')
          setTimeout(() => router.push('/dashboard'), 1500)
        }
      })
  }, [searchParams, router])

  return (
    <main className="wizard-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
      {status === 'verifying' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '2rem', marginBottom: '16px' }}>Verifying your email...</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Hang tight, Alpha's checking your credentials.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '2rem', marginBottom: '16px' }}>You're in!</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Redirecting to your dashboard...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '2rem', marginBottom: '16px' }}>Link expired</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            This magic link has expired or was already used.
          </p>
          <a href="/watch/new" className="btn-bold btn-bold-primary" style={{ textDecoration: 'none' }}>
            Create a new watch
          </a>
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
