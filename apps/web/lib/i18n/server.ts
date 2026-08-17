import { cookies, headers } from "next/headers";

import { enUS, type MessageKey } from "./messages/en-US";
import { zhCN } from "./messages/zh-CN";
import { resolveLocale } from "./locale";
import { LOCALE_COOKIE, type Locale } from "./types";

export async function getServerMessages() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const locale = resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: requestHeaders.get("accept-language")
  });
  const messages = locale === "zh-CN" ? zhCN : enUS;

  return {
    locale,
    t: (key: MessageKey) => messages[key]
  };
}

export function messagesForLocale(locale: Locale) {
  return locale === "zh-CN" ? zhCN : enUS;
}
