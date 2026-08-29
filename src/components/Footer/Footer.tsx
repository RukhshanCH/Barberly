import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="l-container footer__inner">
        <span>Barberly &mdash; find a chair, on time.</span>

        <nav className="l-row l-row--wrap" aria-label="Footer">
          <Link href="/terms" className="navbar__link">
            Terms
          </Link>
          <Link href="/privacy" className="navbar__link">
            Privacy
          </Link>
          <Link href="/refund-policy" className="navbar__link">
            Refund &amp; Cancellation
          </Link>
          <Link href="/contact" className="navbar__link">
            Contact
          </Link>
        </nav>

        <span>&copy; {new Date().getFullYear()} Barberly</span>
      </div>
    </footer>
  );
}
