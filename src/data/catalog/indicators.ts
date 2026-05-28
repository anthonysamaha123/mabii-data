import type { Indicator, Schedule } from "@/data/types";

/**
 * Indicator catalog v1.
 * Every entry here is reviewed by a human before merge.
 * Facet tagging is what makes faceted queries work (SPEC §6.3, §7).
 * `schedule` on each source mapping is read by scripts/scheduler/check.ts
 * to decide what to refresh and when. Pure data, no AI.
 */

// ─── Shared schedules ────────────────────────────────────────────────
// One per *source*. If a particular indicator publishes on a different
// cadence than its source's headline (rare), override inline.

const wbAnnualSchedule: Schedule = {
  cadence: "annual",
  release_month_of_year: 4, // WB WDI typically refreshes April–July
  release_day_of_month: 15,
  grace_days: 90,
  notes:
    "World Bank WDI publishes the annual update around April–July; minor revisions continue afterward. We retry within a 90-day grace window before flagging stale.",
};

const imfWeoSchedule: Schedule = {
  cadence: "annual",
  release_month_of_year: 4, // Spring WEO
  secondary_release_month: 10, // Fall WEO
  release_day_of_month: 15,
  grace_days: 30,
  notes:
    "IMF WEO ships twice yearly — April (Spring) and October (Fall). 30-day grace before flagging stale.",
};

const comtradeAnnualSchedule: Schedule = {
  cadence: "annual",
  release_month_of_year: 9, // Lebanese annual trade data lags ~6–9 months
  release_day_of_month: 15,
  grace_days: 90,
  notes:
    "UN Comtrade annual aggregates for Lebanon are typically complete by mid-year of the following year. 90-day grace.",
};

const olxRentSchedule: Schedule = {
  cadence: "monthly",
  release_day_of_month: 1, // Mabii publishes the median at the start of each month
  grace_days: 7,
  notes:
    "Mabii-originated: scraped daily, aggregated to a monthly median published on the 1st. 7-day grace.",
};

