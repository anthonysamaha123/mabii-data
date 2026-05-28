import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import {
  filterIndicatorsByFacets,
  facetsAvailableForBrowse,
  uniqueFacetValues,
  getSource,
  type FacetFilter,
} from "@/data/queries";
import { facetLabel } from "@/data/catalog/facet-vocabulary";
import { getLatestObservation } from "@/data/store";
import { formatNumber, formatYear } from "@/lib/format";

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = { title: "Browse" };

export default async function BrowsePage({ params, searchParams }: PageProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const sp = await searchParams;

  const facetTypes = facetsAvailableForBrowse();
  const filters: FacetFilter[] = [];
  for (const ft of facetTypes) {
    const raw = sp[ft];
    if (typeof raw === "string" && raw.length > 0) {
      filters.push({ facet_type: ft, facet_value: raw });
    }
  }

  const filtered = filterIndicatorsByFacets(filters);

  const rows = await Promise.all(
    filtered.map(async (ind) => {
      const latest = await getLatestObservation(ind.code, ind.primary_source_id);
      const source = latest ? getSource(latest.source_id) : undefined;
      return { ind, latest, source };
    })
  );

  function urlWithFacet(ft: string, fv: string) {
    const next = new URLSearchParams();
    for (const f of filters) {
      if (f.facet_type !== ft) next.set(f.facet_type, f.facet_value);
    }
    next.set(ft, fv);
    return `/${lang}/browse?${next.toString()}`;
  }
  function urlWithoutFacet(ft: string) {
    const next = new URLSearchParams();
    for (const f of filters) {
      if (f.facet_type !== ft) next.set(f.facet_type, f.facet_value);
    }
    const q = next.toString();
    return `/${lang}/browse${q ? `?${q}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-3xl" style={{ fontWeight: 600 }}>
        {dict.browse.heading}
      </h1>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside style={{ fontFamily: "var(--font-sans)" }}>
          {facetTypes.map((ft) => {
            const values = uniqueFacetValues(ft);
            const active = filters.find((f) => f.facet_type === ft);
            return (
              <div key={ft} className="mb-5">
                <h3
                  className="mb-2 text-xs uppercase tracking-wider"
                  style={{
                    color: "var(--color-ink-mute)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {ft.replace(/_/g, " ")}
                </h3>
                <ul className="space-y-1 text-sm">
                  {values.map((v) => {
                    const isActive = active?.facet_value === v;
                    const href = isActive
                      ? urlWithoutFacet(ft)
                      : urlWithFacet(ft, v);
                    return (
                      <li key={v}>
                        <Link
                          href={href}
                          className="no-underline"
                          style={{
                            color: isActive
                              ? "var(--color-accent)"
                              : "var(--color-ink)",
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {isActive ? "× " : ""}
                          {facetLabel(ft, v, lang)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          {filters.length > 0 && (
            <Link
              href={`/${lang}/browse`}
              className="text-xs no-underline"
              style={{ color: "var(--color-flag-stale)" }}
            >
              {dict.browse.clear} ({filters.length})
            </Link>
          )}
        </aside>

        <section>
          <div
            className="mb-3 text-xs"
            style={{
              color: "var(--color-ink-mute)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {dict.browse.results}: {rows.length}
          </div>
          {rows.length === 0 ? (
            <p
              className="border-l-2 pl-3"
              style={{
                borderColor: "var(--color-flag-stale)",
                color: "var(--color-ink-soft)",
                lineHeight: 1.6,
              }}
            >
              {dict.browse.no_results}
            </p>
          ) : (
            <div
              className="overflow-hidden border"
              style={{
                borderColor: "var(--color-rule)",
                background: "var(--color-bg-elev)",
              }}
            >
              <table>
                <thead>
                  <tr>
                    <th>Indicator</th>
                    <th className="num">Latest</th>
                    <th>Period</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ ind, latest, source }) => (
                    <tr key={ind.code}>
                      <td>
                        <Link
                          href={`/${lang}/indicators/${ind.code}`}
                          className="no-underline"
                          style={{
                            color: "var(--color-ink)",
                            fontWeight: 500,
                          }}
                        >
                          {lang === "ar" ? ind.name_ar : ind.name_en}
                        </Link>
                      </td>
                      <td className="num">
                        {latest
                          ? formatNumber(latest.value, ind.default_unit, lang)
                          : "—"}
                      </td>
                      <td style={{ color: "var(--color-ink-soft)" }}>
                        {latest ? formatYear(latest.period_end) : "—"}
                      </td>
                      <td style={{ color: "var(--color-ink-soft)" }}>
                        {source
                          ? lang === "ar"
                            ? source.name_ar
                            : source.name_en
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
