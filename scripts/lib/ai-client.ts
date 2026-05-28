// Cheap-tier OpenAI client for Mabii. Used only at onboarding /
// AI-assisted extraction time. Never in the request path (SPEC §5).
//
// Pattern ported from mabii-menu/src/lib/openai/client.ts.
// Model deliberately fixed to gpt-4o-mini — cheapest tier that produces
// reliable structured output for Mabii's per-PDF extraction tasks.

import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Required only for AI-assisted PDF/HTML extraction. Get a key at https://platform.openai.com/api-keys."
      );
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

/** The single permitted model for Mabii AI work — cheapest tier with reliable JSON-mode output. */
export const MABII_EXTRACTION_MODEL = "gpt-4o-mini";
