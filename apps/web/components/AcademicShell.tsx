import Link from "next/link";
import type { ReactNode } from "react";

export function AcademicShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            Research Paper Q&A
          </Link>
          <nav aria-label="Primary" className="primary-nav">
            <Link href="/">Search</Link>
            <Link href="/?type=papers">Papers</Link>
            <Link href="/?type=questions">Questions</Link>
            <Link href="/?type=anchors">Anchors</Link>
            <Link href="/author/claims">Author claims</Link>
            <Link href="/author/workbench">Workbench</Link>
            <Link href="/collections">Collections</Link>
            <Link href="/moderation">Moderation</Link>
          </nav>
        </div>
      </header>
      <main className="shell-content">{children}</main>
    </div>
  );
}
