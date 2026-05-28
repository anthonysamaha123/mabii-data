"use client";

import { useState } from "react";

export function CiteThis({ citation }: { citation: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="flex items-start gap-3 rounded border p-3 text-sm"
      style={{
        borderColor: "var(--color-rule)",
        background: "var(--color-bg-elev)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <code
        className="flex-1"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--color-ink)",
          background: "transparent",
          whiteSpace: "pre-wrap",
        }}
      >
        {citation}
      </code>
      <button
        onClick={copy}
        className="shrink-0 px-2 py-1 text-xs"
        style={{
          border: "1px solid var(--color-rule)",
          background: "var(--color-bg)",
          color: "var(--color-ink)",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
