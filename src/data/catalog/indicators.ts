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
