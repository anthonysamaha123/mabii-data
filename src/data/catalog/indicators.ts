import type { Indicator } from "@/data/types";

/**
 * Indicator catalog v1.
 * Every entry here is reviewed by a human before merge.
 * Facet tagging is what makes faceted queries work (SPEC §6.3, §7).
 */
export const indicators: Indicator[] = [
  {
    code: "mabii.macro.gdp_nominal_usd",
    name_en: "GDP, nominal (USD)",
    name_ar: "الناتج المحلي الإجمالي الاسمي (دولار أميركي)",
    definition_en:
      "Gross domestic product at current prices, expressed in current US dollars. Headline measure of the economy's size in dollar terms.",
    definition_ar:
      "الناتج المحلي الإجمالي بالأسعار الجارية مقوَّماً بالدولار الأميركي. مقياس رئيسي لحجم الاقتصاد بالدولار.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "macro" },
      { facet_type: "subtopic", facet_value: "gdp" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "flow" },
    ],
    sources: [
      {
        source_id: "world-bank-wdi",
        source_native_code: "NY.GDP.MKTP.CD",
        comparability: "direct",
      },
      {
        source_id: "imf-weo",
        source_native_code: "NGDPD",
        comparability: "direct",
        reconciliation_notes:
          "IMF WEO publishes in USD billions; values are converted to USD units for storage.",
      },
    ],
    primary_source_id: "world-bank-wdi",
    notes_en:
      "WB reports actuals through the last completed year with frequent revisions. IMF WEO includes projections for the current and following years — these are flagged when displayed.",
    notes_ar:
      "يصدر البنك الدولي بياناتٍ فعلية حتى آخر سنة مكتملة مع مراجعات متكرّرة. يتضمّن إصدار صندوق النقد توقّعاتٍ للسنة الجارية واللاحقة — تُمَيَّز عند العرض.",
  },
  {
    code: "mabii.macro.gdp_real_growth",
    name_en: "GDP, real growth (%)",
    name_ar: "نمو الناتج المحلي الإجمالي الحقيقي (%)",
    definition_en:
      "Year-on-year change in gross domestic product at constant prices.",
    definition_ar: "التغيّر السنوي للناتج المحلي الإجمالي بالأسعار الثابتة.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "macro" },
      { facet_type: "subtopic", facet_value: "growth" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      {
        source_id: "world-bank-wdi",
        source_native_code: "NY.GDP.MKTP.KD.ZG",
        comparability: "direct",
      },
      {
        source_id: "imf-weo",
        source_native_code: "NGDP_RPCH",
        comparability: "direct",
      },
    ],
    primary_source_id: "world-bank-wdi",
  },
  {
    code: "mabii.prices.cpi_yoy",
    name_en: "Consumer price inflation, year-on-year (%)",
    name_ar: "تضخم أسعار المستهلك على أساس سنوي (%)",
    definition_en:
      "Year-on-year change in the consumer price index. The official CPI methodology rests on a basket dating to 2004–05 — a known limitation.",
    definition_ar:
      "التغيّر السنوي للرقم القياسي لأسعار المستهلك. تستند المنهجية الرسمية إلى سلّة استهلاك تعود إلى 2004–2005 — وهو قيد معروف.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      {
        source_id: "world-bank-wdi",
        source_native_code: "FP.CPI.TOTL.ZG",
        comparability: "direct",
      },
      {
        source_id: "imf-weo",
        source_native_code: "PCPIPCH",
        comparability: "direct",
      },
    ],
    notes_en:
      "Official CPI weights date to 2004–05; the series understates lived inflation during the post-2019 crisis. A scraped price index is planned (SPEC Phase 3).",
    notes_ar:
      "تعود أوزان الرقم القياسي الرسمي إلى 2004–2005؛ ولذلك تُقلِّل السلسلة من حجم التضخم المعاش بعد عام 2019. ثمّة خطة لإطلاق رقم أسعار مستقلٍّ (المرحلة الثالثة).",
  },
  {
    code: "mabii.external.current_account_pct_gdp",
    name_en: "Current account balance (% of GDP)",
    name_ar: "رصيد الحساب الجاري (% من الناتج المحلي)",
    definition_en:
      "Current account balance expressed as a share of nominal GDP.",
    definition_ar:
      "رصيد الحساب الجاري كنسبة من الناتج المحلي الإجمالي الاسمي.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "external" },
      { facet_type: "subtopic", facet_value: "current_account" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      {
        source_id: "world-bank-wdi",
        source_native_code: "BN.CAB.XOKA.GD.ZS",
        comparability: "direct",
      },
      {
        source_id: "imf-weo",
        source_native_code: "BCA_NGDPD",
        comparability: "direct",
      },
    ],
  },
  {
    code: "mabii.fiscal.gov_debt_pct_gdp",
    name_en: "General government gross debt (% of GDP)",
    name_ar: "إجمالي دين الحكومة العامة (% من الناتج المحلي)",
    definition_en:
      "Stock of general government gross debt expressed as a share of nominal GDP.",
    definition_ar:
      "رصيد إجمالي دين الحكومة العامة كنسبة من الناتج المحلي الإجمالي الاسمي.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "fiscal" },
      { facet_type: "subtopic", facet_value: "debt" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "imf-weo",
        source_native_code: "GGXWDG_NGDP",
        comparability: "direct",
      },
    ],
  },
  {
    code: "mabii.demographic.population",
    name_en: "Population, total",
    name_ar: "إجمالي عدد السكان",
    definition_en:
      "Total resident population, midyear estimates.",
    definition_ar: "إجمالي عدد السكان المقيمين، تقديرات منتصف العام.",
    default_unit: "persons",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "demographic" },
      { facet_type: "subtopic", facet_value: "population" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "world-bank-wdi",
        source_native_code: "SP.POP.TOTL",
        comparability: "direct",
      },
      {
        source_id: "imf-weo",
        source_native_code: "LP",
        comparability: "direct",
        reconciliation_notes:
          "IMF WEO reports LP in millions; converted to absolute persons for storage.",
      },
    ],
    primary_source_id: "world-bank-wdi",
  },
  {
    code: "mabii.trade.exports_goods_usd",
    name_en: "Exports of goods (USD)",
    name_ar: "صادرات السلع (دولار أميركي)",
    definition_en:
      "Total annual exports of goods, free-on-board, in current US dollars.",
    definition_ar:
      "إجمالي الصادرات السنوية للسلع، فوب، بالدولار الأميركي الجاري.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "trade" },
      { facet_type: "subtopic", facet_value: "exports" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "flow" },
    ],
    sources: [
      {
        source_id: "un-comtrade",
        source_native_code: "X/TOTAL",
        comparability: "direct",
        reconciliation_notes:
          "Sum of all goods (HS=TOTAL), reported by Lebanon to Comtrade. Headline aggregate; per-partner / per-commodity breakdowns deferred to Phase 2.",
      },
      {
        source_id: "world-bank-wdi",
        source_native_code: "NE.EXP.GNFS.CD",
        comparability: "after_conversion",
        reconciliation_notes:
          "WB series includes services; Comtrade is goods only. Comparable directionally but not 1:1.",
      },
    ],
    primary_source_id: "un-comtrade",
  },
  {
    code: "mabii.trade.imports_goods_usd",
    name_en: "Imports of goods (USD)",
    name_ar: "واردات السلع (دولار أميركي)",
    definition_en:
      "Total annual imports of goods, cost-insurance-freight, in current US dollars.",
    definition_ar:
      "إجمالي الواردات السنوية للسلع، سيف، بالدولار الأميركي الجاري.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "trade" },
      { facet_type: "subtopic", facet_value: "imports" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "flow" },
    ],
    sources: [
      {
        source_id: "un-comtrade",
        source_native_code: "M/TOTAL",
        comparability: "direct",
      },
      {
        source_id: "world-bank-wdi",
        source_native_code: "NE.IMP.GNFS.CD",
        comparability: "after_conversion",
        reconciliation_notes:
          "WB series includes services; Comtrade is goods only.",
      },
    ],
    primary_source_id: "un-comtrade",
  },
];

export function getIndicator(code: string): Indicator | undefined {
  return indicators.find((i) => i.code === code);
}
