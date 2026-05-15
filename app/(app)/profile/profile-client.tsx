'use client'

// app/(app)/profile/profile-client.tsx
// The feedback form lives on the profile page.
// It resets after submission — can be used multiple times.
// Never interrupts the vault flow.

import { FeedbackCard } from '@/components/features/feedback/feedback-card'

type Props = {
  userEmail: string
  userName:  string
  saveCount: number
  topSource: string | null
}

export function ProfileClient({ userEmail, userName, saveCount, topSource }: Props) {
  // Feedback card handles its own sent/reset state internally
  return (
    <FeedbackCard
      userEmail={userEmail}
      userName={userName}
      saveCount={saveCount}
      topSource={topSource}
      // On profile page, dismissal just resets — never hides permanently
      onDismiss={() => {}} // no-op: card always stays on profile page
    />
  )
}
