'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })
  }, [])

  const links = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Parks', href: '#parks' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <nav className="landing-nav">
      <div className="container">
        <Link href="/" className="landing-nav-logo">
          Alphacamper
        </Link>

        <div className="landing-nav-links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </div>

        <div className="landing-nav-right">
          <Link href="/dashboard" className="landing-nav-signin">
            {isLoggedIn ? 'Dashboard' : 'Sign in'}
          </Link>
          <Link href="/watch/new" className="landing-nav-cta">
            Watch a Campsite
          </Link>
        </div>

        <button
          className="landing-nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span className="landing-hamburger-line" />
          <span className="landing-hamburger-line" />
          <span className="landing-hamburger-line" />
        </button>
      </div>

      {menuOpen && (
        <div className="landing-mobile-menu">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
            {isLoggedIn ? 'Dashboard' : 'Sign in'}
          </Link>
          <Link
            href="/watch/new"
            className="landing-nav-cta"
            style={{ marginTop: 8, textAlign: 'center' }}
            onClick={() => setMenuOpen(false)}
          >
            Watch a Campsite
          </Link>
        </div>
      )}
    </nav>
  )
}
