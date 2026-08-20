import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import { isValidCategory }           from '@/lib/types'
import type { ApiResponse, Category, SourceType } from '@/lib/types'
import {
  MODEL_EXTRACT,
  GPT_OSS_REASONING_EFFORT,
  TOKENS_EXTRACT,
  extractJson,
} from '@/lib/constants/models'

// ── TYPES ─────────────────────────────────────────────────────────

export type FieldConfidence = 'high' | 'medium' | 'low' | null

export type UnderstandResult = {
  // Core fields
  title:        string | null
  category:     Category | null
  subtype:      string | null
  source_name:  string | null
  source_type:  SourceType | null
  note:         string | null

  // Per-field confidence — not one score for the whole response
  confidence: {
    title:       FieldConfidence
    category:    FieldConfidence
    subtype:     FieldConfidence
    source_name: FieldConfidence
    source_type: FieldConfidence
  }

  // Signals for clarification logic
  transcription_quality: 'clear' | 'unclear' | 'partial'
  multiple_items:        string[] | null
  input_language:        'english' | 'hindi' | 'hinglish' | 'other'

  // Supplementary metadata extracted inline
  // Stored in card metadata, not top-level fields
  supplementary: {
    what_to_order?: string | null  // dine
    dates?:         string | null  // visit
    director?:      string | null  // watch
    author?:        string | null  // read
    location_hint?: string | null  // dine/do/visit
    // Session 18 — the Jawaan failure. A user said "starring Shah Rukh" and
    // the phrase had nowhere to go: only director and author existed, so the
    // single strongest disambiguating signal a person can give was discarded
    // at capture, before matching ever ran. Named people are never accidental.
    people?:        string[] | null  // watch/listen/read — actors, artists, authors
    // Soft evidence, never a filter. Speech mangles years and people misremember
    // them; this is here to be weighed, not to exclude anything.
    year?:          number | null
  }

  // What clarification is needed, if any — computed by this route, not the LLM
  clarification: {
    needed:   boolean
    field:    string | null
    question: string | null
    type:     'text_input' | 'select' | null
    options:  string[] | null
  }

  // Raw input preserved for echo check audit
  raw_input: string
}

// ── VALID VALUES ──────────────────────────────────────────────────

const VALID_SOURCE_TYPES = new Set([
  'friend', 'family', 'colleague', 'instagram', 'twitter',
  'youtube', 'article', 'newsletter', 'podcast', 'self',
])

// Canonical subcategory vocabulary (Session 10 — folk-motif system).
// Aliases are accepted so legacy captures and natural LLM phrasings still pass;
// the motif registry maps every key here to a true medallion.
const VALID_SUBTYPES: Record<string, string[]> = {
  watch:  ['film', 'series', 'documentary'],
  listen: ['album', 'podcast', 'audiobook', 'artist'],
  read:   ['fiction', 'non-fiction', 'poetry'],
  dine:   ['restaurant', 'cafe', 'café', 'bar', 'street food'],
  do:     ['hike', 'trail', 'adventure', 'workshop', 'live show'],
  visit:  ['museum', 'gallery', 'heritage', 'viewpoint', 'market'],
}

// ── SYSTEM PROMPT ─────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an intelligent data extraction engine for Taareef, a personal recommendation vault app used primarily by Indian users.

Your job is to extract structured information from user input — which may be transcribed speech, OCR text from a screenshot, or typed text — and return a valid JSON object. Nothing else. No preamble. No explanation. No markdown fences. Only the raw JSON object.

━━━ EXTRACTION RULES ━━━

RULE 1 — NEVER INVENT.
If a field is not present or strongly implied in the input, return null for that field. A null field is correct. An invented field is a critical failure. When in doubt, return null.

RULE 2 — TITLE MUST EXIST IN INPUT.
The extracted title must appear verbatim or near-verbatim in the input text. If you cannot find a clear title, return null. Do not substitute a title you think the user meant. Do not complete a partial title unless the completion is unambiguous (e.g. "Breaking B" → "Breaking Bad" is acceptable. "that chef show" → null, not "The Bear").

