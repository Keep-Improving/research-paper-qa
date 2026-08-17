"use client";

import { useLocale } from "./LocaleProvider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div aria-label={t("language.label")} className="language-toggle" role="group">
      <button
        aria-pressed={locale === "zh-CN"}
        className="language-toggle-button"
        onClick={() => setLocale("zh-CN")}
        type="button"
      >
        {t("language.chinese")}
      </button>
      <button
        aria-pressed={locale === "en-US"}
        className="language-toggle-button"
        onClick={() => setLocale("en-US")}
        type="button"
      >
        {t("language.english")}
      </button>
    </div>
  );
}
