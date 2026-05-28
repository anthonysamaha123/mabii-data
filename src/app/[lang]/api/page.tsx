import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/dictionaries";

export const metadata = { title: "API" };

const sections: Record<
  Locale,
  { title: string; intro: string; endpoints: Array<{ method: string; path: string; desc: string }>; example_heading: string; example_body: string }
> = {
  en: {
    title: "Open API",
    intro:
      "The Mabii API is free, read-only, and OpenAPI-described. Every response carries the same provenance metadata as the site — source, raw_ref, vintage, fetched_at, trust_label.",
    endpoints: [
      { method: "GET", path: "/api/v1/indicators", desc: "List the catalogue." },
      { method: "GET", path: "/api/v1/indicators/{code}", desc: "One indicator, with all of its observations and per-source provenance." },
      { method: "GET", path: "/api/v1/observations?topic=…&subtopic=…&source=…", desc: "Faceted query over the catalogue. AND across facet filters, deterministic SQL join." },
      { method: "GET", path: "/api/v1/sources", desc: "Every source Mabii pulls from, with cadence and license." },
      { method: "GET", path: "/api/v1/topics", desc: "Topic facet values currently in use." },
    ],
    example_heading: "Example",
    example_body:
      "curl https://mabii.org/api/v1/indicators/mabii.macro.gdp_nominal_usd",
  },
  ar: {
    title: "الواجهة البرمجية المفتوحة",
    intro:
      "واجهة مَبني البرمجية مجانية وللقراءة فقط وموصوفة وفق OpenAPI. تَحمل كل استجابة البيانات الوصفية للمرجعية كما الموقع — المصدر، المرجع الخام، تاريخ النشر، تاريخ السحب، تصنيف الثقة.",
    endpoints: [
      { method: "GET", path: "/api/v1/indicators", desc: "قائمة الكتالوج." },
      { method: "GET", path: "/api/v1/indicators/{code}", desc: "مؤشر واحد مع كل ملاحظاته والمرجعية حسب المصدر." },
      { method: "GET", path: "/api/v1/observations?topic=…&subtopic=…&source=…", desc: "استعلام مُصنَّف على الكتالوج. AND بين الفلاتر، ضمّ SQL صارم." },
      { method: "GET", path: "/api/v1/sources", desc: "جميع المصادر التي تسحب منها مَبني، مع الدورية والترخيص." },
      { method: "GET", path: "/api/v1/topics", desc: "قيم تصنيف المواضيع المستخدمة حالياً." },
    ],
    example_heading: "مثال",
    example_body:
      "curl https://mabii.org/api/v1/indicators/mabii.macro.gdp_nominal_usd",
  },
};

export default async function ApiDocsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = sections[lang];

  return (
    <article className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-4 text-3xl" style={{ fontWeight: 600 }}>
        {c.title}
      </h1>
      <p
        className="mb-8"
        style={{ lineHeight: 1.7, color: "var(--color-ink-soft)" }}
      >
        {c.intro}
      </p>

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
              <th>Method</th>
              <th>Path</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {c.endpoints.map((e) => (
              <tr key={e.path}>
                <td>
                  <code
                    style={{
                      background: "var(--color-rule-soft)",
                      color: "var(--color-accent)",
                      fontWeight: 600,
                    }}
                  >
                    {e.method}
                  </code>
                </td>
                <td>
                  <code>{e.path}</code>
                </td>
                <td style={{ color: "var(--color-ink-soft)" }}>{e.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 mb-3 text-lg" style={{ fontWeight: 600 }}>
        {c.example_heading}
      </h2>
      <pre
        className="overflow-x-auto p-3 text-sm"
        style={{
          background: "var(--color-rule-soft)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {c.example_body}
      </pre>
    </article>
  );
}
