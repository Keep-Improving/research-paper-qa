"use client";

import { useSidebarLocale } from "./sidebarLocale";

export function LanguageToggle() {
  const { locale, setLocale, t } = useSidebarLocale();

  return (
    <div aria-label={t("language.label")} role="group" style={styles.toggle}>
      <button
        type="button"
        aria-pressed={locale === "zh-CN"}
        onClick={() => setLocale("zh-CN")}
        style={locale === "zh-CN" ? styles.active : styles.button}
      >
        {t("language.chinese")}
      </button>
      <button
        type="button"
        aria-pressed={locale === "en-US"}
        onClick={() => setLocale("en-US")}
        style={locale === "en-US" ? styles.active : styles.button}
      >
        {t("language.english")}
      </button>
    </div>
  );
}

const styles = {
  toggle: {
    display: "inline-flex",
    border: "1px solid #b9bdb8",
    borderRadius: 999,
    overflow: "hidden" as const,
    background: "#ffffff"
  },
  button: {
    border: 0,
    background: "transparent",
    color: "#4d554e",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: "24px",
    minWidth: 34,
    padding: "0 8px"
  },
  active: {
    border: 0,
    background: "#2f3a3f",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: "24px",
    minWidth: 34,
    padding: "0 8px"
  }
};
