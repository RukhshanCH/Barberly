export function Footer() {
  return (
    <footer className="footer">
      <div className="l-container footer__inner">
        <span>Barberly &mdash; find a chair, on time.</span>
        <span>&copy; {new Date().getFullYear()} Barberly</span>
      </div>
    </footer>
  );
}
