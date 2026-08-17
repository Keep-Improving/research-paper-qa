"use client";

import { useSyncExternalStore } from "react";

import type { MessageKey } from "../lib/i18n/messages/en-US";
import { useLocale } from "./LocaleProvider";

export function InlineHint({ storageKey, messageKey }: { storageKey: string; messageKey: MessageKey }) {
  const { t } = useLocale();
  const visible = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("paperqa-hint-change", onStoreChange);
      return () => window.removeEventListener("paperqa-hint-change", onStoreChange);
    },
    () => window.localStorage.getItem(storageKey) !== "dismissed",
    () => false
  );

  if (!visible) {
    return null;
  }

  return (
    <div className="inline-hint" role="note">
      <p>{t(messageKey)}</p>
      <button
        aria-label={t("hint.dismiss")}
        className="inline-hint-dismiss"
        onClick={() => {
          window.localStorage.setItem(storageKey, "dismissed");
          window.dispatchEvent(new Event("paperqa-hint-change"));
        }}
        type="button"
      >
        {t("common.close")}
      </button>
    </div>
  );
}
