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

const placesMonthlySchedule: Schedule = {
  cadence: "monthly",
  release_day_of_month: 1,
  grace_days: 10,
  notes: "Mabii queries Google Places monthly; first observation = first query date (no historical backfill).",
};

const whoAnnualSchedule: Schedule = {
  cadence: "annual",
  release_month_of_year: 5,
  release_day_of_month: 15,
  grace_days: 180,
  notes: "WHO GHO updates per-indicator on irregular cadences; we re-check annually with a long grace window.",
};

const owidAnnualSchedule: Schedule = {
  cadence: "annual",
  release_month_of_year: 6,
  release_day_of_month: 15,
  grace_days: 180,
  notes: "OWID republishes from primary sources; checked annually.",
};

const iloAnnualSchedule: Schedule = {
  cadence: "annual",
  release_month_of_year: 11,
  release_day_of_month: 15,
  grace_days: 90,
  notes: "ILO modelled estimates typically refresh in late autumn.",
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
  // ─── Macro (additional) ──────────────────────────────────────────────
  {
    code: "mabii.macro.gdp_per_capita_usd",
    name_en: "GDP per capita (USD)",
    name_ar: "نصيب الفرد من الناتج المحلي الإجمالي (دولار أميركي)",
    definition_en: "Gross domestic product divided by midyear population, current US dollars.",
    definition_ar: "الناتج المحلي الإجمالي مقسوماً على عدد السكان في منتصف العام، بالدولار الأميركي الجاري.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "macro" },
      { facet_type: "subtopic", facet_value: "gdp_per_capita" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "NY.GDP.PCAP.CD", comparability: "direct", schedule: wbAnnualSchedule },
      { source_id: "imf-weo", source_native_code: "NGDPDPC", comparability: "direct", schedule: imfWeoSchedule },
    ],
    primary_source_id: "world-bank-wdi",
  },
  {
    code: "mabii.macro.gdp_per_capita_ppp",
    name_en: "GDP per capita, PPP (international $)",
    name_ar: "نصيب الفرد من الناتج المحلي الإجمالي بتعادل القوة الشرائية (دولار دولي)",
    definition_en: "GDP per capita in purchasing-power-parity adjusted current international dollars.",
    definition_ar: "نصيب الفرد من الناتج المحلي الإجمالي معدَّلاً بتعادل القوة الشرائية بالدولار الدولي الجاري.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "macro" },
      { facet_type: "subtopic", facet_value: "gdp_per_capita" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "NY.GDP.PCAP.PP.CD", comparability: "direct", schedule: wbAnnualSchedule },
      { source_id: "imf-weo", source_native_code: "PPPPC", comparability: "direct", schedule: imfWeoSchedule },
    ],
    primary_source_id: "world-bank-wdi",
  },

  // ─── Monetary (additional) ───────────────────────────────────────────
  {
    code: "mabii.monetary.broad_money_pct_gdp",
    name_en: "Broad money (% of GDP)",
    name_ar: "المعروض النقدي الواسع (% من الناتج المحلي)",
    definition_en: "Broad money (M2/M3 depending on source) expressed as a share of nominal GDP. Indicator of financial depth.",
    definition_ar: "المعروض النقدي الواسع (M2/M3 بحسب المصدر) كنسبة من الناتج المحلي الإجمالي الاسمي. مؤشر على عمق الجهاز المالي.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "money_supply" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "FM.LBL.BMNY.GD.ZS", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.monetary.private_credit_pct_gdp",
    name_en: "Domestic credit to private sector (% of GDP)",
    name_ar: "الإقراض المحلي للقطاع الخاص (% من الناتج المحلي)",
    definition_en: "Financial resources provided to the private sector by banks and other financial corporations, as a share of GDP.",
    definition_ar: "التمويل المقدّم للقطاع الخاص من المصارف والمؤسسات المالية الأخرى كنسبة من الناتج المحلي الإجمالي.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "bank_lending" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "FD.AST.PRVT.GD.ZS", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.monetary.lending_rate",
    name_en: "Lending interest rate (%)",
    name_ar: "سعر فائدة الإقراض (%)",
    definition_en: "Bank rate that usually meets the short- and medium-term financing needs of the private sector.",
    definition_ar: "السعر الذي تقدّمه المصارف عادةً لتمويل الاحتياجات قصيرة ومتوسطة الأجل للقطاع الخاص.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "lending_rate" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "FR.INR.LEND", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.monetary.deposit_rate",
    name_en: "Deposit interest rate (%)",
    name_ar: "سعر فائدة الودائع (%)",
    definition_en: "Rate paid by commercial or similar banks for demand, time, or savings deposits.",
    definition_ar: "السعر الذي تدفعه المصارف التجارية أو المماثلة على الودائع تحت الطلب أو لأجل أو الادخارية.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "deposit_rate" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "FR.INR.DPST", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.monetary.reserves_total_usd",
    name_en: "Total reserves (USD)",
    name_ar: "إجمالي الاحتياطيات (دولار أميركي)",
    definition_en: "Total reserves comprise holdings of monetary gold, special drawing rights, IMF reserve position, and foreign exchange holdings.",
    definition_ar: "تشمل الاحتياطيات الإجمالية الذهب النقدي وحقوق السحب الخاصة ووضع الاحتياطي لدى صندوق النقد والعملات الأجنبية.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "reserves" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "FI.RES.TOTL.CD", comparability: "direct", schedule: wbAnnualSchedule },
    ],
    notes_en: "Mabii also plans to ingest the BDL primary series directly when the BDL connector lands.",
    notes_ar: "تخطّط مَبني لسحب السلسلة الأصلية من مصرف لبنان مباشرةً عند إطلاق موصِل البنك المركزي.",
  },
  {
    code: "mabii.monetary.reserves_months_imports",
    name_en: "Total reserves in months of imports",
    name_ar: "إجمالي الاحتياطيات بأشهر الواردات",
    definition_en: "Total reserves expressed as months of goods and services imports that they could finance.",
    definition_ar: "إجمالي الاحتياطيات معبَّراً عنه بعدد أشهر الواردات من السلع والخدمات التي يمكن تمويلها.",
    default_unit: "months",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "reserves" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "FI.RES.TOTL.MO", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },

  // ─── Fiscal (additional) ─────────────────────────────────────────────
  {
    code: "mabii.fiscal.government_revenue_pct_gdp",
    name_en: "Government revenue (% of GDP)",
    name_ar: "إيرادات الحكومة (% من الناتج المحلي)",
    definition_en: "General government revenue as a share of GDP.",
    definition_ar: "إيرادات الحكومة العامة كنسبة من الناتج المحلي الإجمالي.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "fiscal" },
      { facet_type: "subtopic", facet_value: "government_revenue" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "GC.REV.XGRT.GD.ZS", comparability: "direct", schedule: wbAnnualSchedule, reconciliation_notes: "WB excludes grants." },
    ],
    notes_en: "IMF WEO has a parallel series (GGR_NGDP) including grants. We will add it when IMF SDMX onboards (DataMapper does not expose this code).",
    notes_ar: "لدى صندوق النقد سلسلة موازية (GGR_NGDP) تشمل المنح. سنُضيفها عند إلحاق واجهة SDMX (DataMapper لا تُتيحها).",
  },
  {
    code: "mabii.fiscal.government_expenditure_pct_gdp",
    name_en: "Government expenditure (% of GDP)",
    name_ar: "نفقات الحكومة (% من الناتج المحلي)",
    definition_en: "General government total expenditure as a share of GDP.",
    definition_ar: "إجمالي نفقات الحكومة العامة كنسبة من الناتج المحلي الإجمالي.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "fiscal" },
      { facet_type: "subtopic", facet_value: "government_expenditure" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "GC.XPN.TOTL.GD.ZS", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.fiscal.tax_revenue_pct_gdp",
    name_en: "Tax revenue (% of GDP)",
    name_ar: "الإيرادات الضريبية (% من الناتج المحلي)",
    definition_en: "Compulsory transfers to the central government for public purposes, as a share of GDP.",
    definition_ar: "التحويلات الإلزامية إلى الحكومة المركزية لأغراض عامة كنسبة من الناتج المحلي الإجمالي.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "fiscal" },
      { facet_type: "subtopic", facet_value: "tax_revenue" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "GC.TAX.TOTL.GD.ZS", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },

  // ─── External (additional) ───────────────────────────────────────────
  {
    code: "mabii.external.remittances_usd",
    name_en: "Personal remittances received (USD)",
    name_ar: "التحويلات الشخصية الواردة (دولار أميركي)",
    definition_en: "Personal transfers and compensation of employees received from abroad, current US dollars.",
    definition_ar: "التحويلات الشخصية وتعويضات الموظفين المستلَمة من الخارج، بالدولار الأميركي الجاري.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "external" },
      { facet_type: "subtopic", facet_value: "remittances" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "flow" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "BX.TRF.PWKR.CD.DT", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.external.remittances_pct_gdp",
    name_en: "Personal remittances received (% of GDP)",
    name_ar: "التحويلات الشخصية الواردة (% من الناتج المحلي)",
    definition_en: "Personal remittances received as a share of nominal GDP.",
    definition_ar: "التحويلات الشخصية الواردة كنسبة من الناتج المحلي الإجمالي الاسمي.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "external" },
      { facet_type: "subtopic", facet_value: "remittances" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "BX.TRF.PWKR.DT.GD.ZS", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.external.fdi_inflows_usd",
    name_en: "Foreign direct investment, net inflows (USD)",
    name_ar: "صافي تدفقات الاستثمار الأجنبي المباشر (دولار أميركي)",
    definition_en: "Net inflows of investment to acquire a lasting management interest in an enterprise operating in the reporting economy.",
    definition_ar: "صافي التدفقات الاستثمارية الواردة لاكتساب مصلحة إدارية دائمة في مؤسسة عاملة في الاقتصاد المُبَلِّغ.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "external" },
      { facet_type: "subtopic", facet_value: "fdi" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "flow" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "BX.KLT.DINV.CD.WD", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.trade.balance_usd",
    name_en: "External balance on goods and services (USD)",
    name_ar: "الرصيد الخارجي للسلع والخدمات (دولار أميركي)",
    definition_en: "Exports of goods and services minus imports of goods and services, current US dollars.",
    definition_ar: "صادرات السلع والخدمات ناقص واردات السلع والخدمات، بالدولار الأميركي الجاري.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "trade" },
      { facet_type: "subtopic", facet_value: "trade_balance" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "flow" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "NE.RSB.GNFS.CD", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },

  // ─── Prices (additional) ─────────────────────────────────────────────
  {
    code: "mabii.prices.cpi_index",
    name_en: "Consumer price index (2010 = 100)",
    name_ar: "الرقم القياسي لأسعار المستهلك (2010 = 100)",
    definition_en: "Consumer price index level, base year 2010 = 100.",
    definition_ar: "مستوى الرقم القياسي لأسعار المستهلك، سنة الأساس 2010 = 100.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "FP.CPI.TOTL", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },

  // ─── Employment ──────────────────────────────────────────────────────
  {
    code: "mabii.employment.labor_force_total",
    name_en: "Labour force, total",
    name_ar: "إجمالي القوى العاملة",
    definition_en: "Total labour force aged 15 and above.",
    definition_ar: "إجمالي القوى العاملة من الأعمار 15 سنة فأعلى.",
    default_unit: "persons",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "employment" },
      { facet_type: "subtopic", facet_value: "labor_force" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "SL.TLF.TOTL.IN", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.employment.unemployment_rate",
    name_en: "Unemployment, total (%)",
    name_ar: "البطالة، الإجمالي (%)",
    definition_en: "Share of the labour force without work but available for and seeking employment (ILO estimate).",
    definition_ar: "نسبة القوى العاملة المتاحة والباحثة عن عمل ولا تجده (تقدير منظّمة العمل الدولية).",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "employment" },
      { facet_type: "subtopic", facet_value: "unemployment" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "SL.UEM.TOTL.ZS", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.employment.youth_unemployment_rate",
    name_en: "Youth unemployment, 15–24 (%)",
    name_ar: "البطالة بين الشباب 15–24 (%)",
    definition_en: "Share of the labour force ages 15–24 that is unemployed (ILO estimate).",
    definition_ar: "نسبة القوى العاملة بين 15 و24 سنة التي تعاني من البطالة (تقدير منظّمة العمل الدولية).",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "employment" },
      { facet_type: "subtopic", facet_value: "youth_unemployment" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "SL.UEM.1524.ZS", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },

  // ─── Demographic (additional) ────────────────────────────────────────
  {
    code: "mabii.demographic.population_growth",
    name_en: "Population growth (annual %)",
    name_ar: "النموّ السكّاني السنوي (%)",
    definition_en: "Exponential rate of growth of midyear population from year t-1 to t, expressed as a percentage.",
    definition_ar: "المعدّل الأسّي لنموّ سكان منتصف العام من السنة t-1 إلى t، معبَّراً عنه كنسبة مئوية.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "demographic" },
      { facet_type: "subtopic", facet_value: "population_growth" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "SP.POP.GROW", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.demographic.age_dependency_ratio",
    name_en: "Age dependency ratio",
    name_ar: "نسبة الإعالة العمرية",
    definition_en: "Ratio of dependents (<15 and >64) to the working-age population (15–64).",
    definition_ar: "نسبة الأعمار المعتمدة (دون 15 وفوق 64) إلى السكان في سنّ العمل (15–64).",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "demographic" },
      { facet_type: "subtopic", facet_value: "age_dependency" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "SP.POP.DPND", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.demographic.urban_population_share",
    name_en: "Urban population (% of total)",
    name_ar: "السكان الحضريون (% من الإجمالي)",
    definition_en: "Share of the total population living in urban areas.",
    definition_ar: "نسبة إجمالي السكان الذين يعيشون في المناطق الحضرية.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "demographic" },
      { facet_type: "subtopic", facet_value: "urban_population" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "SP.URB.TOTL.IN.ZS", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },

  // ─── Infrastructure & connectivity ───────────────────────────────────
  {
    code: "mabii.infrastructure.internet_users_pct",
    name_en: "Internet users (% of population)",
    name_ar: "مستخدمو الإنترنت (% من السكان)",
    definition_en: "Share of population using the Internet from any device in the past three months.",
    definition_ar: "نسبة السكان الذين استخدموا الإنترنت من أي جهاز خلال الأشهر الثلاثة الماضية.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "infrastructure" },
      { facet_type: "subtopic", facet_value: "internet_use" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "IT.NET.USER.ZS", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.infrastructure.mobile_subs_per_100",
    name_en: "Mobile subscriptions (per 100 people)",
    name_ar: "اشتراكات الهاتف المحمول (لكل 100 شخص)",
    definition_en: "Active mobile cellular subscriptions per 100 inhabitants.",
    definition_ar: "اشتراكات الهاتف المحمول النشِطة لكل 100 من السكان.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "infrastructure" },
      { facet_type: "subtopic", facet_value: "mobile_subscriptions" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "IT.CEL.SETS.P2", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },

  // ─── Social ──────────────────────────────────────────────────────────
  {
    code: "mabii.social.life_expectancy",
    name_en: "Life expectancy at birth (years)",
    name_ar: "متوسّط العمر المتوقّع عند الولادة (سنوات)",
    definition_en: "Number of years a newborn would live if prevailing patterns of mortality stayed the same throughout life.",
    definition_ar: "عدد السنوات التي يُتوقَّع أن يعيشها مولود لو ظلّت أنماط الوفيات السائدة ثابتة طوال حياته.",
    default_unit: "years",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "social" },
      { facet_type: "subtopic", facet_value: "life_expectancy" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "SP.DYN.LE00.IN", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.social.primary_school_enrolment",
    name_en: "Net primary school enrolment (%)",
    name_ar: "صافي الالتحاق بالتعليم الابتدائي (%)",
    definition_en: "Ratio of children of primary-school age enrolled in primary education.",
    definition_ar: "نسبة الأطفال في سنّ التعليم الابتدائي المسجّلين في المدارس الابتدائية.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "social" },
      { facet_type: "subtopic", facet_value: "schooling" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "SE.PRM.NENR", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },

  // ─── Governance (Worldwide Governance Indicators via WB) ────────────
  // These are -2.5 to +2.5 estimate scores; lower = worse.
  {
    code: "mabii.governance.control_of_corruption",
    name_en: "Control of corruption (estimate)",
    name_ar: "مكافحة الفساد (تقدير)",
    definition_en: "Worldwide Governance Indicator: perceptions of the extent to which public power is exercised for private gain. Scale −2.5 (weak) to +2.5 (strong).",
    definition_ar: "مؤشر الحوكمة العالمي: تصوّرات مدى استخدام السلطة العامة لمنفعة خاصة. مقياس من −2.5 (ضعيف) إلى +2.5 (قويّ).",
    default_unit: "score",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "governance" },
      { facet_type: "subtopic", facet_value: "corruption" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "GOV_WGI_CC.EST", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.governance.rule_of_law",
    name_en: "Rule of law (estimate)",
    name_ar: "سيادة القانون (تقدير)",
    definition_en: "Worldwide Governance Indicator: perceptions of the extent to which agents have confidence in and abide by the rules of society. Scale −2.5 to +2.5.",
    definition_ar: "مؤشر الحوكمة العالمي: تصوّرات مدى ثقة الفاعلين بقواعد المجتمع والتزامهم بها. مقياس من −2.5 إلى +2.5.",
    default_unit: "score",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "governance" },
      { facet_type: "subtopic", facet_value: "rule_of_law" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "GOV_WGI_RL.EST", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.governance.voice_accountability",
    name_en: "Voice and accountability (estimate)",
    name_ar: "التعبير والمساءلة (تقدير)",
    definition_en: "WGI: perceptions of citizen participation in selecting their government, freedom of expression, association, and free media. Scale −2.5 to +2.5.",
    definition_ar: "مؤشر الحوكمة: تصوّرات مشاركة المواطنين في اختيار حكوماتهم، وحرية التعبير والتجمّع والإعلام. مقياس من −2.5 إلى +2.5.",
    default_unit: "score",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "governance" },
      { facet_type: "subtopic", facet_value: "voice_accountability" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "GOV_WGI_VA.EST", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.governance.political_stability",
    name_en: "Political stability and absence of violence (estimate)",
    name_ar: "الاستقرار السياسي وغياب العنف (تقدير)",
    definition_en: "WGI: perceptions of the likelihood of political instability and/or politically motivated violence, including terrorism. Scale −2.5 to +2.5.",
    definition_ar: "مؤشر الحوكمة: تصوّرات احتمالية عدم الاستقرار السياسي و/أو العنف ذي الدوافع السياسية، بما يشمل الإرهاب. مقياس من −2.5 إلى +2.5.",
    default_unit: "score",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "governance" },
      { facet_type: "subtopic", facet_value: "political_stability" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "GOV_WGI_PV.EST", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.governance.government_effectiveness",
    name_en: "Government effectiveness (estimate)",
    name_ar: "فاعلية الحكومة (تقدير)",
    definition_en: "WGI: perceptions of the quality of public services, the civil service, and policy formulation. Scale −2.5 to +2.5.",
    definition_ar: "مؤشر الحوكمة: تصوّرات جودة الخدمات العامة والخدمة المدنية وصياغة السياسات. مقياس من −2.5 إلى +2.5.",
    default_unit: "score",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "governance" },
      { facet_type: "subtopic", facet_value: "government_effectiveness" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "GOV_WGI_GE.EST", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },
  {
    code: "mabii.governance.regulatory_quality",
    name_en: "Regulatory quality (estimate)",
    name_ar: "جودة الأنظمة (تقدير)",
    definition_en: "WGI: perceptions of the ability of the government to formulate and implement sound policies that promote private-sector development. Scale −2.5 to +2.5.",
    definition_ar: "مؤشر الحوكمة: تصوّرات قدرة الحكومة على صياغة وتنفيذ سياسات سليمة تعزّز تطوّر القطاع الخاص. مقياس من −2.5 إلى +2.5.",
    default_unit: "score",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "governance" },
      { facet_type: "subtopic", facet_value: "regulatory_quality" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "world-bank-wdi", source_native_code: "GOV_WGI_RQ.EST", comparability: "direct", schedule: wbAnnualSchedule },
    ],
  },

  // ─── Health (WHO Global Health Observatory) ─────────────────────────
  {
    code: "mabii.health.life_expectancy_who",
    name_en: "Life expectancy at birth — WHO (years)",
    name_ar: "متوسّط العمر المتوقَّع عند الولادة — WHO (سنوات)",
    definition_en: "WHO Global Health Observatory life expectancy at birth, both sexes.",
    definition_ar: "متوسّط العمر المتوقَّع عند الولادة لكلا الجنسين (مرصد الصحة العالمي).",
    default_unit: "years",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "life_expectancy" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "who-gho", source_native_code: "WHOSIS_000001", comparability: "direct", schedule: whoAnnualSchedule },
    ],
    notes_en: "Cross-check against the WB series mabii.social.life_expectancy.",
    notes_ar: "للمقارنة مع سلسلة البنك الدولي mabii.social.life_expectancy.",
  },
  {
    code: "mabii.health.healthy_life_expectancy",
    name_en: "Healthy life expectancy at birth (HALE, years)",
    name_ar: "متوسّط سنوات الحياة الصحية عند الولادة (HALE)",
    definition_en: "Average years a person born today is expected to live in full health.",
    definition_ar: "متوسّط السنوات التي يُتوقَّع أن يعيشها مولود اليوم بصحّة كاملة.",
    default_unit: "years",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "life_expectancy" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "who-gho", source_native_code: "WHOSIS_000002", comparability: "direct", schedule: whoAnnualSchedule },
    ],
  },
  {
    code: "mabii.health.under5_mortality",
    name_en: "Under-five mortality rate (per 1,000 live births)",
    name_ar: "معدّل وفيات الأطفال دون سن الخامسة (لكل 1000 ولادة حيّة)",
    definition_en: "Probability per 1,000 that a newborn dies before reaching age 5.",
    definition_ar: "احتمالية أن يتوفّى المولود قبل بلوغ سنّ الخامسة، لكل 1000 ولادة حيّة.",
    default_unit: "per_1000",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "mortality" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "who-gho", source_native_code: "MDG_0000000007", comparability: "direct", schedule: whoAnnualSchedule },
    ],
  },
  {
    code: "mabii.health.infant_mortality",
    name_en: "Infant mortality rate (per 1,000 live births)",
    name_ar: "معدّل وفيات الرضّع (لكل 1000 ولادة حيّة)",
    definition_en: "Probability per 1,000 that a newborn dies before reaching age 1.",
    definition_ar: "احتمالية أن يتوفّى المولود قبل بلوغ السنة الأولى، لكل 1000 ولادة حيّة.",
    default_unit: "per_1000",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "mortality" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "who-gho", source_native_code: "MDG_0000000001", comparability: "direct", schedule: whoAnnualSchedule },
    ],
  },
  {
    code: "mabii.health.adult_mortality",
    name_en: "Adult mortality rate (per 1,000 between 15 and 60)",
    name_ar: "معدّل وفيات البالغين (لكل 1000 بين 15 و60 سنة)",
    definition_en: "Probability per 1,000 that an adult age 15 dies before age 60.",
    definition_ar: "احتمالية أن يتوفّى البالغ في عمر 15 قبل بلوغ 60، لكل 1000 شخص.",
    default_unit: "per_1000",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "mortality" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "who-gho", source_native_code: "WHOSIS_000004", comparability: "direct", schedule: whoAnnualSchedule },
    ],
  },
  {
    code: "mabii.health.current_health_expenditure_pct_gdp",
    name_en: "Current health expenditure (% of GDP) — WHO",
    name_ar: "الإنفاق الصحي الحالي (% من الناتج المحلي) — WHO",
    definition_en: "Total health expenditure as a share of GDP, from the WHO Global Health Expenditure Database.",
    definition_ar: "إجمالي الإنفاق الصحي كنسبة من الناتج المحلي الإجمالي، من قاعدة بيانات الإنفاق الصحي العالمية لـ WHO.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "health_expenditure" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "who-gho", source_native_code: "GHED_CHEGDP_SHA2011", comparability: "direct", schedule: whoAnnualSchedule },
    ],
  },
  {
    code: "mabii.health.oop_share_che",
    name_en: "Out-of-pocket spending (% of current health expenditure)",
    name_ar: "الإنفاق من الجيب (% من الإنفاق الصحي الحالي)",
    definition_en: "Household out-of-pocket health spending as a share of total current health expenditure.",
    definition_ar: "إنفاق الأسر من جيوبها على الصحة كنسبة من إجمالي الإنفاق الصحي الحالي.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "health_expenditure" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "who-gho", source_native_code: "GHED_OOPSCHE_SHA2011", comparability: "direct", schedule: whoAnnualSchedule },
    ],
  },
  {
    code: "mabii.health.mcv1_coverage",
    name_en: "Measles (MCV1) immunization coverage, 1-year-olds (%)",
    name_ar: "تغطية تحصين الحصبة (MCV1) لدى الأطفال في سنّ السنة (%)",
    definition_en: "Share of 1-year-olds who received the first dose of measles-containing vaccine.",
    definition_ar: "نسبة الأطفال في سنّ السنة الذين تلقّوا الجرعة الأولى من لقاح الحصبة.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "immunization" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "who-gho", source_native_code: "WHS4_544", comparability: "direct", schedule: whoAnnualSchedule },
    ],
  },

  // ─── Environment & energy (OWID curated) ─────────────────────────────
  {
    code: "mabii.environment.co2_per_capita",
    name_en: "CO₂ emissions per capita (tonnes)",
    name_ar: "انبعاثات ثاني أكسيد الكربون للفرد (طن)",
    definition_en: "Annual production-based CO₂ emissions per person (Global Carbon Project via OWID).",
    definition_ar: "الانبعاثات السنوية لثاني أكسيد الكربون للفرد بحسب الإنتاج (مشروع الكربون العالمي عبر OWID).",
    default_unit: "tonnes",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "environment" },
      { facet_type: "subtopic", facet_value: "co2_emissions" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "owid", source_native_code: "co-emissions-per-capita", comparability: "direct", schedule: owidAnnualSchedule },
    ],
  },
  {
    code: "mabii.environment.electricity_access_pct",
    name_en: "Access to electricity (% of population)",
    name_ar: "الوصول إلى الكهرباء (% من السكان)",
    definition_en: "Share of the population with access to electricity (World Bank / OWID).",
    definition_ar: "نسبة السكان الذين لديهم وصول إلى الكهرباء (البنك الدولي / OWID).",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "environment" },
      { facet_type: "subtopic", facet_value: "electricity_access" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "owid", source_native_code: "share-of-the-population-with-access-to-electricity", comparability: "direct", schedule: owidAnnualSchedule },
    ],
  },
  {
    code: "mabii.environment.share_fossil_electricity",
    name_en: "Share of electricity from fossil fuels (%)",
    name_ar: "حصّة الكهرباء من الوقود الأحفوري (%)",
    definition_en: "Percentage of total electricity generation sourced from fossil fuels (Ember / Energy Institute via OWID).",
    definition_ar: "النسبة المئوية من إجمالي توليد الكهرباء من الوقود الأحفوري (Ember / Energy Institute عبر OWID).",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "environment" },
      { facet_type: "subtopic", facet_value: "energy_mix" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "owid", source_native_code: "share-electricity-fossil-fuels", comparability: "direct", schedule: owidAnnualSchedule },
    ],
  },
  {
    code: "mabii.environment.share_renewable_electricity",
    name_en: "Share of electricity from renewables (%)",
    name_ar: "حصّة الكهرباء من مصادر الطاقة المتجدّدة (%)",
    definition_en: "Percentage of total electricity generation sourced from renewables (Ember via OWID).",
    definition_ar: "النسبة المئوية من إجمالي توليد الكهرباء من المصادر المتجدّدة (Ember عبر OWID).",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "environment" },
      { facet_type: "subtopic", facet_value: "energy_mix" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "owid", source_native_code: "share-electricity-renewables", comparability: "direct", schedule: owidAnnualSchedule },
    ],
  },
  {
    code: "mabii.environment.per_capita_electricity_kwh",
    name_en: "Per-capita electricity generation (kWh)",
    name_ar: "نصيب الفرد من توليد الكهرباء (كيلوواط ساعة)",
    definition_en: "Annual electricity generation divided by population (Ember / Energy Institute via OWID).",
    definition_ar: "إجمالي توليد الكهرباء السنوي مقسوماً على عدد السكان (Ember / Energy Institute عبر OWID).",
    default_unit: "kWh",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "environment" },
      { facet_type: "subtopic", facet_value: "energy_mix" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "owid", source_native_code: "per-capita-electricity-generation", comparability: "direct", schedule: owidAnnualSchedule },
    ],
  },

  // ─── Labor (ILOSTAT modelled estimates) ──────────────────────────────
  {
    code: "mabii.employment.labor_force_participation_total",
    name_en: "Labour-force participation rate, total (15+, %)",
    name_ar: "معدّل مشاركة القوى العاملة، الإجمالي (15+، %)",
    definition_en: "Share of the working-age population (15+) that is economically active. ILO modelled estimate.",
    definition_ar: "نسبة السكان في سنّ العمل (15+) الناشطين اقتصادياً. تقدير نموذجي لمنظّمة العمل الدولية.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "employment" },
      { facet_type: "subtopic", facet_value: "labor_force" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "ilostat", source_native_code: "EAP_DWAP_SEX_AGE_RT/A.LBN.SEX_T.AGE_AGGREGATE_Y15+", comparability: "direct", schedule: iloAnnualSchedule },
    ],
  },
  {
    code: "mabii.employment.labor_force_participation_female",
    name_en: "Labour-force participation rate, female (15+, %)",
    name_ar: "معدّل مشاركة القوى العاملة، الإناث (15+، %)",
    definition_en: "Share of working-age women (15+) economically active. ILO modelled estimate.",
    definition_ar: "نسبة النساء في سنّ العمل الناشطات اقتصادياً. تقدير نموذجي لمنظّمة العمل الدولية.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "employment" },
      { facet_type: "subtopic", facet_value: "labor_force" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "ilostat", source_native_code: "EAP_DWAP_SEX_AGE_RT/A.LBN.SEX_F.AGE_AGGREGATE_Y15+", comparability: "direct", schedule: iloAnnualSchedule },
    ],
  },
  {
    code: "mabii.employment.employment_to_population_total",
    name_en: "Employment-to-population ratio, total (15+, %)",
    name_ar: "نسبة العمالة إلى السكان، الإجمالي (15+، %)",
    definition_en: "Share of the working-age population (15+) that is employed. ILO modelled estimate.",
    definition_ar: "نسبة السكان في سنّ العمل (15+) الذين هم في حالة عمل. تقدير نموذجي لمنظّمة العمل الدولية.",
    default_unit: "%",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "employment" },
      { facet_type: "subtopic", facet_value: "labor_force" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "percent" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "ilostat", source_native_code: "EMP_DWAP_SEX_AGE_RT/A.LBN.SEX_T.AGE_AGGREGATE_Y15+", comparability: "direct", schedule: iloAnnualSchedule },
    ],
  },

  // ─── Google Places — business landscape by governorate ─────────────
  // 10 categories × 2 metrics. Each observation is at governorate level
  // (geography_id ∈ LBN-BA, LBN-ML, LBN-NO, ...) for the snapshot month.
  // Methodology: per-governorate Text Search query, OPERATIONAL filter,
  // dedupe by place_id. Sample size visible per observation.
  //
  // ── Count indicators ────────────────────────────────────────────────
  {
    code: "mabii.health.places_pharmacy_count",
    name_en: "Pharmacies — count per governorate (Google Places)",
    name_ar: "الصيدليات — العدد حسب المحافظة (Google Places)",
    definition_en: "Number of operational pharmacies found by Google Places, by governorate. Coverage uneven — Beirut/Mount Lebanon well mapped, rural governorates sparse.",
    definition_ar: "عدد الصيدليات العاملة كما تظهر في Google Places حسب المحافظة. التغطية متفاوتة — تغطية جيّدة لبيروت وجبل لبنان، شحيحة في المناطق الريفية.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "pharmacy" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:pharmacy", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.health.places_hospital_count",
    name_en: "Hospitals & clinics — count per governorate (Google Places)",
    name_ar: "المستشفيات والعيادات — العدد حسب المحافظة (Google Places)",
    definition_en: "Number of operational hospitals and clinics by governorate.",
    definition_ar: "عدد المستشفيات والعيادات العاملة حسب المحافظة.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "hospital" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:hospital", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.monetary.places_bank_branch_count",
    name_en: "Bank branches — count per governorate (Google Places)",
    name_ar: "فروع المصارف — العدد حسب المحافظة (Google Places)",
    definition_en: "Number of operational bank branches by governorate. Useful tracking of post-2019 sector contraction.",
    definition_ar: "عدد فروع المصارف العاملة حسب المحافظة. مفيد لتتبّع انكماش القطاع بعد 2019.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "bank_branch" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:bank", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.monetary.places_money_exchange_count",
    name_en: "Money exchange (sarrafa) — count per governorate (Google Places)",
    name_ar: "محلّات الصرافة — العدد حسب المحافظة (Google Places)",
    definition_en: "Operational money-exchange points detected via Google Places. Combines Google's 'finance' and 'atm' types filtered by name keywords (exchange, sarrafa, صرافة).",
    definition_ar: "نقاط الصرافة العاملة المكتشَفة عبر Google Places. تجمع أنواع 'finance' و'atm' المُصفّاة بكلمات مفتاحية (exchange، sarrafa، صرافة).",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "money_exchange" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:money_exchange", comparability: "direct", schedule: placesMonthlySchedule }],
    notes_en: "Lebanon-specific category not in Google's primary type list — detected via Arabic + English keywords on displayName.",
    notes_ar: "فئة لبنانية الخصوصية غير مدرَجة في قائمة Google الأساسية — تُكتشَف بكلمات مفتاحية باللغتين العربية والإنكليزية.",
  },
  {
    code: "mabii.hospitality.places_restaurant_count",
    name_en: "Restaurants — count per governorate (Google Places)",
    name_ar: "المطاعم — العدد حسب المحافظة (Google Places)",
    definition_en: "Operational restaurants by governorate.",
    definition_ar: "عدد المطاعم العاملة حسب المحافظة.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "hospitality" },
      { facet_type: "subtopic", facet_value: "restaurant" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:restaurant", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.hospitality.places_cafe_count",
    name_en: "Cafés — count per governorate (Google Places)",
    name_ar: "المقاهي — العدد حسب المحافظة (Google Places)",
    definition_en: "Operational cafés by governorate.",
    definition_ar: "عدد المقاهي العاملة حسب المحافظة.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "hospitality" },
      { facet_type: "subtopic", facet_value: "cafe" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:cafe", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.hospitality.places_hotel_count",
    name_en: "Hotels & lodging — count per governorate (Google Places)",
    name_ar: "الفنادق ودور الإقامة — العدد حسب المحافظة (Google Places)",
    definition_en: "Operational hotels and lodging by governorate. Tourism activity proxy.",
    definition_ar: "عدد الفنادق ودور الإقامة العاملة حسب المحافظة. مؤشر للنشاط السياحي.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "hospitality" },
      { facet_type: "subtopic", facet_value: "hotel" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:lodging", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.retail.places_supermarket_count",
    name_en: "Supermarkets & grocers — count per governorate (Google Places)",
    name_ar: "السوبرماركت والبقالات — العدد حسب المحافظة (Google Places)",
    definition_en: "Operational supermarkets and grocery stores by governorate.",
    definition_ar: "عدد السوبرماركت ومحال البقالة العاملة حسب المحافظة.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "retail" },
      { facet_type: "subtopic", facet_value: "supermarket" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:supermarket", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.retail.places_gas_station_count",
    name_en: "Gas stations — count per governorate (Google Places)",
    name_ar: "محطات الوقود — العدد حسب المحافظة (Google Places)",
    definition_en: "Operational gas stations by governorate. Fuel infrastructure proxy.",
    definition_ar: "عدد محطات الوقود العاملة حسب المحافظة. مؤشر للبنية التحتية للوقود.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "retail" },
      { facet_type: "subtopic", facet_value: "gas_station" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:gas_station", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.environment.places_generator_shop_count",
    name_en: "Generator & solar shops — count per governorate (Google Places)",
    name_ar: "متاجر المولّدات والطاقة الشمسية — العدد حسب المحافظة (Google Places)",
    definition_en: "Businesses selling or installing generators and solar systems, detected via keywords on displayName (generator, solar, مولّد, طاقة شمسية). Power-crisis-driven sector with no official measurement.",
    definition_ar: "الأعمال التي تبيع أو تركّب مولّدات وأنظمة طاقة شمسية، تُكتشَف بكلمات مفتاحية. قطاع نشأ بسبب أزمة الكهرباء ولا يوجد قياس رسمي له.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "environment" },
      { facet_type: "subtopic", facet_value: "generator_shop" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:generator_shop", comparability: "direct", schedule: placesMonthlySchedule }],
    notes_en: "Lebanon-specific category. Keyword detection — accuracy limited by what's in the business name.",
    notes_ar: "فئة لبنانية الخصوصية. الكشف بكلمات مفتاحية — الدقّة محدودة بما يَظهر في اسم العمل.",
  },

  // ── Median rating indicators ─────────────────────────────────────────
  {
    code: "mabii.health.places_pharmacy_median_rating",
    name_en: "Pharmacies — median Google rating per governorate",
    name_ar: "الصيدليات — وسيط تقييم Google حسب المحافظة",
    definition_en: "Median of user-submitted Google ratings (1.0-5.0) across pharmacies in each governorate. Quality proxy; biased toward urban / better-connected places.",
    definition_ar: "الوسيط لتقييمات Google المُقدَّمة من المستخدمين (1.0-5.0) للصيدليات في كل محافظة. مؤشر للجودة؛ متحيّز نحو المناطق الحضرية.",
    default_unit: "rating",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "pharmacy" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "governorate" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:pharmacy:rating", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.health.places_hospital_median_rating",
    name_en: "Hospitals & clinics — median Google rating per governorate",
    name_ar: "المستشفيات والعيادات — وسيط تقييم Google حسب المحافظة",
    definition_en: "Median Google rating across hospitals/clinics per governorate.",
    definition_ar: "وسيط تقييم Google للمستشفيات والعيادات حسب المحافظة.",
    default_unit: "rating",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "health" },
      { facet_type: "subtopic", facet_value: "hospital" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "governorate" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:hospital:rating", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.monetary.places_bank_branch_median_rating",
    name_en: "Bank branches — median Google rating per governorate",
    name_ar: "فروع المصارف — وسيط تقييم Google حسب المحافظة",
    definition_en: "Median Google rating across bank branches per governorate.",
    definition_ar: "وسيط تقييم Google لفروع المصارف حسب المحافظة.",
    default_unit: "rating",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "bank_branch" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "governorate" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:bank:rating", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.monetary.places_money_exchange_median_rating",
    name_en: "Money exchange — median Google rating per governorate",
    name_ar: "محلّات الصرافة — وسيط تقييم Google حسب المحافظة",
    definition_en: "Median Google rating across money-exchange points per governorate.",
    definition_ar: "وسيط تقييم Google لمحلّات الصرافة حسب المحافظة.",
    default_unit: "rating",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "money_exchange" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "governorate" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:money_exchange:rating", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.hospitality.places_restaurant_median_rating",
    name_en: "Restaurants — median Google rating per governorate",
    name_ar: "المطاعم — وسيط تقييم Google حسب المحافظة",
    definition_en: "Median Google rating across restaurants per governorate.",
    definition_ar: "وسيط تقييم Google للمطاعم حسب المحافظة.",
    default_unit: "rating",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "hospitality" },
      { facet_type: "subtopic", facet_value: "restaurant" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "governorate" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:restaurant:rating", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.hospitality.places_cafe_median_rating",
    name_en: "Cafés — median Google rating per governorate",
    name_ar: "المقاهي — وسيط تقييم Google حسب المحافظة",
    definition_en: "Median Google rating across cafés per governorate.",
    definition_ar: "وسيط تقييم Google للمقاهي حسب المحافظة.",
    default_unit: "rating",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "hospitality" },
      { facet_type: "subtopic", facet_value: "cafe" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "governorate" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:cafe:rating", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.hospitality.places_hotel_median_rating",
    name_en: "Hotels — median Google rating per governorate",
    name_ar: "الفنادق — وسيط تقييم Google حسب المحافظة",
    definition_en: "Median Google rating across hotels/lodging per governorate.",
    definition_ar: "وسيط تقييم Google للفنادق ودور الإقامة حسب المحافظة.",
    default_unit: "rating",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "hospitality" },
      { facet_type: "subtopic", facet_value: "hotel" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "governorate" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:lodging:rating", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.retail.places_supermarket_median_rating",
    name_en: "Supermarkets — median Google rating per governorate",
    name_ar: "السوبرماركت — وسيط تقييم Google حسب المحافظة",
    definition_en: "Median Google rating across supermarkets per governorate.",
    definition_ar: "وسيط تقييم Google للسوبرماركت حسب المحافظة.",
    default_unit: "rating",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "retail" },
      { facet_type: "subtopic", facet_value: "supermarket" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "governorate" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:supermarket:rating", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.retail.places_gas_station_median_rating",
    name_en: "Gas stations — median Google rating per governorate",
    name_ar: "محطات الوقود — وسيط تقييم Google حسب المحافظة",
    definition_en: "Median Google rating across gas stations per governorate.",
    definition_ar: "وسيط تقييم Google لمحطات الوقود حسب المحافظة.",
    default_unit: "rating",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "retail" },
      { facet_type: "subtopic", facet_value: "gas_station" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "governorate" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:gas_station:rating", comparability: "direct", schedule: placesMonthlySchedule }],
  },
  {
    code: "mabii.environment.places_generator_shop_median_rating",
    name_en: "Generator & solar shops — median Google rating per governorate",
    name_ar: "متاجر المولّدات والطاقة الشمسية — وسيط تقييم Google حسب المحافظة",
    definition_en: "Median Google rating across generator and solar shops per governorate.",
    definition_ar: "وسيط تقييم Google لمتاجر المولّدات والطاقة الشمسية حسب المحافظة.",
    default_unit: "rating",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "environment" },
      { facet_type: "subtopic", facet_value: "generator_shop" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "governorate" },
    ],
    sources: [{ source_id: "google-places", source_native_code: "category:generator_shop:rating", comparability: "direct", schedule: placesMonthlySchedule }],
  },

  // ─── CAS — Consumer Price Index by expenditure division ─────────────
  // Source: CAS monthly CPI XLSX, base December 2013 = 100.
  // One indicator per COICOP-like division + the overall index.
  // All come from the same monthly XLSX file, so onboarding cost
  // amortises across the whole set.
  {
    code: "mabii.prices.cas_cpi_overall",
    name_en: "Consumer Price Index — overall (CAS, Dec-2013=100)",
    name_ar: "الرقم القياسي لأسعار المستهلك — العام (إدارة الإحصاء، كانون الأول 2013 = 100)",
    definition_en: "Headline Lebanese CPI as published monthly by CAS. Base December 2013 = 100.",
    definition_ar: "الرقم القياسي العام لأسعار المستهلك في لبنان كما تنشره إدارة الإحصاء شهرياً. سنة الأساس كانون الأول 2013 = 100.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      {
        source_id: "cas",
        source_native_code: "cpi.overall",
        comparability: "direct",
        schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 },
      },
    ],
    notes_en: "Known limitation: weights date to the 2004–05 household survey, dramatically understating lived inflation since 2019. Flag visible on every value.",
    notes_ar: "قيد معروف: تعود الأوزان إلى مسح الأسر 2004–2005، ما يُقلِّل بشدّة من التضخم المعاش منذ 2019. يُعرَض التنبيه على كل قيمة.",
  },
  {
    code: "mabii.prices.cas_cpi_food_beverages",
    name_en: "CPI — Food and non-alcoholic beverages",
    name_ar: "الرقم القياسي — الغذاء والمشروبات غير الكحولية",
    definition_en: "Food and non-alcoholic beverages expenditure division of Lebanon's CPI.",
    definition_ar: "قسم الغذاء والمشروبات غير الكحولية من سلّة الرقم القياسي اللبناني.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "food_prices" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.food_beverages", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },
  {
    code: "mabii.prices.cas_cpi_alcohol_tobacco",
    name_en: "CPI — Alcoholic beverages and tobacco",
    name_ar: "الرقم القياسي — المشروبات الكحولية والتبغ",
    definition_en: "Alcoholic beverages and tobacco division of Lebanon's CPI.",
    definition_ar: "قسم المشروبات الكحولية والتبغ من سلّة الرقم القياسي.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.alcohol_tobacco", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },
  {
    code: "mabii.prices.cas_cpi_clothing_footwear",
    name_en: "CPI — Clothing and footwear",
    name_ar: "الرقم القياسي — الملابس والأحذية",
    definition_en: "Clothing and footwear division of Lebanon's CPI.",
    definition_ar: "قسم الملابس والأحذية من سلّة الرقم القياسي.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.clothing_footwear", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },
  {
    code: "mabii.prices.cas_cpi_housing",
    name_en: "CPI — Housing, water, electricity, gas",
    name_ar: "الرقم القياسي — السكن والماء والكهرباء والغاز",
    definition_en: "Housing, water, electricity, gas and other fuels division of Lebanon's CPI.",
    definition_ar: "قسم السكن والماء والكهرباء والغاز وأنواع الوقود الأخرى.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.housing", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },
  {
    code: "mabii.prices.cas_cpi_furnishings",
    name_en: "CPI — Furnishings and household equipment",
    name_ar: "الرقم القياسي — الأثاث ومعدّات المنزل",
    definition_en: "Furnishings, household equipment and routine household maintenance division of Lebanon's CPI.",
    definition_ar: "قسم الأثاث ومعدّات المنزل وأشغال الصيانة الاعتيادية.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.furnishings", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },
  {
    code: "mabii.prices.cas_cpi_health",
    name_en: "CPI — Health",
    name_ar: "الرقم القياسي — الصحة",
    definition_en: "Health division of Lebanon's CPI.",
    definition_ar: "قسم الصحة من سلّة الرقم القياسي.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.health", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },
  {
    code: "mabii.prices.cas_cpi_transport",
    name_en: "CPI — Transport",
    name_ar: "الرقم القياسي — النقل",
    definition_en: "Transport division of Lebanon's CPI.",
    definition_ar: "قسم النقل من سلّة الرقم القياسي.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.transport", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },
  {
    code: "mabii.prices.cas_cpi_communications",
    name_en: "CPI — Communications",
    name_ar: "الرقم القياسي — الاتّصالات",
    definition_en: "Communications division of Lebanon's CPI.",
    definition_ar: "قسم الاتّصالات من سلّة الرقم القياسي.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.communications", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },
  {
    code: "mabii.prices.cas_cpi_recreation",
    name_en: "CPI — Recreation, amusement and culture",
    name_ar: "الرقم القياسي — الترفيه والتسلية والثقافة",
    definition_en: "Recreation, amusement and culture division of Lebanon's CPI.",
    definition_ar: "قسم الترفيه والتسلية والثقافة.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.recreation", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },
  {
    code: "mabii.prices.cas_cpi_education",
    name_en: "CPI — Education",
    name_ar: "الرقم القياسي — التعليم",
    definition_en: "Education division of Lebanon's CPI.",
    definition_ar: "قسم التعليم من سلّة الرقم القياسي.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.education", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },
  {
    code: "mabii.prices.cas_cpi_restaurants_hotels",
    name_en: "CPI — Restaurants and hotels",
    name_ar: "الرقم القياسي — المطاعم والفنادق",
    definition_en: "Restaurants and hotels division of Lebanon's CPI.",
    definition_ar: "قسم المطاعم والفنادق.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.restaurants_hotels", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },
  {
    code: "mabii.prices.cas_cpi_misc",
    name_en: "CPI — Miscellaneous goods and services",
    name_ar: "الرقم القياسي — سلع وخدمات متفرّقة",
    definition_en: "Miscellaneous goods and services division of Lebanon's CPI.",
    definition_ar: "قسم السلع والخدمات المتفرّقة.",
    default_unit: "index",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "prices" },
      { facet_type: "subtopic", facet_value: "cpi" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      { source_id: "cas", source_native_code: "cpi.misc", comparability: "direct", schedule: { cadence: "monthly", release_day_of_month: 5, grace_days: 20 } },
    ],
  },

  // ─── BDL (Banque du Liban) balance sheet ─────────────────────────────
  // Values are in thousands of LBP at BDL's reporting conventions.
  // Released twice monthly (around the 15th and end of month).
  {
    code: "mabii.monetary.bdl_gold_thousand_lbp",
    name_en: "BDL — Gold reserves (thousand LBP)",
    name_ar: "مصرف لبنان — احتياطي الذهب (آلاف الليرات اللبنانية)",
    definition_en: "Gold holdings as reported on BDL's interim balance sheet, in thousands of Lebanese pounds.",
    definition_ar: "حيازات الذهب كما ترد في الميزانية المؤقّتة لمصرف لبنان، بآلاف الليرات اللبنانية.",
    default_unit: "thousand_lbp",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "reserves" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "lbp" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "bdl",
        source_native_code: "balancesheet.gold",
        comparability: "direct",
        schedule: { cadence: "monthly", release_day_of_month: 15, grace_days: 10 },
      },
    ],
  },
  {
    code: "mabii.monetary.bdl_foreign_reserve_assets_thousand_lbp",
    name_en: "BDL — Foreign reserve assets (thousand LBP)",
    name_ar: "مصرف لبنان — الأصول الاحتياطية الأجنبية (آلاف الليرات)",
    definition_en: "Foreign reserve assets on BDL's interim balance sheet.",
    definition_ar: "الأصول الاحتياطية الأجنبية في الميزانية المؤقّتة لمصرف لبنان.",
    default_unit: "thousand_lbp",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "reserves" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "lbp" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "bdl",
        source_native_code: "balancesheet.foreign_reserve_assets",
        comparability: "direct",
        schedule: { cadence: "monthly", release_day_of_month: 15, grace_days: 10 },
      },
    ],
  },
  {
    code: "mabii.monetary.bdl_currency_in_circulation_thousand_lbp",
    name_en: "BDL — Currency in circulation outside BDL (thousand LBP)",
    name_ar: "مصرف لبنان — العملة المتداولة خارج المصرف (آلاف الليرات)",
    definition_en: "Lebanese pound currency in circulation outside the BDL on the interim balance sheet.",
    definition_ar: "النقد المتداول بالليرة خارج مصرف لبنان حسب الميزانية المؤقّتة.",
    default_unit: "thousand_lbp",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "money_supply" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "lbp" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "bdl",
        source_native_code: "balancesheet.currency_in_circulation",
        comparability: "direct",
        schedule: { cadence: "monthly", release_day_of_month: 15, grace_days: 10 },
      },
    ],
  },
  {
    code: "mabii.monetary.bdl_financial_sector_deposits_thousand_lbp",
    name_en: "BDL — Financial-sector deposits at BDL (thousand LBP)",
    name_ar: "مصرف لبنان — ودائع القطاع المالي لدى المصرف (آلاف الليرات)",
    definition_en: "Deposits of commercial banks and other financial institutions at the BDL.",
    definition_ar: "ودائع المصارف التجارية والمؤسسات المالية لدى مصرف لبنان.",
    default_unit: "thousand_lbp",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "bank_deposits" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "lbp" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "bdl",
        source_native_code: "balancesheet.financial_sector_deposits",
        comparability: "direct",
        schedule: { cadence: "monthly", release_day_of_month: 15, grace_days: 10 },
      },
    ],
  },
  {
    code: "mabii.monetary.bdl_public_sector_deposits_thousand_lbp",
    name_en: "BDL — Public-sector deposits at BDL (thousand LBP)",
    name_ar: "مصرف لبنان — ودائع القطاع العام لدى المصرف (آلاف الليرات)",
    definition_en: "Deposits of the Lebanese government and other public-sector entities at the BDL.",
    definition_ar: "ودائع الحكومة اللبنانية وجهات القطاع العام لدى مصرف لبنان.",
    default_unit: "thousand_lbp",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "monetary" },
      { facet_type: "subtopic", facet_value: "bank_deposits" },
      { facet_type: "frequency", facet_value: "monthly" },
      { facet_type: "currency_basis", facet_value: "lbp" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "bdl",
        source_native_code: "balancesheet.public_sector_deposits",
        comparability: "direct",
        schedule: { cadence: "monthly", release_day_of_month: 15, grace_days: 10 },
      },
    ],
  },

  // ─── Lebanese Ministry of Finance — Public Debt ──────────────────────
  {
    code: "mabii.fiscal.gross_public_debt_lbp",
    name_en: "Gross public debt — Ministry of Finance (LBP bn)",
    name_ar: "إجمالي الدين العام — وزارة المالية (مليارات الليرات)",
    definition_en:
      "Gross public debt as reported by the Lebanese Ministry of Finance in 'Debt & Debt Markets' quarterly. Includes domestic-currency and foreign-currency components.",
    definition_ar:
      "إجمالي الدين العام كما تنشره وزارة المالية اللبنانية في تقرير 'الدين العام وأسواقه' الفصلي. يشمل المكوّن بالعملة المحلية والمكوّن بالعملة الأجنبية.",
    default_unit: "lbp_bn",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "fiscal" },
      { facet_type: "subtopic", facet_value: "debt" },
      { facet_type: "frequency", facet_value: "quarterly" },
      { facet_type: "currency_basis", facet_value: "lbp" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "mof",
        source_native_code: "debt_report.gross_public_debt_lbp_bn",
        comparability: "direct",
        schedule: { cadence: "quarterly", grace_days: 60 },
      },
    ],
    notes_en: "AI-extracted from the MoF quarterly PDF; trust label remains 'official' because the source itself is the publisher. Sample-audited.",
    notes_ar: "مُستخرَج بالذكاء الاصطناعي من تقرير وزارة المالية الفصلي؛ يبقى تصنيف الثقة 'رسمي' لأن المصدر نفسه هو الناشر. خاضع لتدقيق العيّنات.",
  },
  {
    code: "mabii.fiscal.gross_public_debt_usd",
    name_en: "Gross public debt — Ministry of Finance (USD bn)",
    name_ar: "إجمالي الدين العام — وزارة المالية (مليارات الدولارات)",
    definition_en:
      "Gross public debt converted to USD at MoF's reported FX. AI-extracted from the quarterly debt report.",
    definition_ar:
      "إجمالي الدين العام محوَّلاً إلى الدولار بسعر الصرف المُعتمَد لدى الوزارة. مُستخرَج بالذكاء الاصطناعي من التقرير الفصلي.",
    default_unit: "usd_bn",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "fiscal" },
      { facet_type: "subtopic", facet_value: "debt" },
      { facet_type: "frequency", facet_value: "quarterly" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "mof",
        source_native_code: "debt_report.gross_public_debt_usd_bn",
        comparability: "direct",
        schedule: { cadence: "quarterly", grace_days: 60 },
      },
    ],
  },

  // ─── Sanctions (OFAC) ────────────────────────────────────────────────
  {
    code: "mabii.governance.ofac_hizballah_count",
    name_en: "OFAC SDN entries — Hizballah program (count)",
    name_ar: "إدخالات OFAC على لائحة SDN — برنامج حزب الله (عدد)",
    definition_en:
      "Count of entries on the US OFAC SDN list whose program list includes 'HIZBALLAH'. Snapshot taken at fetch time; one observation per year.",
    definition_ar:
      "عدد الإدخالات في لائحة OFAC SDN الأميركية التي يتضمّن برنامجها 'HIZBALLAH'. تُلتقط اللقطة عند السحب؛ ملاحظة واحدة في السنة.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "governance" },
      { facet_type: "subtopic", facet_value: "corruption" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "us-ofac",
        source_native_code: "sdn.programList.HIZBALLAH",
        comparability: "direct",
        schedule: {
          cadence: "annual",
          release_month_of_year: 12,
          release_day_of_month: 15,
          grace_days: 60,
          notes: "OFAC updates SDN whenever designations change; Mabii captures the end-of-year count.",
        },
      },
    ],
  },
  {
    code: "mabii.governance.ofac_lebanon_count",
    name_en: "OFAC SDN entries — Lebanon program (count)",
    name_ar: "إدخالات OFAC على لائحة SDN — برنامج لبنان (عدد)",
    definition_en:
      "Count of entries on the US OFAC SDN list whose program list includes 'LEBANON'.",
    definition_ar:
      "عدد الإدخالات في لائحة OFAC SDN الأميركية التي يتضمّن برنامجها 'LEBANON'.",
    default_unit: "count",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "governance" },
      { facet_type: "subtopic", facet_value: "corruption" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "us-ofac",
        source_native_code: "sdn.programList.LEBANON",
        comparability: "direct",
        schedule: {
          cadence: "annual",
          release_month_of_year: 12,
          release_day_of_month: 15,
          grace_days: 60,
        },
      },
    ],
  },

  // ─── Sovereign ratings (manually curated, hardcoded history) ─────────
  {
    code: "mabii.governance.sp_sovereign_rating",
    name_en: "S&P sovereign credit rating (Lebanon, long-term foreign currency)",
    name_ar: "تصنيف الائتمان السيادي لدى S&P (لبنان، عملة أجنبية طويلة الأجل)",
    definition_en:
      "S&P Global long-term foreign-currency sovereign credit rating for Lebanon, mapped to a numeric ladder (1 = D/SD, 22 = AAA). Hand-curated from public rating-action press releases.",
    definition_ar:
      "تصنيف S&P Global الائتماني السيادي للبنان بالعملة الأجنبية وللأجل الطويل، مُسقَطاً على سلّم رقمي (1 = D/SD، 22 = AAA). جُمع يدوياً من البيانات الصحفية العلنية.",
    default_unit: "rating_step",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "governance" },
      { facet_type: "subtopic", facet_value: "rule_of_law" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      {
        source_id: "sovereign-ratings",
        source_native_code: "sp.lebanon.lt_fc",
        comparability: "direct",
      },
    ],
    notes_en: "Ladder: SD/D=1, CC=2, CCC−=3, CCC=4, CCC+=5, B−=6, B=7, B+=8, BB−=9, BB=10, BB+=11, BBB−=12, BBB=13, BBB+=14, A−=15, A=16, A+=17, AA−=18, AA=19, AA+=20, AAA−=21, AAA=22.",
    notes_ar: "السلّم: SD/D=1، CC=2، CCC−=3، CCC=4، CCC+=5، B−=6، B=7، B+=8، BB−=9، BB=10، BB+=11، BBB−=12، BBB=13، BBB+=14، A−=15، A=16، A+=17، AA−=18، AA=19، AA+=20، AAA−=21، AAA=22.",
  },
  {
    code: "mabii.governance.moodys_sovereign_rating",
    name_en: "Moody's sovereign credit rating (Lebanon, long-term foreign currency)",
    name_ar: "تصنيف الائتمان السيادي لدى Moody's (لبنان، عملة أجنبية طويلة الأجل)",
    definition_en:
      "Moody's long-term foreign-currency sovereign credit rating for Lebanon, mapped to a numeric ladder (1 = C, 22 = Aaa). Hand-curated from public rating-action press releases.",
    definition_ar:
      "تصنيف Moody's الائتماني السيادي للبنان بالعملة الأجنبية وللأجل الطويل، مُسقَطاً على سلّم رقمي (1 = C، 22 = Aaa).",
    default_unit: "rating_step",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "governance" },
      { facet_type: "subtopic", facet_value: "rule_of_law" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "index" },
      { facet_type: "geography_level", facet_value: "country" },
    ],
    sources: [
      {
        source_id: "sovereign-ratings",
        source_native_code: "moodys.lebanon.lt_fc",
        comparability: "direct",
      },
    ],
  },

  // ─── Humanitarian ────────────────────────────────────────────────────
  {
    code: "mabii.humanitarian.registered_refugees",
    name_en: "Registered refugees in Lebanon (UNHCR)",
    name_ar: "اللاجئون المسجّلون في لبنان (UNHCR)",
    definition_en:
      "Total persons registered with UNHCR in Lebanon as refugees, across all countries of origin. Annual end-of-period figure.",
    definition_ar:
      "إجمالي الأشخاص المسجّلين لدى المفوضية السامية للأمم المتحدة لشؤون اللاجئين في لبنان كلاجئين من جميع بلدان المنشأ. الرقم بنهاية كل سنة.",
    default_unit: "persons",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "humanitarian" },
      { facet_type: "subtopic", facet_value: "refugees" },
      { facet_type: "frequency", facet_value: "annual" },
      { facet_type: "currency_basis", facet_value: "count" },
      { facet_type: "geography_level", facet_value: "country" },
      { facet_type: "stock_or_flow", facet_value: "stock" },
    ],
    sources: [
      {
        source_id: "hdx",
        source_native_code: "unhcr.population.refugees",
        comparability: "direct",
        schedule: {
          cadence: "annual",
          release_month_of_year: 6, // UNHCR mid-year update
          secondary_release_month: 12,
          release_day_of_month: 30,
          grace_days: 60,
        },
        reconciliation_notes: "Sum across all countries of origin (coo) for Lebanon as country of asylum (coa).",
      },
    ],
    notes_en: "UNHCR registration is the largest publicly available count but undercounts Palestinian refugees (under UNRWA mandate, separate dataset).",
    notes_ar: "تسجيل UNHCR هو أكبر عَدّ علني متاح، لكنه يُقلِّل من تقدير اللاجئين الفلسطينيين (الخاضعين لولاية الأونروا، بيانات منفصلة).",
  },

  {
    code: "mabii.real_estate.rent_median_usd",
    name_en: "Residential rent — median asking price (USD/month)",
    name_ar: "الإيجار السكني — وسيط السعر المطلوب (دولار/شهر)",
    definition_en:
      "Median monthly asking rent for apartments and villas listed on OLX Lebanon, by governorate. Mabii publishes the weekly median + sample size per governorate — never the raw listings. Outlier-trimmed (P5–P95). No official source publishes Lebanese rent statistics; this is a Mabii-originated indicator.",
    definition_ar:
      "وسيط الإيجار الشهري المطلوب للشقق والفلل المعروضة على OLX لبنان، حسب المحافظة. تنشر مَبني الوسيط الأسبوعي وحجم العيّنة لكل محافظة — لا الإعلانات الخام. مُشذَّب من القيم الشاذّة. لا مصدر رسمي ينشر إحصاءات الإيجار؛ هذا مؤشر من إنتاج مَبني.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "real_estate" },
      { facet_type: "subtopic", facet_value: "rent" },
      { facet_type: "frequency", facet_value: "weekly" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "flow" },
    ],
    sources: [
      {
        source_id: "olx-lebanon",
        source_native_code: "listings.properties.rent",
        comparability: "direct",
        reconciliation_notes:
          "Server-rendered listing cards parsed weekly; median per governorate, outlier-trimmed P5–P95. Sample size on every value.",
        schedule: { cadence: "weekly", grace_days: 4 },
      },
    ],
    primary_source_id: "olx-lebanon",
    notes_en:
      "Asking prices (what landlords list), not transaction prices. Trust label 'modeled'. Coverage skews to Beirut + Mount Lebanon where OLX listings concentrate.",
    notes_ar:
      "أسعار مطلوبة (ما يعرضه المالكون) لا أسعار معاملات فعلية. تصنيف الثقة ‘نموذجي’. التغطية تميل إلى بيروت وجبل لبنان حيث تتركّز الإعلانات.",
  },
  {
    code: "mabii.real_estate.sale_price_median_usd",
    name_en: "Apartment sale price — median asking price (USD)",
    name_ar: "سعر بيع الشقق — وسيط السعر المطلوب (دولار)",
    definition_en:
      "Median asking sale price for apartments and villas listed for sale on OLX Lebanon, by governorate. Weekly median + sample size per governorate; raw listings not stored. Outlier-trimmed (P5–P95).",
    definition_ar:
      "وسيط سعر البيع المطلوب للشقق والفلل المعروضة للبيع على OLX لبنان، حسب المحافظة. وسيط أسبوعي وحجم عيّنة لكل محافظة؛ لا تُخزَّن الإعلانات الخام. مُشذَّب من القيم الشاذّة.",
    default_unit: "USD",
    geography_id: "LBN",
    facets: [
      { facet_type: "topic", facet_value: "real_estate" },
      { facet_type: "subtopic", facet_value: "sale_price" },
      { facet_type: "frequency", facet_value: "weekly" },
      { facet_type: "currency_basis", facet_value: "usd" },
      { facet_type: "geography_level", facet_value: "governorate" },
      { facet_type: "stock_or_flow", facet_value: "flow" },
    ],
    sources: [
      {
        source_id: "olx-lebanon",
        source_native_code: "listings.properties.sale",
        comparability: "direct",
        reconciliation_notes:
          "Server-rendered listing cards parsed weekly; median per governorate, outlier-trimmed P5–P95.",
        schedule: { cadence: "weekly", grace_days: 4 },
      },
    ],
    primary_source_id: "olx-lebanon",
    notes_en:
      "Asking prices, not transaction prices. Trust 'modeled'. Coverage skews to Beirut + Mount Lebanon.",
    notes_ar:
      "أسعار مطلوبة لا معاملات فعلية. تصنيف ‘نموذجي’. التغطية تميل إلى بيروت وجبل لبنان.",
  },
  {
    code: "mabii.transport.used_car_median_price_usd",
    name_en: "Used cars — median asking price (USD)",
    name_ar: "السيارات المستعملة — وسيط السعر المطلوب (دولار)",
    definition_en:
      "National median asking price for used cars listed on OLX Lebanon. Weekly median + sample size; raw listings not stored. Outlier-trimmed (P5–P95). A per-(make, model, year) breakdown is planned once structured attribute parsing lands.",
    definition_ar:
      "الوسيط الوطني للسعر المطلوب للسيارات المستعملة المعروضة على OLX لبنان. وسيط أسبوعي وحجم عيّنة؛ لا تُخزَّن الإعلانات الخام. مُشذَّب من القيم الشاذّة. يُخطَّط لتفصيل حسب (الماركة، الموديل، السنة) لاحقاً.",
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
          "Server-rendered listing cards parsed weekly; national median, outlier-trimmed P5–P95.",
        schedule: { cadence: "weekly", grace_days: 4 },
      },
    ],
    primary_source_id: "olx-lebanon",
    notes_en:
      "Asking prices, not transaction prices. Trust 'modeled'. Per-model breakdown deferred until attribute parsing is added.",
    notes_ar:
      "أسعار مطلوبة لا معاملات فعلية. تصنيف ‘نموذجي’. تفصيل حسب الموديل مؤجَّل.",
  },
];

export function getIndicator(code: string): Indicator | undefined {
  return indicators.find((i) => i.code === code);
}
