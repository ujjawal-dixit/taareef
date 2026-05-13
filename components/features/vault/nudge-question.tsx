// components/features/vault/nudge-question.tsx
// Home screen nudge — one question per visit.
// Disappears on answer. Never repeats.
// Feels like the app is curious about you — not a survey.

'use client'

import { useState } from 'react'
import type { NudgeQuestion } from '@/constants/nudge-questions'

type Props = {
  question: NudgeQuestion
  onAnswer: (questionId: string, value: string) => Promise<void>
}

export function NudgeQuestionCard({ question, onAnswer }: Props) {
  const [isAnswering,  setIsAnswering]  = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  async function handleAnswer(value: string) {
    if (isAnswering) return
    setIsAnswering(true)
    try {
      await onAnswer(question.id, value)
      setIsDismissing(true)
    } catch {
      setIsAnswering(false)
    }
  }

  return (
    <div
      className="nudge-card"
      role="region"
      aria-label="Quick question"
      style={{
        opacity:   isDismissing ? 0 : 1,
        transform: isDismissing ? 'translateY(-8px)' : 'translateY(0)',
        transition:'opacity 280ms ease, transform 280ms ease',
        pointerEvents: isDismissing ? 'none' : 'auto',
      }}
    >
      {/* Label */}
      <p style={{
        fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
        fontSize:      '10px',
        fontWeight:    '700',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color:         'var(--text-tertiary)',
        margin:        '0 0 8px',
      }}>
        Quick question
      </p>

      {/* Question */}
      <p style={{
        fontFamily: 'var(--font-fraunces), Georgia, serif',
        fontSize:   '16px',
        fontWeight: '500',
        color:      'var(--text-primary)',
        lineHeight: '1.35',
        margin:     '0 0 16px',
      }}>
        {question.question}
      </p>

      {/* Options */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {question.options.map(option => (
          <button
            key={option.value}
            onClick={() => handleAnswer(option.value)}
            disabled={isAnswering}
            className="nudge-option"
            style={{ opacity: isAnswering ? 0.5 : 1 }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
