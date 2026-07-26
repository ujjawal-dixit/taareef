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

/**
 * Hard ceiling Groq enforces on a request containing an image (20MB).
 * We target well below it after client-side compression.
 */
export const VISION_MAX_REQUEST_BYTES = 20 * 1024 * 1024

/**
 * Strips reasoning traces from models that emit them (Qwen 3.6 has a
 * thinking mode). Safe to run on any completion — a no-op when absent.
 */
export function stripReasoning(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}
