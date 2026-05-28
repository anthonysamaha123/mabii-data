import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Changelog" };

interface Entry {
  date: string;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
}

const entries: Entry[] = [
  {
    date: "2026-05-28",
    title_en: "v0.1 — Initial publication",
    title_ar: "الإصدار 0.1 — النشر الأولي",
    body_en:
      "Mabii goes live with six indicators across macro, prices, external, fiscal and demographic topics, sourced from the World Bank and the IMF. Bilingual (English / Arabic) site, open API, downloadable CSV per indicator. Facet vocabulary v1 published.",
    body_ar:
      "تنطلق مَبني بستة مؤشرات في الاقتصاد الكلي والأسعار والقطاع الخارجي والمالية العامة والسكان، مستمدّةً من البنك الدولي وصندوق النقد الدولي. الموقع ثنائي اللغة (إنكليزية/عربية)، واجهة برمجية مفتوحة، وتنزيل CSV لكل مؤشر. ونُشرت مفردات التصنيف بالإصدار الأول.",
  },
];

const headings: Record<Locale, { title: string; intro: string }> = {
  en: {
    title: "Changelog",
    intro:
      "Every change to the catalogue, every correction, every methodology update — dated, versioned, public. Hidden errors destroy trust; published ones build it.",
  },
  ar: {
    title: "سجل التغييرات",
    intro:
      "كل تغيير في الكتالوج، وكل تصحيح، وكل تحديث منهجي — مؤرَّخٌ ومُعَنونٌ بإصدار وعلنيّ. الأخطاء المخفية تقضي على الثقة، والمنشورة تبنيها.",
  },
};

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = headings[lang];

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-4 text-3xl" style={{ fontWeight: 600 }}>
        {c.title}
      </h1>
      <p
        className="mb-10"
        style={{ lineHeight: 1.7, color: "var(--color-ink-soft)" }}
      >
        {c.intro}
      </p>
      <ol className="space-y-8">
        {entries.map((e) => (
          <li
            key={e.date}
            className="border-l-2 pl-4"
            style={{ borderColor: "var(--color-rule)" }}
          >
            <div
              className="mb-1 text-xs uppercase tracking-wider"
              style={{
                color: "var(--color-ink-mute)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
              }}
            >
              {e.date}
            </div>
            <h3 className="mb-2 text-lg" style={{ fontWeight: 600 }}>
              {lang === "ar" ? e.title_ar : e.title_en}
            </h3>
            <p style={{ lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
              {lang === "ar" ? e.body_ar : e.body_en}
            </p>
          </li>
        ))}
      </ol>
    </article>
  );
}
