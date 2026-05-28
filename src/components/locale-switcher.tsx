"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LocaleSwitcher({
  locale,
  pathname,
}: {
  locale: Locale;
  pathname: string;
}) {
  const target: Locale = locale === "en" ? "ar" : "en";
  const rest = pathname.replace(/^\/(en|ar)(?=\/|$)/, "");
  const href = `/${target}${rest || ""}` as const;
  const label = target === "ar" ? "العربية" : "English";

  return (
    <Link
      href={href}
      className="px-2.5 py-1.5 no-underline"
      style={{
        color: "var(--color-ink-soft)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {label}
    </Link>
  );
}
