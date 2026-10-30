import Link from "next/link";
import { LogoMark } from "./Logo";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="LASTLINE home">
          <LogoMark />
          <span>LASTLINE</span>
        </Link>
        <nav aria-label="Primary">
          <Link href="/#how">How it works</Link>
          <Link href="/#live">Live board</Link>
          <Link href="/explore">Explore</Link>
          <Link href="/report" className="button button-small">Report a problem</Link>
        </nav>
      </div>
    </header>
  );
}
