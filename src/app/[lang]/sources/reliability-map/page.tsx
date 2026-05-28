import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/dictionaries";
import { sources } from "@/data/catalog/sources";
import { indicatorsForSource } from "@/data/queries";
import { SourceStatusBadge } from "@/components/source-status-badge";

export const metadata = {
  title: "Lebanon — Data Reliability Map",
  description:
    "Every Lebanese economic data source Mabii tracks: who publishes it, how, how often, and where we stand on ingesting it.",
};

const headings: Record<
  Locale,
  {
    title: string;
    intro: string;
    counts_heading: string;
    tier_titles: Record<string, string>;
    tier_subs: Record<string, string>;
    cols: { source: string; publisher: string; cadence: string; access: string; license: string; status: string; mapped: string };
  }
> = {
  en: {
    title: "Lebanon — Data Reliability Map",
    intro:
      "Every Lebanese economic data source we track, scored honestly on access, cadence, and where Mabii stands on ingesting it. This is curation, not aggregation: many of these sources are not yet flowing into the catalogue, and the page says so — instead of pretending they are.",
    counts_heading: "By the numbers",
    tier_titles: {
      T1: "T1 — Open APIs (the reliable spine)",
      T2: "T2 — Scrape / PDF (the differentiator)",
      T3: "T3 — Manual / licensed (deferred; substitutes used)",
      T4: "T4 — Reference / intelligence (often stale)",
      T5: "T5 — Digital / social (high-frequency edge)",
    },
    tier_subs: {
      T1: "Free, structured, machine-readable. Connectors here are the lowest-risk and the first to ship.",
      T2: "Free to read but published as PDF or scattered HTML. Each one needs human-reviewed onboarding before going live.",
      T3: "Paid subscriptions. Deferred in v1; for each one Mabii either generates the equivalent itself or substitutes a free multilateral source.",
      T4: "Public-domain reference material. Often years behind. Used for structural baseline, never for current numbers.",
      T5: "Web-derived and high-frequency signals. Carefully fenced — surfaced as 'modeled' trust, never as 'official'.",
    },
    cols: {
      source: "Source",
      publisher: "Publisher",
      cadence: "Cadence",
      access: "Access",
      license: "License",
      status: "Status",
      mapped: "Indicators",
    },
  },
  ar: {
    title: "خريطة موثوقية بيانات لبنان",
    intro:
      "كل مصدر بيانات اقتصادي لبناني نتتبّعه، مُصنَّف بأمانة بحسب سهولة الوصول والدورية وموقع مَبني من إلحاقه. هذه صفحة تنسيق لا تجميع: كثير من هذه المصادر لم يدخل بعد إلى الكتالوج، وتقول الصفحة ذلك بدلاً من ادّعاء خلاف الواقع.",
    counts_heading: "بالأرقام",
    tier_titles: {
      T1: "T1 — واجهات برمجية مفتوحة (العمود الفقري الموثوق)",
      T2: "T2 — كَشط / PDF (الميزة التنافسية)",
      T3: "T3 — يدوي / مدفوع (مؤجَّل؛ تُستخدم بدائل)",
      T4: "T4 — مرجعي / استخباري (غالباً قديم)",
      T5: "T5 — رقمي / اجتماعي (تواتر مرتفع)",
    },
    tier_subs: {
      T1: "مجاني ومنظَّم وقابل للقراءة آلياً. موصِلاته أقلّ مخاطرة وأوّل ما يُشحَن.",
      T2: "مجاني للقراءة لكنّه يُنشَر بصيغة PDF أو HTML مبعثَر. كلّ مصدر يحتاج إلى إلحاق مُراجَع بشرياً قبل التشغيل.",
      T3: "اشتراكات مدفوعة. مؤجَّلة في النسخة 1؛ تُولّد مَبني المكافئ بنفسها أو تستعيض بمصدر دولي مجاني.",
      T4: "مواد مرجعية من النطاق العام. غالباً متأخّرة سنوات. تُستخدم للقاعدة البنيوية لا للأرقام الجارية.",
      T5: "إشارات رقمية عالية التواتر. تُحاط بضوابط — تُعرَض بثقة ‘نموذجية’ لا ‘رسمية’.",
    },
    cols: {
      source: "المصدر",
      publisher: "الناشر",
      cadence: "الدورية",
      access: "الوصول",
      license: "الترخيص",
      status: "الحالة",
      mapped: "المؤشرات",
    },
  },
};

