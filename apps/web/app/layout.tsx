import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import "./globals.css";

import { resolveLocale } from "../lib/i18n/locale";
import { LOCALE_COOKIE } from "../lib/i18n/types";
import { LocaleProvider } from "../components/LocaleProvider";

export const metadata: Metadata = {
  title: "Research Paper Q&A",
  description: "Scholarly discussion linked to research papers."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <RootLayoutContent>{children}</RootLayoutContent>;
}

async function RootLayoutContent({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const locale = resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: requestHeaders.get("accept-language")
  });

  return (
    <html lang={locale}>
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
