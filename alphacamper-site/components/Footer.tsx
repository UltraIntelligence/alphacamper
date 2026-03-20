export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-logo">
          <svg viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 4L74 68H6L40 4Z" stroke="currentColor" strokeWidth="5" fill="none" />
            <path d="M40 28L56 60H32L40 28Z" fill="currentColor" opacity="0.5" />
          </svg>
          <span className="footer-copy">© 2026 Alphacamper</span>
        </div>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}
