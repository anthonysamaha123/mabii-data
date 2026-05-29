"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/dictionaries";
import type { Respondent, SurveyQuestion } from "@/data/survey/questions";

interface Bundle {
  anchors: SurveyQuestion[];
  core: SurveyQuestion[];
  module: SurveyQuestion[];
  moduleLabel: string;
}

export interface SurveyLabels {
  preview_banner: string;
  intro_title: string;
  intro_body: string;
  as_person: string;
  as_business: string;
  section_about_person: string;
  section_about_business: string;
  section_core: string;
  section_module: string;
  progress: string; // "{n} of {total}"
  submit: string;
  back: string;
  done_title: string;
  done_body: string;
  done_again: string;
  optional: string;
}

export function SurveyForm({
  person,
  business,
  locale,
  labels,
}: {
  person: Bundle;
  business: Bundle;
  locale: Locale;
  labels: SurveyLabels;
}) {
  const [phase, setPhase] = useState<"choose" | "form" | "done">("choose");
  const [respondent, setRespondent] = useState<Respondent>("person");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const bundle = respondent === "person" ? person : business;
  const allQ = useMemo(
    () => [...bundle.anchors, ...bundle.core, ...bundle.module],
    [bundle]
  );
  const answeredCount = allQ.filter((q) => answers[q.id]).length;

  function pick(respondentChoice: Respondent) {
    setRespondent(respondentChoice);
    setAnswers({});
    setPhase("form");
  }

  function setAnswer(id: string, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  // ── choose ──
  if (phase === "choose") {
    return (
      <Shell labels={labels}>
        <h1 className="mb-3 text-3xl" style={{ fontWeight: 600 }}>
          {labels.intro_title}
        </h1>
        <p className="mb-8 max-w-2xl" style={{ color: "var(--color-ink-soft)", lineHeight: 1.6 }}>
          {labels.intro_body}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 sm:max-w-xl">
          <ChoiceCard label={labels.as_person} onClick={() => pick("person")} />
          <ChoiceCard label={labels.as_business} onClick={() => pick("business")} />
        </div>
      </Shell>
    );
  }

  // ── done ──
  if (phase === "done") {
    return (
      <Shell labels={labels}>
        <div
          className="mx-auto max-w-xl border p-8 text-center"
          style={{ borderColor: "var(--color-rule)", background: "var(--color-bg-elev)" }}
        >
          <div className="mb-2 text-2xl" style={{ fontWeight: 600 }}>
            {labels.done_title}
          </div>
          <p className="mb-6" style={{ color: "var(--color-ink-soft)", lineHeight: 1.6 }}>
            {labels.done_body.replace("{n}", String(answeredCount))}
          </p>
          <button
            onClick={() => setPhase("choose")}
            className="px-4 py-2 text-sm no-underline"
            style={{ border: "1px solid var(--color-rule)", background: "var(--color-bg)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            {labels.done_again}
          </button>
        </div>
      </Shell>
    );
  }

  // ── form ──
  const aboutLabel =
    respondent === "person" ? labels.section_about_person : labels.section_about_business;

  return (
    <Shell labels={labels}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          onClick={() => setPhase("choose")}
          className="text-sm"
          style={{ color: "var(--color-ink-mute)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)" }}
        >
          ← {labels.back}
        </button>
        <div className="text-xs" style={{ color: "var(--color-ink-mute)", fontFamily: "var(--font-sans)" }}>
          {labels.progress.replace("{n}", String(answeredCount)).replace("{total}", String(allQ.length))}
        </div>
      </div>
      {/* progress bar */}
      <div className="mb-8 h-1 w-full" style={{ background: "var(--color-rule-soft)" }}>
        <div
          className="h-1 transition-all"
          style={{ width: `${(answeredCount / allQ.length) * 100}%`, background: "var(--color-accent)" }}
        />
      </div>

      <Section title={aboutLabel}>
        {bundle.anchors.map((q) => (
          <Question key={q.id} q={q} locale={locale} value={answers[q.id]} onPick={(v) => setAnswer(q.id, v)} optional={labels.optional} />
        ))}
      </Section>

      <Section title={labels.section_core}>
        {bundle.core.map((q) => (
          <Question key={q.id} q={q} locale={locale} value={answers[q.id]} onPick={(v) => setAnswer(q.id, v)} optional={labels.optional} />
        ))}
      </Section>

      <Section title={`${labels.section_module} — ${bundle.moduleLabel}`}>
        {bundle.module.map((q) => (
          <Question key={q.id} q={q} locale={locale} value={answers[q.id]} onPick={(v) => setAnswer(q.id, v)} optional={labels.optional} />
        ))}
      </Section>

      <button
        onClick={() => setPhase("done")}
        disabled={answeredCount === 0}
        className="mt-4 px-5 py-2.5 text-sm"
        style={{
          background: answeredCount === 0 ? "var(--color-rule)" : "var(--color-accent)",
          color: "#fff",
          border: "none",
          cursor: answeredCount === 0 ? "not-allowed" : "pointer",
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
        }}
      >
        {labels.submit}
      </button>
    </Shell>
  );
}

function Shell({ labels, children }: { labels: SurveyLabels; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div
        className="mb-8 border-l-4 px-4 py-2 text-xs"
        style={{ borderColor: "var(--color-flag-low-conf)", background: "#f5e8cc", color: "#6b4e00", fontFamily: "var(--font-sans)" }}
      >
        {labels.preview_banner}
      </div>
      {children}
    </div>
  );
}

function ChoiceCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="border p-6 text-left text-lg transition-colors hover:bg-[var(--color-bg-elev)]"
      style={{
        borderColor: "var(--color-rule)",
        background: "var(--color-bg-elev)",
        color: "var(--color-ink)",
        cursor: "pointer",
        fontFamily: "var(--font-serif)",
        fontWeight: 600,
      }}
    >
      {label} →
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="mb-4 text-xs uppercase tracking-wider"
        style={{ color: "var(--color-ink-soft)", letterSpacing: "0.07em", fontFamily: "var(--font-sans)" }}
      >
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Question({
  q,
  locale,
  value,
  onPick,
  optional,
}: {
  q: SurveyQuestion;
  locale: Locale;
  value: string | undefined;
  onPick: (v: string) => void;
  optional: string;
}) {
  const prompt = locale === "ar" ? q.prompt_ar : q.prompt_en;
  return (
    <div>
      <div className="mb-2" style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 500 }}>
        {prompt}
        {q.sensitive && (
          <span className="ml-2 text-[10px]" style={{ color: "var(--color-ink-mute)" }}>
            ({optional})
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {(q.options ?? []).map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onPick(opt.value)}
              className="px-3 py-1.5 text-sm transition-colors"
              style={{
                border: `1px solid ${active ? "var(--color-accent)" : "var(--color-rule)"}`,
                background: active ? "var(--color-accent)" : "var(--color-bg-elev)",
                color: active ? "#fff" : "var(--color-ink-soft)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {locale === "ar" ? opt.label_ar : opt.label_en}
            </button>
          );
        })}
      </div>
    </div>
  );
}
