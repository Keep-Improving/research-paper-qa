"use client";

import Link from "next/link";
import { useState } from "react";

import { useLocale } from "./LocaleProvider";

type MoreNavUser = { role: string } | null;

export function MoreNav({ user }: { user: MoreNavUser }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const canAuthor = user?.role === "researcher" || user?.role === "admin";
  const canModerate = user?.role === "admin";

  return (
    <div className="more-nav">
      <button
        aria-expanded={open}
        className="more-nav-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {t("nav.more")}
      </button>
      {open ? (
        <div className="more-nav-menu">
          <Link href="/anchors" onClick={() => setOpen(false)}>{t("nav.anchors")}</Link>
          {canAuthor ? <Link href="/author/claims" onClick={() => setOpen(false)}>{t("nav.authorClaims")}</Link> : null}
          {canAuthor ? <Link href="/author/workbench" onClick={() => setOpen(false)}>{t("nav.authorWorkbench")}</Link> : null}
          {canModerate ? <Link href="/moderation" onClick={() => setOpen(false)}>{t("nav.moderation")}</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
