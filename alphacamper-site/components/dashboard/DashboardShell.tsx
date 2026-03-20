'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { LoginPrompt } from './LoginPrompt'
import { WatchList } from './WatchList'
import { AlertList } from './AlertList'
import { UpgradeCTA } from './UpgradeCTA'
import Link from 'next/link'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

export function DashboardShell() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user?.email) {
        setAuthState('unauthenticated')
        return
      }

      // Resolve Supabase Auth email → users table ID
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        })
        if (res.ok) {
          const { user: dbUser } = await res.json()
          setUserId(dbUser.id)
          setAuthState('authenticated')
        } else {
          setAuthState('error')
        }
      } catch {
        setAuthState('error')
      }
    }

    checkAuth()
  }, [])

  if (authState === 'loading') {
    return (
      <div>
        <div className="dashboard-header">
          <div className="skeleton" style={{ width: '200px', height: '32px' }} />
        </div>
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    )
  }

  if (authState === 'unauthenticated') {
    return <LoginPrompt />
  }

  if (authState === 'error') {
    return (
      <div className="step-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-inter)', fontSize: '1.3rem', marginBottom: '12px' }}>
          Something went wrong
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
          We couldn&apos;t load your dashboard. Please try again.
        </p>
        <button type="button" className="btn-bold btn-bold-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>Your Watches</h1>
        <Link href="/watch/new" className="btn-bold btn-bold-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '0.9rem' }}>
          + Create a watch
        </Link>
      </div>

      <WatchList userId={userId!} />
      <AlertList userId={userId!} />
      <UpgradeCTA />
    </div>
  )
}
