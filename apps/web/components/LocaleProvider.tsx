"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { enUS, type MessageKey } from "../lib/i18n/messages/en-US";
import { zhCN } from "../lib/i18n/messages/zh-CN";
import { LOCALE_COOKIE, type Locale } from "../lib/i18n/types";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const fallbackLocaleContext: LocaleContextValue = {
  locale: "en-US",
  setLocale: () => undefined,
  t: (key) => enUS[key]
};

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);

  const value = useMemo<LocaleContextValue>(() => {
    const messages = locale === "zh-CN" ? zhCN : enUS;

    return {
      locale,
      setLocale(nextLocale) {
        setLocaleState(nextLocale);
        document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
        router.refresh();
      },
      t: (key) => messages[key]
    };
  }, [locale, router]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  return context ?? fallbackLocaleContext;
}