const olxCarSchedule: Schedule = {
  cadence: "weekly",
  grace_days: 3,
  notes:
    "Mabii-originated: scraped daily, aggregated to a weekly median. 3-day grace.",
};

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
        schedule: wbAnnualSchedule,
      },
      {
        source_id: "imf-weo",
        source_native_code: "NGDPD",
        comparability: "direct",
        reconciliation_notes:
          "IMF WEO publishes in USD billions; values are converted to USD units for storage.",
        schedule: imfWeoSchedule,
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
        schedule: wbAnnualSchedule,
      },
      {
        source_id: "imf-weo",
        source_native_code: "NGDP_RPCH",
        comparability: "direct",
        schedule: imfWeoSchedule,
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
        schedule: wbAnnualSchedule,
      },
      {
        source_id: "imf-weo",
        source_native_code: "PCPIPCH",
        comparability: "direct",
        schedule: imfWeoSchedule,
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
        schedule: wbAnnualSchedule,
      },
      {
        source_id: "imf-weo",
        source_native_code: "BCA_NGDPD",
        comparability: "direct",
        schedule: imfWeoSchedule,
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
        schedule: imfWeoSchedule,
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
        schedule: wbAnnualSchedule,
      },
      {
        source_id: "imf-weo",
        source_native_code: "LP",
        comparability: "direct",
        reconciliation_notes:
          "IMF WEO reports LP in millions; converted to absolute persons for storage.",
        schedule: imfWeoSchedule,
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
        schedule: comtradeAnnualSchedule,
      },
      {
        source_id: "world-bank-wdi",
        source_native_code: "NE.EXP.GNFS.CD",
        comparability: "after_conversion",
        reconciliation_notes:
          "WB series includes services; Comtrade is goods only. Comparable directionally but not 1:1.",
        schedule: wbAnnualSchedule,
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
        schedule: comtradeAnnualSchedule,
      },
      {
        source_id: "world-bank-wdi",
        source_native_code: "NE.IMP.GNFS.CD",
        comparability: "after_conversion",
        reconciliation_notes:
          "WB series includes services; Comtrade is goods only.",
        schedule: wbAnnualSchedule,
      },
    ],
    primary_source_id: "un-comtrade",
  },
  {
    code: "mabii.real_estate.rent_median_lbp_per_district",
    name_en: "Residential rent — median asking price by district (planned)",
    name_ar: "الإيجار السكني — وسطاء الأسعار المطلوبة حسب القضاء (مخطَّط)",
    definition_en:
      "Planned originated indicator. Monthly median asking rent for residential listings on Lebanese classifieds, broken down by district. Mabii will publish the median, sample size, and last-updated per district — never the raw listings. Methodology paper to accompany first release.",
    definition_ar:
      "مؤشر مخطَّط من إنتاج مَبني. الوسيط الشهري للإيجار السكني المطلوب على الإعلانات المبوَّبة اللبنانية، مفصَّلاً حسب القضاء. ستنشر مَبني الوسيط وحجم العيّنة وتاريخ آخر تحديث لكل قضاء — لا الإعلانات الخام. تُرافِق وثيقة منهجية أول إصدار.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "real_estate" },
      { facet_type: "subtopic", facet_value: "rent" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "district" },
      { facet_type: "stock_or_flow", facet_value: "flow" },
    ],
    sources: [
      {
        source_id: "olx-lebanon",
        source_native_code: "listings.real_estate.rent",
        comparability: "direct",
        reconciliation_notes:
          "Scraped daily; aggregated to monthly median per district. Outlier-trimmed (P5–P95). Sample size and last-updated visible on every cell.",
        schedule: olxRentSchedule,
      },
    ],
    primary_source_id: "olx-lebanon",
    notes_en:
      "Planned for Phase 3. No official source publishes Lebanese rent statistics; this is one of Mabii's flagship originated indicators. Trust label will be 'modeled'; methodology published with first release.",
    notes_ar:
      "مخطَّط للمرحلة الثالثة. لا يوجد مصدر رسمي ينشر إحصاءات الإيجار في لبنان؛ يُعدّ هذا أحد أهمّ مؤشرات مَبني الأصلية. تصنيف الثقة ‘نموذجي’؛ وتُنشَر المنهجية مع أول إصدار.",
  },
  {
    code: "mabii.transport.used_car_median_price_by_model",
    name_en: "Used cars — median asking price by make, model, and year (planned)",
    name_ar: "السيارات المستعملة — وسطاء الأسعار المطلوبة حسب الماركة والموديل والسنة (مخطَّط)",
    definition_en:
      "Planned originated indicator. Median asking price (USD) for used vehicles on Lebanese classifieds, indexed by (make, model, year). For each tuple Mabii publishes the median, sample size, age of the latest listing, and a freshness flag. Raw listings are not republished.",
    definition_ar:
      "مؤشر مخطَّط من إنتاج مَبني. وسيط السعر المطلوب (بالدولار) للسيارات المستعملة على الإعلانات المبوَّبة اللبنانية، موزَّعاً حسب (الماركة، الموديل، السنة). تنشر مَبني لكل تجميعة الوسيطَ وحجم العيّنة وعمر آخر إعلان ومؤشر التحديث. لا تُعاد نشر الإعلانات الخام.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "transport" },
      { facet_type: "subtopic", facet_value: "used_cars" },
      { facet_type: "frequency", facet_value: "weekly" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "flow" },
    ],
    sources: [
      {
        source_id: "olx-lebanon",
        source_native_code: "listings.vehicles.cars",
        comparability: "direct",
        reconciliation_notes:
          "Scraped daily; aggregated weekly to a (make, model, year) median with sample size. Outlier-trimmed.",
        schedule: olxCarSchedule,
      },
    ],
    primary_source_id: "olx-lebanon",
    notes_en:
      "Planned for Phase 3. A high-frequency consumer-relevant series with no public alternative — likely a major driver of casual web traffic. Trust 'modeled'; methodology + sample-audit published with first release.",
    notes_ar:
      "مخطَّط للمرحلة الثالثة. سلسلة عالية التواتر ذات أهمّية للمستهلك دون بديل علني — يُرجَّح أن تكون من أكبر محرّكات حركة الزوّار. تصنيف ‘نموذجي’؛ المنهجية وتدقيق العيّنات يُنشَران مع أول إصدار.",
  },
];

export function getIndicator(code: string): Indicator | undefined {
  return indicators.find((i) => i.code === code);
}
