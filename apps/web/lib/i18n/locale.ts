import { DEFAULT_LOCALE, type Locale } from "./types";

export type LocaleInput = {
  cookie: string | null | undefined;
  acceptLanguage: string | null | undefined;
};

function isLocale(value: string | null | undefined): value is Locale {
  return value === "zh-CN" || value === "en-US";
}

export function resolveLocale({ cookie, acceptLanguage }: LocaleInput): Locale {
  if (isLocale(cookie)) {
    return cookie;
  }

  const languages = (acceptLanguage ?? "")
    .split(",")
    .map((item) => item.split(";", 1)[0]?.trim().toLowerCase())
    .filter(Boolean);

  if (languages.some((language) => language === "zh" || language?.startsWith("zh-"))) {
    return "zh-CN";
  }

  return DEFAULT_LOCALE;
}