const accessByStatus: Record<string, string> = {
  live: "API",
  scrape_needed: "Scrape",
  pdf_ai_needed: "PDF",
  geospatial_needed: "Raster",
  partnership_needed: "Apply",
  deferred: "Paid",
  planned: "—",
};

export default async function ReliabilityMapPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = headings[lang];

  const counts = {
    total: sources.length,
    live: sources.filter((s) => s.ingestion_status === "live").length,
    pending: sources.filter((s) =>
      ["scrape_needed", "pdf_ai_needed", "geospatial_needed", "partnership_needed", "planned"].includes(
        s.ingestion_status
      )
    ).length,
    deferred: sources.filter((s) => s.ingestion_status === "deferred").length,
  };

  const tierOrder = ["T1", "T2", "T3", "T4", "T5"] as const;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 max-w-3xl">
        <h1 className="mb-4 text-3xl md:text-4xl" style={{ fontWeight: 600, lineHeight: 1.2 }}>
          {c.title}
        </h1>
        <p style={{ color: "var(--color-ink-soft)", lineHeight: 1.7 }}>{c.intro}</p>
      </header>

      <section
        className="mb-12 grid gap-4 border-t border-b py-6 sm:grid-cols-4"
        style={{ borderColor: "var(--color-rule)", fontFamily: "var(--font-sans)" }}
      >
        <Stat label={lang === "ar" ? "إجمالي المصادر" : "Sources tracked"} value={counts.total} />
        <Stat label={lang === "ar" ? "حيّة الآن" : "Live now"} value={counts.live} accent />
        <Stat label={lang === "ar" ? "قيد البناء" : "In build"} value={counts.pending} />
        <Stat label={lang === "ar" ? "مؤجَّلة" : "Deferred (paid)"} value={counts.deferred} />
      </section>

      {tierOrder.map((tier) => {
        const tierSources = sources.filter((s) => s.tier === tier);
        if (tierSources.length === 0) return null;
        return (
          <section key={tier} className="mb-12">
            <h2 className="mb-1 text-xl" style={{ fontWeight: 600 }}>
              {c.tier_titles[tier]}
            </h2>
            <p
              className="mb-4 text-sm"
              style={{ color: "var(--color-ink-soft)", lineHeight: 1.6 }}
            >
              {c.tier_subs[tier]}
            </p>
            <div
              className="overflow-x-auto border"
              style={{
                borderColor: "var(--color-rule)",
                background: "var(--color-bg-elev)",
              }}
            >
              <table>
                <thead>
                  <tr>
                    <th>{c.cols.source}</th>
                    <th>{c.cols.publisher}</th>
                    <th>{c.cols.cadence}</th>
                    <th>{c.cols.access}</th>
                    <th>{c.cols.license}</th>
                    <th>{c.cols.status}</th>
                    <th className="num">{c.cols.mapped}</th>
                  </tr>
                </thead>
                <tbody>
                  {tierSources.map((s) => {
                    const mapped = indicatorsForSource(s.id).length;
                    return (
                      <tr key={s.id}>
                        <td>
                          <Link
                            href={`/${lang}/sources/${s.id}`}
                            className="no-underline"
                            style={{
                              color: "var(--color-ink)",
                              fontWeight: 500,
                            }}
                          >
                            {lang === "ar" ? s.name_ar : s.name_en}
                          </Link>
                        </td>
                        <td
                          style={{
                            color: "var(--color-ink-soft)",
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          {lang === "ar" ? s.publisher_ar : s.publisher_en}
                        </td>
                        <td
                          style={{
                            color: "var(--color-ink-soft)",
                            fontFamily: "var(--font-sans)",
                            fontSize: 12,
                          }}
                        >
                          {lang === "ar" ? s.cadence_ar : s.cadence_en}
                        </td>
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--color-ink-mute)",
                          }}
                        >
                          {accessByStatus[s.ingestion_status]}
                        </td>
                        <td
                          className="text-xs"
                          style={{
                            color: "var(--color-ink-mute)",
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          {s.license}
                        </td>
                        <td>
                          <SourceStatusBadge status={s.ingestion_status} lang={lang} />
                          {s.planned_phase !== undefined && s.ingestion_status !== "live" && (
                            <span
                              className="ms-1 text-[10px]"
                              style={{
                                color: "var(--color-ink-mute)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              Phase {s.planned_phase}
                            </span>
                          )}
                        </td>
                        <td className="num">{mapped}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className="text-3xl"
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 600,
          color: accent ? "var(--color-flag-ok)" : "var(--color-ink)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        className="text-xs uppercase tracking-wider"
        style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
      >
        {label}
      </div>
    </div>
  );
}
