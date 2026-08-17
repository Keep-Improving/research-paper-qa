"use client";

import Link from "next/link";

import { useLocale } from "./LocaleProvider";

export function PrimaryNav() {
  const { t } = useLocale();

  return (
    <nav aria-label="Primary" className="primary-nav">
      <Link href="/">{t("nav.search")}</Link>
      <Link href="/papers">{t("nav.papers")}</Link>
      <Link href="/questions">{t("nav.questions")}</Link>
      <Link href="/me">{t("nav.my")}</Link>
    </nav>
  );
}
