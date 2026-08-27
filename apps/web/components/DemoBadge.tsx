"use client";

import { useLocale } from "./LocaleProvider";

export function DemoBadge() {
  const { t } = useLocale();
  return <span className="badge badge-demo">{t("common.demo")}</span>;
}
