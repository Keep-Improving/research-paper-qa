"use client";

import Link from "next/link";

import { useLocale } from "./LocaleProvider";

type UserNavUser = {
  id: string;
  displayName: string;
  email: string;
  emailVerifiedAt?: Date | string | null;
  emailVerified?: boolean;
  role: string;
};

export function UserNav({ user }: { user: UserNavUser | null }) {
  const { t } = useLocale();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  if (!user) {
    return (
      <div className="auth-nav">
        <Link href="/login">{t("auth.signIn")}</Link>
        <Link href="/register">{t("auth.register")}</Link>
      </div>
    );
  }

  return (
    <div className="auth-nav">
      <span>{user.email}</span>
      <span className={`badge ${user.emailVerified || user.emailVerifiedAt ? "badge-author" : "badge-unresolved"}`}>
        {user.emailVerified || user.emailVerifiedAt ? t("auth.emailVerified") : t("auth.emailUnverified")}
      </span>
      <button className="button" onClick={signOut} type="button">
        {t("auth.signOut")}
      </button>
    </div>
  );
}
