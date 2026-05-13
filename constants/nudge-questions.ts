// constants/nudge-questions.ts
// Home screen nudge questions — one per visit, until answered.
// Every question must: (1) help us serve the user better,
// (2) feel like natural curiosity, not a survey.
// Questions are shown in order — never random, never repeated.

export type NudgeQuestion = {
  id: string
  question: string
  options: {
    label: string
    value: string
  }[]
  // Which user preference this updates
  updatesPreference: string
}

export const NUDGE_QUESTIONS: NudgeQuestion[] = [
  {
    id: 'nq-recommendation-arrival',
    question: 'Where do most of your recommendations come from?',
    options: [
      { label: 'Friends & family', value: 'friends' },
      { label: 'Social media', value: 'social' },
      { label: 'Articles & newsletters', value: 'articles' },
      { label: 'A mix of everything', value: 'mixed' },
    ],
    updatesPreference: 'primary_source',
  },
  {
    id: 'nq-restaurant-timing',
    question: 'When someone recommends a restaurant, do you usually go...',
    options: [
      { label: 'Within a week', value: 'fast' },
      { label: 'When the moment is right', value: 'patient' },
      { label: 'Honestly, I often forget', value: 'forgetful' },
    ],
    updatesPreference: 'restaurant_timing',
  },
  {
    id: 'nq-film-discovery',
    question: 'Do you prefer discovering films...',
    options: [
      { label: 'From people I trust', value: 'personal' },
      { label: 'From critics & reviews', value: 'critics' },
      { label: 'Stumbling across them', value: 'serendipity' },
    ],
    updatesPreference: 'film_discovery',
  },
  {
    id: 'nq-music-save-type',
    question: 'When someone shares music, it\'s usually...',
    options: [
      { label: 'A specific song', value: 'song' },
      { label: 'An album to sit with', value: 'album' },
      { label: 'An artist to explore', value: 'artist' },
    ],
    updatesPreference: 'music_default_subcategory',
  },
  {
    id: 'nq-experience-solo-group',
    question: 'Do you usually experience recommendations...',
    options: [
      { label: 'Alone', value: 'solo' },
      { label: 'With someone', value: 'together' },
      { label: 'Both equally', value: 'both' },
    ],
    updatesPreference: 'experience_default',
  },
  {
    id: 'nq-vault-browse-intent',
    question: 'When you open your vault, you\'re usually...',
    options: [
      { label: 'Looking for something specific', value: 'specific' },
      { label: 'Just browsing', value: 'browse' },
      { label: 'Both equally', value: 'both' },
    ],
    updatesPreference: 'browse_intent',
  },
  {
    id: 'nq-tell-source',
    question: 'After you experience something, do you usually tell the person who recommended it?',
    options: [
      { label: 'Almost always', value: 'always' },
      { label: 'Sometimes', value: 'sometimes' },
      { label: 'Rarely', value: 'rarely' },
    ],
    updatesPreference: 'tell_source_habit',
  },
  {
    id: 'nq-city-travel-frequency',
    question: 'How often do you travel to new cities?',
    options: [
      { label: 'A few times a year', value: 'frequent' },
      { label: 'Once a year or so', value: 'occasional' },
      { label: 'Rarely, but I dream about it', value: 'aspirational' },
    ],
    updatesPreference: 'travel_frequency',
  },
]

// Total questions available
export const TOTAL_NUDGE_QUESTIONS = NUDGE_QUESTIONS.length

// Get question by index — returns null when all questions are answered
export function getNudgeQuestion(answeredCount: number): NudgeQuestion | null {
  if (answeredCount >= NUDGE_QUESTIONS.length) return null
  return NUDGE_QUESTIONS[answeredCount] ?? null
}
