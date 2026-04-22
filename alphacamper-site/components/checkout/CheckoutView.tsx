'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { storeMagicLinkEmail, validateEmail } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'

type CheckoutProduct = 'summer' | 'year'
type AuthState = 'checking' | 'guest' | 'user'

interface ProductMeta {
  headline: string
  price: string
  cadence: string
  period: string
  bullets: readonly string[]
}

const PRODUCTS: Record<CheckoutProduct, ProductMeta> = {
  summer: {
    headline: 'Summer pass',
    price: '$29',
    cadence: 'one-time',
    period: 'May – October 2026',
    bullets: [
      'Unlimited watches across every Canadian + US park we support',
      'SMS the second your site opens',
      'Extension autofills your booking in ~10 seconds',
      '30-day refund if we don’t book you a site',
    ],
  },
  year: {
    headline: 'Year pass',
    price: '$49',
    cadence: 'one-time',
    period: 'All of 2026',
    bullets: [
      'Everything in the summer pass',
      'Off-season watches for December + spring booking windows',
      'Priority queue on new parks we add during the year',
      '30-day refund if we don’t book you a site',
    ],
  },
}

interface CheckoutViewProps {
  product: CheckoutProduct
  canceled: boolean
}

export function CheckoutView({ product, canceled }: CheckoutViewProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'redirecting' | 'error'>(
    'idle',
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const meta = PRODUCTS[product]
  const other: CheckoutProduct = product === 'summer' ? 'year' : 'summer'
  const otherMeta = PRODUCTS[other]

  useEffect(() => {
    let active = true
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!active) return
        setAuthState(data.session ? 'user' : 'guest')
      })
      .catch(() => {
        if (!active) return
        setAuthState('guest')
      })
    return () => {
      active = false
    }
  }, [])

  const emailValid = useMemo(() => validateEmail(email), [email])

  const handleMagicLink = useCallback(async () => {
    if (!emailValid || status === 'sending') return
    setStatus('sending')
    setErrorMessage(null)
    try {
      storeMagicLinkEmail(email)
      const supabase = getSupabase()
      const redirectTo = `${window.location.origin}/checkout?product=${product}`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })
      if (error) throw error
      setStatus('sent')
    } catch (err) {
      console.error('[checkout] magic link failed', err)
      setErrorMessage('We couldn’t send a login link. Please try again.')
      setStatus('error')
    }
  }, [email, emailValid, product, status])

  const handleConfirm = useCallback(async () => {
    if (status === 'redirecting') return
    setStatus('redirecting')
    setErrorMessage(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || `Checkout failed (${res.status})`)
      }
      window.location.href = data.url
    } catch (err) {
      console.error('[checkout] confirm failed', err)
      setErrorMessage(
        err instanceof Error ? err.message : 'We couldn’t start checkout. Please try again.',
      )
      setStatus('error')
    }
  }, [product, status])

  const handleSwitchProduct = useCallback(() => {
    const next = new URLSearchParams(params?.toString() ?? '')
    next.set('product', other)
    next.delete('canceled')
    router.replace(`/checkout?${next.toString()}`)
    setStatus('idle')
    setErrorMessage(null)
  }, [other, params, router])

  return (
    <main className="checkout-shell">
      <div className="checkout-inner">
        <Link href="/" className="checkout-back">
          ← Alphacamper
        </Link>

        {canceled ? (
          <div className="checkout-banner" role="status">
            <strong>Welcome back.</strong> No charge yet — pick up where you left off below.
          </div>
        ) : null}

        <p className="checkout-eyebrow">Confirm your pass</p>
        <h1 className="checkout-title">
          One step from <em>us getting you</em> the campsite.
        </h1>
        <p className="checkout-lede">
          We watch your park around the clock, text you the second your site opens, and autofill
          your booking in your browser. You pay once, book all season.
        </p>

        <section className="checkout-card" aria-labelledby="pass-headline">
          <header className="checkout-card-head">
            <div>
              <p className="checkout-card-kicker">{meta.cadence}</p>
              <h2 id="pass-headline" className="checkout-card-title">
                {meta.headline}
              </h2>
              <p className="checkout-card-period">{meta.period}</p>
            </div>
            <div className="checkout-card-price">
              <span className="checkout-card-price-value">{meta.price}</span>
              <span className="checkout-card-price-unit">USD</span>
            </div>
          </header>

          <ul className="checkout-card-list">
            {meta.bullets.map((bullet) => (
              <li key={bullet}>
                <span className="checkout-card-bullet" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M11.5 4L5.5 10L2.5 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {bullet}
              </li>
            ))}
          </ul>

          {authState === 'user' ? (
            <>
              <button
                type="button"
                className="checkout-confirm"
                onClick={handleConfirm}
                disabled={status === 'redirecting'}
              >
                {status === 'redirecting' ? 'Opening Stripe…' : `Pay ${meta.price} — start watching`}
                <span className="checkout-confirm-icon" aria-hidden="true">→</span>
              </button>
              <p className="checkout-trust">
                Secure checkout on Stripe. 30-day refund if we don’t book you a site.
              </p>
            </>
          ) : authState === 'guest' ? (
            <form
              className="checkout-magic"
              onSubmit={(e) => {
                e.preventDefault()
                handleMagicLink()
              }}
            >
              {status === 'sent' ? (
                <div className="checkout-magic-sent">
                  <p className="checkout-magic-sent-title">Check your email</p>
                  <p className="checkout-magic-sent-body">
                    We sent a login link to <strong>{email}</strong>. Open it to finish checkout.
                  </p>
                </div>
              ) : (
                <>
                  <label className="checkout-magic-label" htmlFor="checkout-email">
                    Your email
                  </label>
                  <div className="checkout-magic-row">
                    <input
                      id="checkout-email"
                      type="email"
                      className={`checkout-magic-input${
                        emailTouched && !emailValid && email ? ' checkout-magic-input-error' : ''
                      }`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      autoComplete="email"
                      required
                    />
                    <button
                      type="submit"
                      className="checkout-confirm checkout-confirm-magic"
                      disabled={!emailValid || status === 'sending'}
                    >
                      {status === 'sending' ? 'Sending…' : 'Send login link'}
                    </button>
                  </div>
                  <p className="checkout-trust">
                    We send a one-time link — no passwords. Your card is charged on the next
                    screen after you click it.
                  </p>
                </>
              )}
            </form>
          ) : (
            <div className="checkout-skeleton" aria-hidden="true" />
          )}

          {errorMessage ? (
            <p className="checkout-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </section>

        <div className="checkout-switch">
          <button type="button" onClick={handleSwitchProduct} className="checkout-switch-link">
            Prefer the {otherMeta.headline.toLowerCase()}?{' '}
            <span className="checkout-switch-price">{otherMeta.price}</span>{' '}
            <span className="checkout-switch-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </main>
  )
}
