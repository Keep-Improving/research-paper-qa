"use client";

import { useEffect, useState } from "react";

import type { MessageKey } from "../lib/i18n/messages/en-US";
import { useLocale } from "./LocaleProvider";

export function InlineHint({ storageKey, messageKey }: { storageKey: string; messageKey: MessageKey }) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(storageKey) !== "dismissed");
  }, [storageKey]);

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
          setVisible(false);
        }}
        type="button"
      >
        {t("common.close")}
      </button>
    </div>
  );
}