RULE 3 — CONSTRAINED FIELDS.
For category, subtype, and source_type, return only the exact string values listed below or null. No other values are permitted.

RULE 4 — CONFIDENCE PER FIELD.
Score each field independently. High = clearly present and unambiguous. Medium = strongly implied but not explicit. Low = inferred with uncertainty. Null = field not present or extracted.

RULE 5 — INDIAN AND HINGLISH CONTEXT.
Input will frequently contain Hindi-English mixed language (Hinglish). Indian names (Priya, Rohit, Arjun, Meera, Kabir, Ananya), Indian films (Gangs of Wasseypur, Laapataa Ladies, Mughal-E-Azam, Panchayat), Indian restaurants, and Indian cultural references are common. Extract them exactly as spoken or written. Never translate. Never anglicise.

RULE 6 — MULTIPLE ITEMS.
If the input contains more than one recommendation (e.g. a list of films, a screenshot with several books), do not pick one. Return all titles in multiple_items as an array. Set title to null.

RULE 7 — TRANSCRIPTION QUALITY.
If the input contains filler words (um, uh, like), self-corrections, trailing off, or contradictions — mark transcription_quality as "unclear". If the input is complete but terse — mark "partial". If the input is natural and complete — mark "clear".

RULE 8 — SUPPLEMENTARY EXTRACTION.
Extract supplementary context if present without being asked:
- For dine: what specific dish, drink, or item was mentioned (what_to_order)
- For visit: any closing date, run dates, or deadline mentioned (dates)
- For watch: director or creator mentioned (director)
- For watch/listen/read: any PEOPLE named — actors, artists, authors, hosts (people, as an array). "starring Shah Rukh" → ["Shah Rukh"]. Extract exactly as spoken; never correct or complete a name.
- Any YEAR mentioned (year, as a number). Extract even if it sounds wrong — it is weighed later, never used to exclude.
- For read: author mentioned (author)
- For dine/do/visit: city or neighbourhood hint (location_hint).
     Extract ONLY the neighbourhood or city name — never relational phrases.
     "the one near Carter Road, Bandra" → "Bandra"
     "close to Juhu beach" → "Juhu"
     "in South Mumbai" → "South Mumbai"
     "next to the mall in Andheri" → "Andheri"
     If a city and neighbourhood are both present, prefer the neighbourhood.
These go in the supplementary object. Never invent them.

━━━ VALID VALUES ━━━

CATEGORY (pick one or null):
watch, listen, read, dine, do, visit

SUBTYPE per category (pick one or null):
- watch: film, series, documentary
- listen: album, podcast, audiobook, artist
- read: fiction, non-fiction, poetry
- dine: restaurant, cafe, bar, street food
- do: hike, trail, adventure, workshop, live show
- visit: museum, gallery, heritage, viewpoint, market

SOURCE_TYPE (pick one or null):
friend, family, colleague, instagram, twitter, youtube, article, newsletter, podcast, self

CONFIDENCE (per field):
"high" | "medium" | "low" | null

━━━ OUTPUT FORMAT ━━━

Return exactly this JSON structure and nothing else:

{
  "title": string | null,
  "category": string | null,
  "subtype": string | null,
  "source_name": string | null,
  "source_type": string | null,
  "note": string | null,
  "confidence": {
    "title": "high" | "medium" | "low" | null,
    "category": "high" | "medium" | "low" | null,
    "subtype": "high" | "medium" | "low" | null,
    "source_name": "high" | "medium" | "low" | null,
    "source_type": "high" | "medium" | "low" | null
  },
  "transcription_quality": "clear" | "unclear" | "partial",
  "multiple_items": string[] | null,
  "input_language": "english" | "hindi" | "hinglish" | "other",
  "supplementary": {
    "what_to_order": string | null,
    "dates": string | null,
    "director": string | null,
    "people": string[] | null,
    "year": number | null,
    "author": string | null,
    "location_hint": string | null
  }
}

━━━ EXAMPLES ━━━

