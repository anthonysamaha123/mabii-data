import Link from "next/link";
import type { Locale, Dictionary } from "@/lib/i18n/dictionaries";
import { LocaleSwitcher } from "./locale-switcher";

export function SiteHeader({
  locale,
  dict,
  pathname,
}: {
  locale: Locale;
  dict: Dictionary;
  pathname: string;
}) {
  const navItems: Array<{ href: string; label: string; cta?: boolean }> = [
    { href: `/${locale}/indicators`, label: dict.nav.data },
    { href: `/${locale}/topics`, label: dict.nav.topics },
    { href: `/${locale}/sources`, label: dict.nav.sources },
    { href: `/${locale}/methodology`, label: dict.nav.methodology },
    { href: `/${locale}/api`, label: dict.nav.api },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/contribute`, label: dict.nav.contribute, cta: true },
  ];

  return (
    <header
      className="border-b"
      style={{ borderColor: "var(--color-rule)", background: "var(--color-bg-elev)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
        <Link
          href={`/${locale}`}
          className="flex items-baseline gap-3 no-underline"
          style={{ color: "var(--color-ink)" }}
        >
          <span
            className="text-xl"
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {dict.site.name}
          </span>
          <span
            className="hidden text-xs md:inline"
            style={{ color: "var(--color-ink-mute)", fontFamily: "var(--font-sans)" }}
          >
            {dict.site.tagline}
          </span>
        </Link>
        <nav
          className="flex items-center gap-1 text-sm"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            if (item.cta) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="ml-1 px-3 py-1.5 no-underline"
                  style={{
                    background: active ? "var(--color-accent-soft)" : "var(--color-accent)",
                    color: "#fff",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-2.5 py-1.5 no-underline"
                style={{
                  color: active ? "var(--color-accent)" : "var(--color-ink-soft)",
                  borderBottom: active
                    ? "1.5px solid var(--color-accent)"
                    : "1.5px solid transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="mx-2" style={{ color: "var(--color-rule)" }}>|</span>
          <LocaleSwitcher locale={locale} pathname={pathname} />
        </nav>
      </div>
    </header>
  );
}
