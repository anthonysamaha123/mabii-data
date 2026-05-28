import type { Locale } from "@/lib/i18n/dictionaries";

const COMPACT_THRESHOLD = 1_000_000;

export function formatNumber(
  value: number | null | undefined,
  unit: string,
  locale: Locale
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const bcp = locale === "ar" ? "ar-LB" : "en-US";

  if (unit === "%") {
    return new Intl.NumberFormat(bcp, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(value);
  }
  if (unit === "USD") {
    if (Math.abs(value) >= COMPACT_THRESHOLD) {
      return new Intl.NumberFormat(bcp, {
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value);
    }
    return new Intl.NumberFormat(bcp, {
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (unit === "persons") {
    return new Intl.NumberFormat(bcp, {
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat(bcp, {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string | undefined, locale: Locale): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return iso;
  const bcp = locale === "ar" ? "ar-LB" : "en-GB";
  return new Intl.DateTimeFormat(bcp, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function formatYear(iso: string): string {
  return iso.slice(0, 4);
}

export function formatPercent(value: number, locale: Locale): string {
  const bcp = locale === "ar" ? "ar-LB" : "en-US";
  const sign = value > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat(bcp, {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export function relativeTime(iso: string | undefined, locale: Locale): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return iso;
  const diffSec = Math.round((then - Date.now()) / 1000);
  const bcp = locale === "ar" ? "ar-LB" : "en-US";
  const rtf = new Intl.RelativeTimeFormat(bcp, { numeric: "auto" });
  const absSec = Math.abs(diffSec);
  if (absSec < 60) return rtf.format(diffSec, "second");
  if (absSec < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (absSec < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (absSec < 2_592_000) return rtf.format(Math.round(diffSec / 86400), "day");
  if (absSec < 31_536_000)
    return rtf.format(Math.round(diffSec / 2_592_000), "month");
  return rtf.format(Math.round(diffSec / 31_536_000), "year");
}
