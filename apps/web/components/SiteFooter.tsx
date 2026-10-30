import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <strong>LASTLINE</strong>
          <p>Critical-service access reporting. A hackathon prototype built on official public data, human review, and open NVIDIA models.</p>
        </div>
        <div>
          <strong>Explore</strong>
          <p><Link href="/report">Report a problem</Link></p>
          <p><Link href="/explore">Public incidents</Link></p>
          <p><Link href="/operations">Coordinator view</Link></p>
        </div>
        <div className="footer-alert" role="note">
          <strong>In an emergency, call your local emergency number.</strong>
          <p>LASTLINE is not an emergency service, is not monitored around the clock, and gives no medical advice.</p>
        </div>
      </div>
    </footer>
  );
}