Input: [VOICE TRANSCRIPT]: Rohit told me to watch Fight Club, the David Fincher one
Output: {"title":"Fight Club","category":"watch","subtype":"film","source_name":"Rohit","source_type":"friend","note":"David Fincher film","confidence":{"title":"high","category":"high","subtype":"high","source_name":"high","source_type":"medium"},"transcription_quality":"clear","multiple_items":null,"input_language":"english","supplementary":{"what_to_order":null,"dates":null,"director":"David Fincher","author":null,"location_hint":null}}

Input: [VOICE TRANSCRIPT]: Priya ne bola try karo that new place in Bandra with wood fired pizza
Output: {"title":null,"category":"dine","subtype":"restaurant","source_name":"Priya","source_type":"friend","note":"wood fired pizza in Bandra","confidence":{"title":null,"category":"high","subtype":"medium","source_name":"high","source_type":"high"},"transcription_quality":"clear","multiple_items":null,"input_language":"hinglish","supplementary":{"what_to_order":"wood fired pizza","dates":null,"director":null,"author":null,"location_hint":"Bandra"}}

Input: [VOICE TRANSCRIPT]: uh that show everyone keeps talking about, breaking, breaking bad I think, Arjun said
Output: {"title":"Breaking Bad","category":"watch","subtype":"series","source_name":"Arjun","source_type":"friend","note":null,"confidence":{"title":"medium","category":"high","subtype":"high","source_name":"high","source_type":"medium"},"transcription_quality":"unclear","multiple_items":null,"input_language":"english","supplementary":{"what_to_order":null,"dates":null,"director":null,"author":null,"location_hint":null}}

Input: [OCR TEXT]: screenshot of an Instagram post listing Dune, Oppenheimer and Poor Things as must watch films
Output: {"title":null,"category":"watch","subtype":"film","source_name":null,"source_type":"instagram","note":"must watch films","confidence":{"title":null,"category":"high","subtype":"high","source_name":null,"source_type":"high"},"transcription_quality":"clear","multiple_items":["Dune","Oppenheimer","Poor Things"],"input_language":"english","supplementary":{"what_to_order":null,"dates":null,"director":null,"author":null,"location_hint":null}}

Input: [VOICE TRANSCRIPT]: that thing Meera was talking about
Output: {"title":null,"category":null,"subtype":null,"source_name":"Meera","source_type":"friend","note":null,"confidence":{"title":null,"category":null,"subtype":null,"source_name":"high","source_type":"medium"},"transcription_quality":"partial","multiple_items":null,"input_language":"english","supplementary":{"what_to_order":null,"dates":null,"director":null,"author":null,"location_hint":null}}

Input: [TYPED]: Gangs of Wasseypur
Output: {"title":"Gangs of Wasseypur","category":"watch","subtype":"film","source_name":null,"source_type":null,"note":null,"confidence":{"title":"high","category":"high","subtype":"high","source_name":null,"source_type":null},"transcription_quality":"clear","multiple_items":null,"input_language":"english","supplementary":{"what_to_order":null,"dates":null,"director":null,"author":null,"location_hint":null}}

Input: [VOICE TRANSCRIPT]: yaar ye dekh, Laapataa Ladies, bahut achhi hai
Output: {"title":"Laapataa Ladies","category":"watch","subtype":"film","source_name":null,"source_type":"self","note":"bahut achhi hai","confidence":{"title":"high","category":"high","subtype":"high","source_name":null,"source_type":"low"},"transcription_quality":"clear","multiple_items":null,"input_language":"hinglish","supplementary":{"what_to_order":null,"dates":null,"director":null,"author":null,"location_hint":null}}

Input: [VOICE TRANSCRIPT]: Bandra mein ek Lebanese place hai, Kabir bata raha tha, must try
Output: {"title":null,"category":"dine","subtype":"restaurant","source_name":"Kabir","source_type":"friend","note":"Lebanese restaurant, must try","confidence":{"title":null,"category":"high","subtype":"medium","source_name":"high","source_type":"high"},"transcription_quality":"clear","multiple_items":null,"input_language":"hinglish","supplementary":{"what_to_order":null,"dates":null,"director":null,"author":null,"location_hint":"Bandra"}}

