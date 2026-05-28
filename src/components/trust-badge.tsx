import type { TrustLabel } from "@/data/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const styleFor: Record<TrustLabel, { color: string; bg: string }> = {
  official: { color: "var(--color-ink)", bg: "var(--color-rule-soft)" },
  proxy: { color: "var(--color-ink)", bg: "#e9e4d6" },
  modeled: { color: "var(--color-flag-low-conf)", bg: "#f5e8cc" },
  reference: { color: "var(--color-ink-mute)", bg: "var(--color-rule-soft)" },
};

export function TrustBadge({
  label,
  dict,
}: {
  label: TrustLabel;
  dict: Dictionary;
}) {
  const s = styleFor[label];
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
      {dict.trust[label]}
    </span>
  );
}
