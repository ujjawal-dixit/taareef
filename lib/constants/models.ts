// lib/constants/models.ts
//
// SINGLE SOURCE OF TRUTH for every Groq model ID used in Taareef.
//
// WHY THIS FILE EXISTS (Session 15, 2026-07-26):
// Groq deprecates models aggressively — roughly a 6-month half-life. On
// 2026-07-17 `meta-llama/llama-4-scout-17b-16e-instruct` was shut down,
// which silently killed screenshot capture for 9 days before anyone
// noticed, because the model ID was a bare string literal buried in a
// route file. Model IDs now live here, and only here.
//
// WHEN GROQ SENDS A DEPRECATION EMAIL:
// 1. Check https://console.groq.com/docs/deprecations
// 2. Update the ID below and the SHUTDOWN comment beside it
// 3. Deploy. That is the entire migration.
//
// Verified against Groq's deprecation page on 2026-07-26.

/** Vision / OCR — reads screenshots. Currently the only vision model Groq hosts. */
export const MODEL_VISION = 'qwen/qwen3.6-27b'
// Replaced meta-llama/llama-4-scout-17b-16e-instruct (shut down 2026-07-17).
// Limits: 20MB max request size with image, max 5 images per request, 131K context.

/** Capture extraction — turns freeform text into a structured recommendation. */
export const MODEL_EXTRACT = 'openai/gpt-oss-120b'
// Replaced llama-3.3-70b-versatile (shutdown 2026-08-16).

/** Place disambiguation — constrained classification, favours speed. */
export const MODEL_DISAMBIGUATE = 'openai/gpt-oss-20b'
// Replaced llama-3.1-8b-instant (shutdown 2026-08-16).

/** Audio transcription. Not currently deprecated. */
export const MODEL_TRANSCRIBE = 'whisper-large-v3-turbo'

/** Groq chat completions endpoint. */
export const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'

/** Groq's model catalogue. Used by the health check to detect retired models. */
export const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models'

/**
 * Every model this app depends on, with the user-facing feature it powers.
 * The health check iterates this list — adding a model here is enough to
 * bring it under monitoring.
 */
export const CONFIGURED_MODELS: ReadonlyArray<{ id: string; powers: string }> = [
  { id: MODEL_VISION,       powers: 'screenshot scanning' },
  { id: MODEL_EXTRACT,      powers: 'capture extraction (all three capture methods)' },
  { id: MODEL_DISAMBIGUATE, powers: 'place matching for Dine / Visit / Experience' },
  { id: MODEL_TRANSCRIBE,   powers: 'voice capture' },
]

/**
 * Hard ceiling Groq enforces on a request containing an image (20MB).
 * We target well below it after client-side compression.
 */
export const VISION_MAX_REQUEST_BYTES = 20 * 1024 * 1024

/**
 * Reasoning controls.
 *
 * GPT-OSS models reason before answering, and those reasoning tokens are
 * drawn from the SAME max_tokens budget as the answer. With a small budget
 * the model can spend everything thinking and return empty or truncated
 * content — which is what broke extraction on 2026-07-26.
 *
 * Groq does not support `reasoning_format` on GPT-OSS; use these instead.
 */
export const GPT_OSS_REASONING_EFFORT = 'low'   // gpt-oss: 'low' | 'medium' | 'high'
export const QWEN_REASONING_EFFORT    = 'none'  // qwen3:   'none' | 'default'

/**
 * Token budgets. Deliberately generous: reasoning tokens are billed against
 * these, so a budget sized only for the answer will starve the answer.
 */
export const TOKENS_VISION       = 2000
export const TOKENS_EXTRACT      = 3000
export const TOKENS_DISAMBIGUATE = 1500

/**
 * Pulls a JSON object out of a model completion.
 *
 * Handles, in order: reasoning traces (<think>), markdown fences, and any
 * conversational preamble or trailing commentary around the object. Returns
 * null when no plausible JSON object is present, so callers can log the raw
 * text rather than throwing on a parse.
 */
export function extractJson(text: string): string | null {
  if (!text) return null

  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const start = cleaned.indexOf('{')
  const end   = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null

  return cleaned.slice(start, end + 1)
}

/**
 * Strips reasoning traces from prose (non-JSON) completions.
 * Safe on any completion — a no-op when no trace is present.
 */
export function stripReasoning(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}
