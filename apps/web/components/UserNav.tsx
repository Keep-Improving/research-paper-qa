"use client";

import Link from "next/link";

type UserNavUser = {
  id: string;
  displayName: string;
  email: string;
  emailVerifiedAt?: Date | string | null;
  emailVerified?: boolean;
  role: string;
};

export function UserNav({ user }: { user: UserNavUser | null }) {
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  if (!user) {
    return (
      <div className="auth-nav">
        <Link href="/login">Sign in</Link>
        <Link href="/register">Register</Link>
      </div>
    );
  }

  return (
    <div className="auth-nav">
      <span>{user.email}</span>
      <span className={`badge ${user.emailVerified || user.emailVerifiedAt ? "badge-author" : "badge-unresolved"}`}>
        {user.emailVerified || user.emailVerifiedAt ? "Email verified" : "Email unverified"}
      </span>
      <button className="button" onClick={signOut} type="button">
        Sign out
      </button>
    </div>
  );
}
