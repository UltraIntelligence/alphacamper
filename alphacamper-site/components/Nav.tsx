"use client";
import { useState } from "react";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav">
      <div className="container">
        <a href="#" className="nav-logo">
          <svg viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 4L74 68H6L40 4Z" stroke="currentColor" strokeWidth="5" fill="none" />
            <path d="M40 28L56 60H32L40 28Z" fill="currentColor" opacity="0.5" />
          </svg>
          Alphacamper
        </a>
        <div className="nav-links">
          <a href="#how">How It Works</a>
          <a href="#features">Features</a>
          <a href="#compare">Compare</a>
        </div>
        <a href="#waitlist" className="nav-cta nav-cta-desktop">
          Join the Waitlist
        </a>
        <button
          className="nav-hamburger"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-line ${open ? "open" : ""}`} />
          <span className={`hamburger-line ${open ? "open" : ""}`} />
          <span className={`hamburger-line ${open ? "open" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="mobile-menu">
          <a href="#how" onClick={() => setOpen(false)}>How It Works</a>
          <a href="#features" onClick={() => setOpen(false)}>Features</a>
          <a href="#compare" onClick={() => setOpen(false)}>Compare</a>
          <a href="#waitlist" className="mobile-cta" onClick={() => setOpen(false)}>
            Join the Waitlist
          </a>
        </div>
      )}
    </nav>
  );
}
