import type { Dictionary } from "@/lib/i18n/dictionaries";

export type FreshnessStatus = "fresh" | "due_soon" | "stale" | "no_schedule";

const styleFor: Record<FreshnessStatus, { color: string; bg: string }> = {
  fresh: { color: "var(--color-flag-ok)", bg: "#e5f1e8" },
  due_soon: { color: "var(--color-flag-low-conf)", bg: "#f5e8cc" },
  stale: { color: "var(--color-flag-stale)", bg: "#f1e1de" },
  no_schedule: { color: "var(--color-ink-mute)", bg: "var(--color-rule-soft)" },
};

export function FreshnessBadge({
  status,
  dict,
}: {
  status: FreshnessStatus;
  dict: Dictionary;
}) {
  const s = styleFor[status];
  return (
    <span
      className="inline-block rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
      style={{
        background: s.bg,
        color: s.color,
        fontFamily: "var(--font-sans)",
        letterSpacing: "0.05em",
      }}
    >
      {dict.freshness[status]}
    </span>
  );
}

/** Heuristic for v0: annual sources are fresh up to 16 months, due_soon to 24, stale beyond. */
export function freshnessForAnnualSeries(
  lastObservedYear: number | undefined,
  now = new Date()
): FreshnessStatus {
  if (!lastObservedYear) return "no_schedule";
  const currentYear = now.getUTCFullYear();
  const gap = currentYear - lastObservedYear;
  if (gap <= 1) return "fresh";
  if (gap === 2) return "due_soon";
  return "stale";
}
