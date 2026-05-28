import Link from "next/link";
import type { Locale, Dictionary } from "@/lib/i18n/dictionaries";

export function SiteFooter({
  locale,
  dict,
  buildVersion,
  lastRefresh,
}: {
  locale: Locale;
  dict: Dictionary;
  buildVersion: string;
  lastRefresh: string | undefined;
}) {
  const cols: Array<{ heading: string; items: Array<{ href: string; label: string }> }> = [
    {
      heading: dict.footer.data,
      items: [
        { href: `/${locale}/indicators`, label: dict.footer.data_all },
        { href: `/${locale}/sources`, label: dict.footer.data_sources },
        { href: `/${locale}/topics`, label: dict.footer.data_topics },
        { href: `/${locale}/browse`, label: dict.footer.data_downloads },
      ],
    },
    {
      heading: dict.footer.methodology,
      items: [
        {
          href: `/${locale}/methodology/accuracy-standard`,
          label: dict.footer.methodology_standards,
        },
        {
          href: `/${locale}/methodology/facet-vocabulary`,
          label: dict.footer.methodology_facets,
        },
        { href: `/${locale}/methodology`, label: dict.footer.methodology_trust },
      ],
    },
    {
      heading: dict.footer.about,
      items: [
        { href: `/${locale}/about`, label: dict.footer.about_us },
        { href: `/${locale}/funding`, label: dict.footer.about_funding },
        { href: `/${locale}/status`, label: dict.footer.about_status },
        { href: `/${locale}/changelog`, label: dict.footer.about_changelog },
      ],
    },
    {
      heading: dict.footer.tech,
      items: [
        { href: `/${locale}/api`, label: dict.footer.tech_api },
        { href: "https://creativecommons.org/licenses/by/4.0/", label: dict.footer.tech_license },
      ],
    },
  ];

  return (
    <footer
      className="mt-16 border-t"
      style={{
        borderColor: "var(--color-rule)",
        background: "var(--color-bg-elev)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {cols.map((col) => (
            <div key={col.heading}>
              <h4
                className="mb-3 text-xs uppercase tracking-wider"
                style={{ color: "var(--color-ink-soft)", letterSpacing: "0.05em" }}
              >
                {col.heading}
              </h4>
              <ul className="space-y-1.5 text-sm">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="no-underline"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="mt-8 border-t pt-6 text-xs"
          style={{
            borderColor: "var(--color-rule-soft)",
            color: "var(--color-ink-mute)",
          }}
        >
          <p className="mb-1">{dict.footer.legal}</p>
          <p className="mb-3">{dict.footer.license_short}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {dict.footer.tech_version}: <code>{buildVersion}</code>
            </span>
            <span>
              {dict.footer.tech_refreshed}:{" "}
              <code>{lastRefresh ?? "—"}</code>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
