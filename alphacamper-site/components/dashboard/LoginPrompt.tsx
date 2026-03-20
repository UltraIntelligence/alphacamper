'use client'

import { useState } from 'react'
import { validateEmail } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'

export function LoginPrompt() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [touched, setTouched] = useState(false)

  const isValid = validateEmail(email)

  const handleSubmit = async () => {
    if (!isValid || status === 'sending') return
    setStatus('sending')

    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })

    setStatus(error ? 'error' : 'sent')
  }

  if (status === 'sent') {
    return (
      <div className="step-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-inter)', fontSize: '1.5rem', marginBottom: '12px' }}>
          Check your email
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          We sent a login link to <strong>{email}</strong>.
          Click it to access your dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="step-card" style={{ padding: '32px 24px' }}>
      <h2 style={{ fontFamily: 'var(--font-inter)', fontSize: '1.3rem', marginBottom: '8px' }}>
        Sign in to see your watches
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
        Enter your email and we&apos;ll send you a login link.
      </p>

      <div className="field-group">
        <label className="field-label" htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          className={`field-input ${touched && !isValid && email ? 'field-input-error' : ''}`}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        />
        {touched && !isValid && email && (
          <p style={{ color: '#cc3333', fontSize: '0.85rem', marginTop: '4px' }}>
            Please enter a valid email address.
          </p>
        )}
      </div>

      {status === 'error' && (
        <p className="error-banner">Something went wrong. Please try again.</p>
      )}

      <button
        type="button"
        className="btn-bold btn-bold-primary btn-bold-full"
        onClick={handleSubmit}
        disabled={!isValid || status === 'sending'}
      >
        {status === 'sending' ? 'Sending...' : 'Send login link'}
      </button>

      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '12px' }}>
        Don&apos;t have an account? <a href="/watch/new" style={{ color: 'var(--color-accent)' }}>Create your first watch</a>
      </p>
    </div>
  )
}