Input: [VOICE TRANSCRIPT]: Meera said read Midnight's Children, Salman Rushdie
Output: {"title":"Midnight's Children","category":"read","subtype":"fiction","source_name":"Meera","source_type":"friend","note":null,"confidence":{"title":"high","category":"high","subtype":"high","source_name":"high","source_type":"medium"},"transcription_quality":"clear","multiple_items":null,"input_language":"english","supplementary":{"what_to_order":null,"dates":null,"director":null,"author":"Salman Rushdie","location_hint":null}}

Input: [VOICE TRANSCRIPT]: there's this podcast about Indian startups, forgot the name, Ananya was telling me
Output: {"title":null,"category":"listen","subtype":"podcast","source_name":"Ananya","source_type":"friend","note":"podcast about Indian startups","confidence":{"title":null,"category":"high","subtype":"high","source_name":"high","source_type":"medium"},"transcription_quality":"partial","multiple_items":null,"input_language":"english","supplementary":{"what_to_order":null,"dates":null,"director":null,"author":null,"location_hint":null}}

Input: [VOICE TRANSCRIPT]: um that uh the one with the guy from that show you know
Output: {"title":null,"category":null,"subtype":null,"source_name":null,"source_type":null,"note":null,"confidence":{"title":null,"category":null,"subtype":null,"source_name":null,"source_type":null},"transcription_quality":"unclear","multiple_items":null,"input_language":"english","supplementary":{"what_to_order":null,"dates":null,"director":null,"author":null,"location_hint":null}}`

// ── ECHO CHECK — programmatic hallucination guard ─────────────────
// If LLM returns a title, verify it has meaningful overlap with raw input.
// Prevents the LLM from substituting a known title for something vague.

function echoCheck(title: string | null, rawInput: string): boolean {
  if (!title) return true // null is always valid
  const normalise = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\u0900-\u097f\s]/g, '').trim()
  const normTitle = normalise(title)
  const normInput = normalise(rawInput)

  // Every word in the title (> 3 chars) must appear in the input
  const titleWords = normTitle.split(/\s+/).filter(w => w.length > 3)
  if (titleWords.length === 0) return true // very short title — allow

  const matchCount = titleWords.filter(w => normInput.includes(w)).length
  const matchRatio = matchCount / titleWords.length

  // Require at least 60% word overlap
  return matchRatio >= 0.60
}

// ── CLARIFICATION LOGIC ───────────────────────────────────────────
// Computes what single question to ask, if any.
// Never asks more than one. Prioritises by impact on enrichment quality.

function computeClarification(
  result:   Omit<UnderstandResult, 'clarification' | 'raw_input'>,
  rawInput: string,
): UnderstandResult['clarification'] {

  const none = { needed: false, field: null, question: null, type: null, options: null } as const

  // Multiple items in input — must pick one before saving
  if (result.multiple_items && result.multiple_items.length > 1) {
    return {
      needed:   true,
      field:    'title',
      question: 'Which one did you want to save?',
      type:     'select',
      options:  result.multiple_items,
    }
  }

  // Title missing entirely — nothing else matters without it
  if (!result.title) {
    // If we have a category hint, make the question more specific
    const categoryHint = result.category
      ? `What's the ${result.category === 'dine' ? 'name of the place' : result.category === 'read' ? 'title of the book' : result.category === 'listen' ? 'title' : 'title'}?`
      : "What did you want to save?"
    return {
      needed:   true,
      field:    'title',
      question: categoryHint,
      type:     'text_input',
      options:  null,
    }
  }

  // Title failed echo check — likely hallucinated
  if (!echoCheck(result.title, rawInput)) {
    return {
      needed:   true,
      field:    'title',
      question: `Did you mean "${result.title}"?`,
      type:     'select',
      options:  [result.title, 'No, let me type it'],
    }
  }

  // Transcription was unclear and title is only medium confidence
  if (
    result.transcription_quality === 'unclear' &&
    result.confidence.title === 'medium'
  ) {
    return {
      needed:   true,
      field:    'title',
      question: `Did you mean "${result.title}"?`,
      type:     'select',
      options:  [result.title, 'No, let me type it'],
    }
  }

  // Category missing — needed for correct enrichment routing
  if (!result.category) {
    return {
      needed:   true,
      field:    'category',
      question: 'Where does this belong?',
      type:     'select',
      options:  ['Watch', 'Listen', 'Read', 'Dine', 'Do', 'Visit'],
    }
  }

  // Source missing only for person sources — platforms don't need names
  if (
    !result.source_name &&
    (!result.source_type || result.source_type === 'friend' || result.source_type === 'family' || result.source_type === 'colleague')
  ) {
    // Don't ask — source is optional. User can add it on the confirmation screen.
    return none
  }

  // Location hint missing for place-based categories (dine, visit, do)
  // Without a city or area, Foursquare searches globally and can return
  // the wrong venue. One light question dramatically improves enrichment.
  // Only ask when: title is confirmed, category is a place, and hint is absent.
  const placeCategories = ['dine', 'visit', 'do']
  if (
    placeCategories.includes(result.category ?? '') &&
    !result.supplementary?.location_hint &&
    result.title &&
    (result.confidence.title === 'high' || result.confidence.title === 'medium')
  ) {
    return {
      needed:   true,
      field:    'location_hint',
      question: 'Which city or area is this in?',
      type:     'text_input',
      options:  null,
    }
  }

  return none
}

