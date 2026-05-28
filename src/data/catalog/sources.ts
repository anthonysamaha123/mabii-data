import type { Source } from "@/data/types";

export const sources: Source[] = [
  {
    id: "world-bank-wdi",
    name_en: "World Bank — World Development Indicators",
    name_ar: "البنك الدولي — مؤشرات التنمية العالمية",
    publisher_en: "World Bank Group",
    publisher_ar: "مجموعة البنك الدولي",
    tier: "T1",
    trust_label_default: "official",
    url: "https://data.worldbank.org",
    license: "CC-BY-4.0 (World Bank Open Data)",
    cadence_en: "Annual; revisions ongoing.",
    cadence_ar: "سنوية؛ مع مراجعات مستمرة.",
    ingest_method_en:
      "Mabii pulls Lebanon series directly from the World Bank API. Every fetch is stored verbatim as JSON.",
    ingest_method_ar:
      "تسحب مَبني سلاسل لبنان مباشرةً من واجهة البنك الدولي. يُحفظ كل سحب كما هو بصيغة JSON.",
  },
  {
    id: "imf-weo",
    name_en: "IMF — World Economic Outlook",
    name_ar: "صندوق النقد الدولي — آفاق الاقتصاد العالمي",
    publisher_en: "International Monetary Fund",
    publisher_ar: "صندوق النقد الدولي",
    tier: "T1",
    trust_label_default: "official",
    url: "https://www.imf.org/en/Publications/WEO",
    license: "IMF Terms of Use (free for non-commercial use)",
    cadence_en: "Biannual (April, October); projections.",
    cadence_ar: "مرتين سنوياً (نيسان وتشرين الأول)؛ تتضمن توقّعات.",
    ingest_method_en:
      "Mabii pulls Lebanon WEO series from the IMF JSON dataset. Latest published release is the canonical version.",
    ingest_method_ar:
      "تسحب مَبني سلاسل لبنان من إصدار آفاق الاقتصاد العالمي عبر بيانات JSON. الإصدار المنشور الأحدث هو المرجع.",
  },
];

export function getSource(id: string): Source | undefined {
  return sources.find((s) => s.id === id);
}
