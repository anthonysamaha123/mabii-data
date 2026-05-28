import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  defaultLocale,
  dirFor,
  getDictionary,
  isLocale,
  locales,
  type Locale,
} from "@/lib/i18n/dictionaries";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { listIndicatorsWithData, getLastFetchedAtForSource } from "@/data/store";
import { sources } from "@/data/catalog/sources";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mabii — Lebanese economic data, sourced",
    template: "%s — Mabii",
  },
  description:
    "Independent, sourced, comparable data on the Lebanese economy. Every value links to its source.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://mabii.org"
  ),
  openGraph: {
    type: "website",
    siteName: "Mabii",
    title: "Mabii — Lebanese economic data, sourced",
    description:
      "Independent, sourced, comparable data on the Lebanese economy. Every value links to its source.",
  },
  robots: { index: true, follow: true },
};

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

const BUILD_VERSION =
  process.env.NEXT_PUBLIC_BUILD_VERSION ?? "v0.1.0-dev";

async function lastSiteRefresh(): Promise<string | undefined> {
  const all = await Promise.all(sources.map((s) => getLastFetchedAtForSource(s.id)));
  const valid = all.filter((s): s is string => Boolean(s));
  if (valid.length === 0) return undefined;
  return valid.sort().slice(-1)[0]?.slice(0, 10);
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;
  const dict = await getDictionary(locale);
  const hdrs = await headers();
  const pathname = hdrs.get("x-mabii-pathname") ?? `/${defaultLocale}`;

  // Ensure the data layer is warm at request time.
  void listIndicatorsWithData();

  const lastRefresh = await lastSiteRefresh();

  return (
    <html lang={locale} dir={dirFor(locale)}>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
        />
      </head>
      <body
        style={{
          fontFamily:
            locale === "ar"
              ? "'Noto Naskh Arabic', var(--font-serif)"
              : "var(--font-serif)",
        }}
      >
        <div className="flex min-h-screen flex-col">
          <SiteHeader locale={locale} dict={dict} pathname={pathname} />
          <main className="flex-1">{children}</main>
          <SiteFooter
            locale={locale}
            dict={dict}
            buildVersion={BUILD_VERSION}
            lastRefresh={lastRefresh}
          />
        </div>
      </body>
    </html>
  );
}