// ── SANITISE LLM OUTPUT ───────────────────────────────────────────
// Validates and clamps LLM output to known-good values.
// Never trust the LLM to perfectly obey the prompt every single time.

function sanitise(raw: Record<string, unknown>, originalInput: string): Omit<UnderstandResult, 'clarification' | 'raw_input'> {
  const validConfidence = new Set(['high', 'medium', 'low'])
  const conf = (raw.confidence as Record<string, unknown>) ?? {}

  const toConf = (v: unknown): FieldConfidence =>
    validConfidence.has(v as string) ? (v as FieldConfidence) : null

  const toStr = (v: unknown): string | null =>
    typeof v === 'string' && v.trim() !== '' ? v.trim() : null

  // Capped at 6: a person naming more than six people is describing, not
  // identifying, and a long list dilutes the veto rather than sharpening it.
  const toStrArray = (v: unknown): string[] | null => {
    if (!Array.isArray(v)) return null
    const out = v
      .filter((x): x is string => typeof x === 'string')
      .map(x => x.trim())
      .filter(x => x.length > 1)
      .slice(0, 6)
    return out.length > 0 ? out : null
  }

  // A model may return "2024", 2024, or something absurd. Anything outside a
  // plausible range is treated as absent rather than passed on as evidence.
  const toYear = (v: unknown): number | null => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v, 10) : NaN
    if (!Number.isFinite(n)) return null
    return n >= 1850 && n <= 2100 ? n : null
  }

  // Category — must be one of our 6
  const rawCat = toStr(raw.category)
  const category = rawCat && isValidCategory(rawCat) ? rawCat as Category : null

  // Subtype — must be valid for the detected category
  const rawSubtype = toStr(raw.subtype)
  const validSubtypes = category ? (VALID_SUBTYPES[category] ?? []) : []
  const subtype = rawSubtype && validSubtypes.includes(rawSubtype) ? rawSubtype : null

  // Source type — must be in our enum
  const rawSourceType = toStr(raw.source_type)
  const source_type = rawSourceType && VALID_SOURCE_TYPES.has(rawSourceType)
    ? rawSourceType as SourceType
    : null

  // Title — extracted then echo-checked (echo check happens in clarification logic)
  const title = toStr(raw.title)

  // Multiple items — must be array of strings
  const multiple_items = Array.isArray(raw.multiple_items) && raw.multiple_items.length > 1
    ? (raw.multiple_items as unknown[]).map(String).filter(s => s.trim() !== '')
    : null

  // Transcription quality
  const tq = raw.transcription_quality
  const transcription_quality: UnderstandResult['transcription_quality'] =
    tq === 'clear' || tq === 'unclear' || tq === 'partial' ? tq : 'clear'

  // Input language
  const il = raw.input_language
  const input_language: UnderstandResult['input_language'] =
    il === 'english' || il === 'hindi' || il === 'hinglish' || il === 'other' ? il : 'english'

  // Supplementary
  const sup = (raw.supplementary as Record<string, unknown>) ?? {}

  return {
    title,
    category,
    subtype,
    source_name: toStr(raw.source_name),
    source_type,
    note:        toStr(raw.note),
    confidence: {
      title:       toConf(conf.title),
      category:    toConf(conf.category),
      subtype:     toConf(conf.subtype),
      source_name: toConf(conf.source_name),
      source_type: toConf(conf.source_type),
    },
    transcription_quality,
    multiple_items,
    input_language,
    supplementary: {
      what_to_order: toStr(sup.what_to_order),
      dates:         toStr(sup.dates),
      director:      toStr(sup.director),
      author:        toStr(sup.author),
      location_hint: toStr(sup.location_hint),
      people:        toStrArray(sup.people),
      year:          toYear(sup.year),
    },
  }
}

