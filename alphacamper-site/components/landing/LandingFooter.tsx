import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">Alphacamper</div>
          <p className="footer-tagline">
            Built with love by West Vancouverites who kept losing their campsites.
          </p>
        </div>
        <div className="footer-col">
          <h4>Product</h4>
          <a href="#how-it-works">How It Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#parks">Parks</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <Link href="/about">About</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/reviews">Reviews</Link>
          <Link href="mailto:hello@alphacamper.com">Contact</Link>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Alphacamper</span>
        <span>Made in West Vancouver, BC</span>
      </div>
    </footer>
  )
}
