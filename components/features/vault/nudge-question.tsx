// components/features/vault/nudge-question.tsx
// One question shown at the top of the home screen on every visit.
// Disappears immediately when answered. Never repeats.
// Feels like natural curiosity — not a survey.

'use client'

import { useState } from 'react'
import type { NudgeQuestion } from '@/constants/nudge-questions'

type NudgeQuestionCardProps = {
  question: NudgeQuestion
  onAnswer: (questionId: string, value: string) => Promise<void>
}

export function NudgeQuestionCard({
  question,
  onAnswer,
}: NudgeQuestionCardProps) {
  const [isAnswering, setIsAnswering] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  async function handleAnswer(value: string) {
    if (isAnswering) return
    setIsAnswering(true)

    try {
      await onAnswer(question.id, value)
      // Trigger dismiss animation
      setIsDismissing(true)
    } catch {
      // Silent fail — nudge question is never critical
      setIsAnswering(false)
    }
  }

  return (
    <div
      className={[
        'mx-4 mb-3',
        'bg-surface-card rounded-2xl',
        'border border-surface-border',
        'shadow-card',
        'overflow-hidden',
        'transition-all duration-300',
        'animate-nudge-enter gpu',
        isDismissing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100',
      ].join(' ')}
      role="region"
      aria-label="Quick question"
    >
      <div className="px-5 pt-4 pb-3">
        {/* Label */}
        <p className="text-[10px] font-sans font-600 text-neutral-400 uppercase tracking-widest mb-2">
          Quick question
        </p>

        {/* Question */}
        <p className="font-sans text-nudge text-neutral-800 leading-snug mb-4">
          {question.question}
        </p>

        {/* Options */}
        <div className="flex flex-wrap gap-2">
          {question.options.map(option => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              disabled={isAnswering}
              className={[
                'px-3.5 py-2 rounded-full',
                'font-sans text-chip font-600',
                'border border-neutral-200',
                'text-neutral-700',
                'transition-all duration-150',
                'hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600',
                'active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'no-tap-highlight focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-primary-400',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