// ── ROUTE ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'You must be logged in' }, { status: 401 }
      )
    }

    const body = await request.json() as {
      input:        string
      input_type:   'voice' | 'ocr' | 'typed'
    }

    if (!body.input || !body.input.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No input provided' }, { status: 400 }
      )
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Understanding engine not configured' }, { status: 503 }
      )
    }

    // Format prefix so the LLM knows what kind of input it is dealing with
    const prefixMap = {
      voice:  'VOICE TRANSCRIPT',
      ocr:    'OCR TEXT',
      typed:  'TYPED',
    }
    const prefix       = prefixMap[body.input_type] ?? 'TYPED'
    const formattedMsg = `[${prefix}]: ${body.input.trim()}`

    console.log(`[understand] input_type=${body.input_type} length=${body.input.length}`)

    const llmRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:             MODEL_EXTRACT,
        max_tokens:        TOKENS_EXTRACT,
        temperature:       0.0,  // Zero temperature — deterministic, no creativity
        reasoning_effort:  GPT_OSS_REASONING_EFFORT,
        include_reasoning: false,
        response_format:   { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: formattedMsg  },
        ],
      }),
    })

    if (!llmRes.ok) {
      const errText = await llmRes.text()
      console.error('[understand] Groq error:', errText)
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Could not process input — please try again' }, { status: 503 }
      )
    }

    const llmJson      = await llmRes.json()
    const choice       = llmJson.choices?.[0]
    const rawContent   = (choice?.message?.content ?? '') as string
    const finishReason = choice?.finish_reason ?? 'unknown'

    // finish_reason === 'length' means the token budget was exhausted — usually
    // by reasoning tokens. That is a config problem, not a bad-input problem.
    const jsonText = extractJson(rawContent)

    let rawExtracted: Record<string, unknown>
    try {
      if (!jsonText) throw new Error('no JSON object found in completion')
      rawExtracted = JSON.parse(jsonText) as Record<string, unknown>
    } catch (parseErr) {
      console.error(
        `[understand] parse failed model=${MODEL_EXTRACT} finish_reason=${finishReason} ` +
        `len=${rawContent.length} err=${String(parseErr)} raw="${rawContent.slice(0, 400)}"`
      )
      const truncated = finishReason === 'length'
      return NextResponse.json<ApiResponse<null>>(
        {
          data:  null,
          error: truncated
            ? 'That was a lot to read — try a shorter or cropped screenshot'
            : 'Could not understand input — please try again',
        },
        { status: truncated ? 413 : 422 }
      )
    }

    // Sanitise — clamp to valid values, strip anything invalid
    const sanitised = sanitise(rawExtracted, body.input)

    // Compute clarification — what single question to ask, if any
    const clarification = computeClarification(sanitised, body.input)

    const result: UnderstandResult = {
      ...sanitised,
      clarification,
      raw_input: body.input,
    }

    console.log(`[understand] title="${result.title}" category="${result.category}" clarification=${result.clarification.needed}`)

    return NextResponse.json<ApiResponse<UnderstandResult>>({
      data:  result,
      error: null,
    })

  } catch (err) {
    console.error('[POST /api/capture/understand] unexpected:', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' }, { status: 500 }
    )
  }
}
