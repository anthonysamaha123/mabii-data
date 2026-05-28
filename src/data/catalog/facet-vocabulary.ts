import type { FacetVocabularyEntry } from "@/data/types";

/**
 * Facet vocabulary v1.
 * Public artifact — every value here is reachable as a faceted query.
 * Versioned: do not silently rename a facet_value once published; deprecate + add.
 */
export const facetVocabulary: FacetVocabularyEntry[] = [
  // ── topic ────────────────────────────────────────────────────────────
  { facet_type: "topic", facet_value: "macro", label_en: "Macroeconomy", label_ar: "الاقتصاد الكلي" },
  { facet_type: "topic", facet_value: "monetary", label_en: "Monetary & banking", label_ar: "النقد والمصارف" },
  { facet_type: "topic", facet_value: "fiscal", label_en: "Public finance", label_ar: "المالية العامة" },
  { facet_type: "topic", facet_value: "external", label_en: "External sector", label_ar: "القطاع الخارجي" },
  { facet_type: "topic", facet_value: "prices", label_en: "Prices & inflation", label_ar: "الأسعار والتضخم" },
  { facet_type: "topic", facet_value: "trade", label_en: "Trade", label_ar: "التجارة" },
  { facet_type: "topic", facet_value: "demographic", label_en: "Demographics", label_ar: "السكان" },
  { facet_type: "topic", facet_value: "employment", label_en: "Employment", label_ar: "العمالة" },
  { facet_type: "topic", facet_value: "energy", label_en: "Energy", label_ar: "الطاقة" },
  { facet_type: "topic", facet_value: "real_estate", label_en: "Real estate", label_ar: "العقارات" },

  // ── subtopic ─────────────────────────────────────────────────────────
  { facet_type: "subtopic", facet_value: "gdp", parent: "macro", label_en: "Gross domestic product", label_ar: "الناتج المحلي الإجمالي" },
  { facet_type: "subtopic", facet_value: "growth", parent: "macro", label_en: "Real growth", label_ar: "النمو الحقيقي" },
  { facet_type: "subtopic", facet_value: "cpi", parent: "prices", label_en: "Consumer prices", label_ar: "أسعار المستهلك" },
  { facet_type: "subtopic", facet_value: "fx", parent: "monetary", label_en: "Exchange rate", label_ar: "سعر الصرف" },
  { facet_type: "subtopic", facet_value: "policy_rate", parent: "monetary", label_en: "Policy interest rate", label_ar: "سعر الفائدة الرسمي" },
  { facet_type: "subtopic", facet_value: "reserves", parent: "monetary", label_en: "Foreign reserves", label_ar: "الاحتياطيات الأجنبية" },
  { facet_type: "subtopic", facet_value: "debt", parent: "fiscal", label_en: "Public debt", label_ar: "الدين العام" },
  { facet_type: "subtopic", facet_value: "balance", parent: "fiscal", label_en: "Fiscal balance", label_ar: "الرصيد المالي" },
  { facet_type: "subtopic", facet_value: "current_account", parent: "external", label_en: "Current account", label_ar: "الحساب الجاري" },
  { facet_type: "subtopic", facet_value: "remittances", parent: "external", label_en: "Remittances", label_ar: "التحويلات" },
  { facet_type: "subtopic", facet_value: "exports", parent: "trade", label_en: "Exports", label_ar: "الصادرات" },
  { facet_type: "subtopic", facet_value: "imports", parent: "trade", label_en: "Imports", label_ar: "الواردات" },
  { facet_type: "subtopic", facet_value: "population", parent: "demographic", label_en: "Population", label_ar: "عدد السكان" },

  // ── frequency ────────────────────────────────────────────────────────
  { facet_type: "frequency", facet_value: "daily", label_en: "Daily", label_ar: "يومية" },
  { facet_type: "frequency", facet_value: "weekly", label_en: "Weekly", label_ar: "أسبوعية" },
  { facet_type: "frequency", facet_value: "monthly", label_en: "Monthly", label_ar: "شهرية" },
  { facet_type: "frequency", facet_value: "quarterly", label_en: "Quarterly", label_ar: "ربعية" },
  { facet_type: "frequency", facet_value: "annual", label_en: "Annual", label_ar: "سنوية" },

  // ── currency_basis ───────────────────────────────────────────────────
  { facet_type: "currency_basis", facet_value: "usd", label_en: "USD", label_ar: "دولار أميركي" },
  { facet_type: "currency_basis", facet_value: "lbp", label_en: "LBP", label_ar: "ليرة لبنانية" },
  { facet_type: "currency_basis", facet_value: "percent", label_en: "% / ratio", label_ar: "نسبة مئوية / نسبة" },
  { facet_type: "currency_basis", facet_value: "index", label_en: "Index", label_ar: "رقم قياسي" },
  { facet_type: "currency_basis", facet_value: "count", label_en: "Count / persons", label_ar: "عدد / أشخاص" },

  // ── geography_level ──────────────────────────────────────────────────
  { facet_type: "geography_level", facet_value: "country", label_en: "Country", label_ar: "الوطني" },
  { facet_type: "geography_level", facet_value: "governorate", label_en: "Governorate", label_ar: "المحافظة" },
  { facet_type: "geography_level", facet_value: "district", label_en: "District", label_ar: "القضاء" },

  // ── stock_or_flow ────────────────────────────────────────────────────
  { facet_type: "stock_or_flow", facet_value: "stock", label_en: "Stock", label_ar: "رصيد" },
  { facet_type: "stock_or_flow", facet_value: "flow", label_en: "Flow", label_ar: "تدفّق" },
  { facet_type: "stock_or_flow", facet_value: "ratio", label_en: "Ratio", label_ar: "نسبة" },
];

export function facetLabel(
  facet_type: string,
  facet_value: string,
  lang: "en" | "ar"
): string {
  const entry = facetVocabulary.find(
    (f) => f.facet_type === facet_type && f.facet_value === facet_value
  );
  if (!entry) return facet_value;
  return lang === "ar" ? entry.label_ar : entry.label_en;
}

export function facetValuesForType(facet_type: string) {
  return facetVocabulary.filter((f) => f.facet_type === facet_type);
}

export function facetTypes(): string[] {
  return Array.from(new Set(facetVocabulary.map((f) => f.facet_type)));
}
