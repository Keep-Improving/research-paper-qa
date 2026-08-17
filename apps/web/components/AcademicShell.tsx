import Link from "next/link";
import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { hashSessionToken, sessionCookieName } from "../lib/auth/sessions";
import { prisma } from "../lib/prisma";
import { UserNav } from "./UserNav";
import { LanguageToggle } from "./LanguageToggle";

export async function AcademicShell({ children }: { children: ReactNode }) {
  const user = await getShellUser();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            Research Paper Q&A
          </Link>
          <nav aria-label="Primary" className="primary-nav">
            <Link href="/">Search</Link>
            <Link href="/papers">Papers</Link>
            <Link href="/questions">Questions</Link>
            <Link href="/anchors">Anchors</Link>
            <Link href="/author/claims">Author claims</Link>
            <Link href="/author/workbench">Workbench</Link>
            <Link href="/collections">Collections</Link>
            <Link href="/moderation">Moderation</Link>
          </nav>
          <UserNav user={user} />
          <LanguageToggle />
        </div>
      </header>
      <main className="shell-content">{children}</main>
    </div>
  );
}

async function getShellUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) {
    return null;
  }

  const session = await prisma.userSession.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          email: true,
          emailVerifiedAt: true,
          role: true
        }
      }
    }
  });

  return session?.user ?? null;
}
