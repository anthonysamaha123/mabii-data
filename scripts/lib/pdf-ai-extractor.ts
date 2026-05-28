// PDF / text → structured-data extractor. Built on the cheapest available
// model (gpt-4o-mini). The pattern mirrors mabii-menu/src/lib/openai/parse-menu.ts:
//
//   1. Try the cheap deterministic path first (pdf-parse to extract text,
//      then an optional regex/rule-based parser supplied by the caller).
//   2. Only if that yields no result, fall back to a single AI call with
//      a Zod schema for structured output.
//
// AI is the last resort, and even then we use the cheapest tier. SPEC §2.9
// ("AI proposes, code disposes") and §5 ("AI is never in the request path")
// govern this: every extracted value is validated through Zod, and the
// caller is responsible for sample-auditing AI-derived figures.

import { z, type ZodTypeAny } from "zod";
import { getOpenAI, MABII_EXTRACTION_MODEL } from "./ai-client";
import { fetchJson } from "./connector-utils";

export interface PdfTextExtraction {
  text: string;
  /** Buffer reference if caller needs raw bytes for hashing. */
  byteLength: number;
}

/** Step 1 (free): fetch a PDF and run pdf-parse for text. Deterministic, no AI. */
export async function extractPdfText(url: string): Promise<PdfTextExtraction> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: {
      "user-agent":
        "Mabii/0.1 (https://mabii.org; contact: hello@mabii.org)",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  // Dynamic import — pdf-parse is heavy and only used on the AI/PDF path.
  const pdfParse = (await import("pdf-parse")).default;
  const parsed = await pdfParse(buf);
  return { text: parsed.text ?? "", byteLength: buf.byteLength };
}

interface AiExtractOptions<T extends ZodTypeAny> {
  /** System prompt describing the extraction task. */
  systemPrompt: string;
  /** User text — typically the pdf-parse output. */
  userText: string;
  /** Zod schema the model output must conform to. */
  schema: T;
  /** Max output tokens. Default 1024 keeps cost predictable. */
  maxTokens?: number;
}

/**
 * Step 2 (cheap-AI fallback): call gpt-4o-mini with response_format=json_object
 * and Zod-validate the result. Returns the parsed value or throws.
 *
 * Cost guard: one call ≈ $0.0001–0.001 depending on input length, well under
 * a cent for the kind of single-table extractions Mabii does on source PDFs.
 */
export async function aiExtract<T extends ZodTypeAny>({
  systemPrompt,
  userText,
  schema,
  maxTokens = 1024,
}: AiExtractOptions<T>): Promise<z.infer<T>> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: MABII_EXTRACTION_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText },
    ],
    response_format: { type: "json_object" },
    max_tokens: maxTokens,
    temperature: 0,
  });

  const choice = response.choices[0];
  if (choice.finish_reason === "length") {
    throw new Error("AI extraction truncated; reduce input or raise maxTokens.");
  }

  const raw = JSON.parse(choice.message.content || "{}");
  return schema.parse(raw);
}

/**
 * Convenience: PDF URL → structured data using the two-step pattern.
 * - `rulesBased`: optional caller-supplied parser that runs first on the
 *   raw text. If it returns a value matching the schema, no AI is called.
 * - Otherwise, falls through to aiExtract().
 */
export async function extractFromPdf<T extends ZodTypeAny>(opts: {
  url: string;
  schema: T;
  rulesBased?: (text: string) => z.infer<T> | null;
  aiSystemPrompt: string;
  /** Cap on text length passed to AI to keep cost bounded. Default 20k chars. */
  aiMaxChars?: number;
}): Promise<{ value: z.infer<T>; pathway: "rules_based" | "ai"; bytes: number; chars: number }> {
  const { text, byteLength } = await extractPdfText(opts.url);

  if (opts.rulesBased) {
    const ruled = opts.rulesBased(text);
    if (ruled !== null) {
      // Validate even rules-based output through Zod to catch shape drift.
      const validated = opts.schema.parse(ruled);
      return { value: validated, pathway: "rules_based", bytes: byteLength, chars: text.length };
    }
  }

  const aiInput = text.slice(0, opts.aiMaxChars ?? 20_000);
  const value = await aiExtract({
    systemPrompt: opts.aiSystemPrompt,
    userText: aiInput,
    schema: opts.schema,
  });
  return { value, pathway: "ai", bytes: byteLength, chars: text.length };
}

/** Re-exported so connectors that only need raw JSON fetching share the helper. */
export { fetchJson };
