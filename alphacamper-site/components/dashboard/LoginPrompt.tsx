'use client'

import { useState } from 'react'
import Link from 'next/link'
import { storeMagicLinkEmail, validateEmail } from '@/lib/auth'
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
    try {
      storeMagicLinkEmail(email)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      })
      setStatus(error ? 'error' : 'sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <section className="login-prompt">
        <p className="login-prompt-kicker">Check your email</p>
        <h1 className="login-prompt-title">
          Link on its way to <em>{email}</em>
        </h1>
        <p className="login-prompt-body">
          Open the email we just sent and click the login link. It&apos;ll drop
          you straight into your watches.
        </p>
        <p className="login-prompt-footnote">
          No email yet? Check spam, then try again.
        </p>
      </section>
    )
  }

  return (
    <section className="login-prompt">
      <p className="login-prompt-kicker">Your watches</p>
      <h1 className="login-prompt-title">
        Pick up where you <em>left off</em>.
      </h1>
      <p className="login-prompt-body">
        Sign in with your email — we&apos;ll send a one-time login link. No
        passwords. Your watches, alerts, and bookings all live behind it.
      </p>

      <form
        className="login-prompt-form"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <label className="login-prompt-label" htmlFor="login-email">
          Your email
        </label>
        <input
          id="login-email"
          className={`login-prompt-input${
            touched && !isValid && email ? ' login-prompt-input-error' : ''
          }`}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          autoComplete="email"
          required
        />
        {touched && !isValid && email ? (
          <p className="login-prompt-error">Please enter a valid email address.</p>
        ) : null}

        {status === 'error' ? (
          <p className="login-prompt-error" role="alert">
            Something went wrong. Please try again.
          </p>
        ) : null}

        <button
          type="submit"
          className="login-prompt-submit"
          disabled={!isValid || status === 'sending'}
        >
          {status === 'sending' ? 'Sending…' : 'Send login link'}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="login-prompt-footnote">
        New here?{' '}
        <Link href="/watch/new" className="login-prompt-footnote-link">
          Create your first watch
        </Link>{' '}
        — no account required to start.
      </p>
    </section>
  )
}
