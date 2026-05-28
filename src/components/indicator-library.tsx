"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/dictionaries";

export interface LibRow {
  code: string;
  name: string;
  topic: string;
  topicLabel: string;
  subtopicLabel: string | null;
  latestValue: number | null;
  valueDisplay: string;
  unit: string;
  period: string;
  sourceName: string | null;
  trust: string | null;
  spark: number[];
  geoLevel: string;
  govCount: number;
}

const TRUST_STYLE: Record<string, { c: string; bg: string }> = {
  official: { c: "var(--color-ink)", bg: "var(--color-rule-soft)" },
  proxy: { c: "var(--color-ink)", bg: "#e9e4d6" },
  modeled: { c: "var(--color-flag-low-conf)", bg: "#f5e8cc" },
  reference: { c: "var(--color-ink-mute)", bg: "var(--color-rule-soft)" },
};

function RowSparkline({ data }: { data: number[] }) {
  if (data.length < 2) {
    return <div style={{ width: 120, height: 28 }} aria-hidden />;
  }
  const w = 120;
  const h = 28;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || Math.abs(min) || 1;
  const stepX = (w - pad * 2) / (data.length - 1);
  const pts = data
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (h - pad * 2) * (1 - (v - min) / span);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = data[data.length - 1];
  const lastX = pad + (data.length - 1) * stepX;
  const lastY = pad + (h - pad * 2) * (1 - (last - min) / span);
  const rising = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ display: "block" }}>
      <polyline
        points={pts}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2} fill={rising ? "var(--color-flag-ok)" : "var(--color-flag-stale)"} />
    </svg>
  );
}

export function IndicatorLibrary({
  rows,
  locale,
  sourceCount,
  labels,
}: {
  rows: LibRow[];
  locale: Locale;
  sourceCount: number;
  labels: {
    title: string;
    searchPlaceholder: string;
    indicators: string;
    sources: string;
    topics: string;
    results: string;
    clear: string;
    noResults: string;
    latest: string;
    governorates: string;
  };
}) {
  const [q, setQ] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const topics = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) if (!seen.has(r.topic)) seen.set(r.topic, r.topicLabel);
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (activeTopic && r.topic !== activeTopic) return false;
      if (!needle) return true;
      return (
        r.name.toLowerCase().includes(needle) ||
        r.code.toLowerCase().includes(needle) ||
        r.topicLabel.toLowerCase().includes(needle) ||
        (r.subtopicLabel ?? "").toLowerCase().includes(needle) ||
        (r.sourceName ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, activeTopic]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; items: LibRow[] }>();
    for (const r of filtered) {
      const g = map.get(r.topic) ?? { label: r.topicLabel, items: [] };
      g.items.push(r);
      map.set(r.topic, g);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].label.localeCompare(b[1].label));
  }, [filtered]);

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* summary stat bar */}
      <div
        className="mb-5 flex flex-wrap gap-x-8 gap-y-2 border-b pb-4"
        style={{ borderColor: "var(--color-rule)" }}
      >
        <Stat n={rows.length} label={labels.indicators} />
        <Stat n={sourceCount} label={labels.sources} />
        <Stat n={topics.length} label={labels.topics} />
      </div>

      {/* search */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={labels.searchPlaceholder}
        className="mb-4 w-full border px-3 py-2 text-sm outline-none"
        style={{
          borderColor: "var(--color-rule)",
          background: "var(--color-bg-elev)",
          color: "var(--color-ink)",
          fontFamily: "var(--font-sans)",
        }}
      />

      {/* topic chips */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        <Chip active={activeTopic === null} onClick={() => setActiveTopic(null)} label={labels.topics + ` (${rows.length})`} />
        {topics.map(([t, lbl]) => (
          <Chip
            key={t}
            active={activeTopic === t}
            onClick={() => setActiveTopic(activeTopic === t ? null : t)}
            label={`${lbl} (${rows.filter((r) => r.topic === t).length})`}
          />
        ))}
      </div>

      <div
        className="mb-3 text-xs"
        style={{ color: "var(--color-ink-mute)" }}
      >
        {labels.results}: {filtered.length}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--color-ink-soft)" }}>{labels.noResults}</p>
      ) : (
        grouped.map(([topic, { label, items }]) => (
          <section key={topic} className="mb-9">
            <h2
              className="mb-2 text-xs uppercase tracking-wider"
              style={{ color: "var(--color-ink-soft)", letterSpacing: "0.07em" }}
            >
              {label} · {items.length}
            </h2>
            <div
              className="overflow-hidden border"
              style={{ borderColor: "var(--color-rule)", background: "var(--color-bg-elev)" }}
            >
              {items.map((r, i) => (
                <Link
                  key={r.code}
                  href={`/${locale}/indicators/${r.code}`}
                  className="flex items-center gap-4 px-4 py-3 no-underline transition-colors hover:bg-[var(--color-bg)]"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--color-rule-soft)",
                    color: "var(--color-ink)",
                  }}
                >
                  {/* name + sub */}
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate"
                      style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 15 }}
                    >
                      {r.name}
                    </div>
                    <div className="truncate text-xs" style={{ color: "var(--color-ink-mute)" }}>
                      {r.subtopicLabel ? `${r.subtopicLabel} · ` : ""}
                      {r.sourceName ?? ""}
                      {r.geoLevel === "governorate" ? ` · ${r.govCount} ${labels.governorates}` : ""}
                    </div>
                  </div>

                  {/* sparkline */}
                  <div className="hidden shrink-0 sm:block">
                    <RowSparkline data={r.spark} />
                  </div>

                  {/* value */}
                  <div className="shrink-0 text-right" style={{ width: 116 }}>
                    <div
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        fontSize: 16,
                        color: "var(--color-ink)",
                      }}
                    >
                      {r.valueDisplay}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-ink-mute)" }}>
                      {r.unit === "%" ? "%" : r.unit} · {r.period}
                    </div>
                  </div>

                  {/* trust */}
                  <div className="hidden shrink-0 md:block" style={{ width: 64 }}>
                    {r.trust && (
                      <span
                        className="inline-block rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
                        style={{
                          background: (TRUST_STYLE[r.trust] ?? TRUST_STYLE.reference).bg,
                          color: (TRUST_STYLE[r.trust] ?? TRUST_STYLE.reference).c,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {r.trust}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          fontFamily: "var(--font-serif)",
          color: "var(--color-ink)",
          lineHeight: 1.1,
        }}
      >
        {n}
      </div>
      <div className="text-xs uppercase tracking-wider" style={{ color: "var(--color-ink-mute)", letterSpacing: "0.05em" }}>
        {label}
      </div>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 text-xs transition-colors"
      style={{
        border: "1px solid var(--color-rule)",
        background: active ? "var(--color-accent)" : "var(--color-bg-elev)",
        color: active ? "#fff" : "var(--color-ink-soft)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
      }}
    >
      {label}
    </button>
  );
}
