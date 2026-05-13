// components/ui/input.tsx
// Taareef Input — text fields and textareas.
// Warm, minimal, never clinical.
// Always has an associated label — accessibility non-negotiable.

'use client'

import { forwardRef } from 'react'

// ============================================================
// TEXT INPUT
// ============================================================

type InputProps = {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
} & React.InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    id,
    className = '',
    ...props
  },
  ref
) {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2, 9)}`
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-meta font-sans font-500 text-neutral-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          >
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          className={[
            'w-full h-11 rounded-xl border',
            'bg-surface-card text-neutral-900',
            'font-sans text-body placeholder:text-neutral-400',
            'transition-colors duration-150',
            // Border states
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-surface-border focus:border-primary-400 focus:ring-primary-400/20',
            // Focus ring
            'focus:outline-none focus:ring-2',
            // Left padding when icon present
            leftIcon ? 'pl-10 pr-4' : 'px-4',
            // Disabled state
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ].join(' ')}
          {...props}
        />
      </div>

      {hint && !error && (
        <p id={hintId} className="text-meta text-neutral-400">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-meta text-error">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// ============================================================
// TEXTAREA
// ============================================================

type TextareaProps = {
  label?: string
  hint?: string
  error?: string
  maxLength?: number
  showCount?: boolean
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    maxLength,
    showCount = false,
    id,
    value,
    className = '',
    ...props
  },
  ref
) {
  const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2, 9)}`
  const hintId = hint ? `${textareaId}-hint` : undefined
  const errorId = error ? `${textareaId}-error` : undefined
  const currentLength = typeof value === 'string' ? value.length : 0

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-meta font-sans font-500 text-neutral-700"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        value={value}
        maxLength={maxLength}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? 'true' : undefined}
        className={[
          'w-full rounded-xl border px-4 py-3',
          'bg-surface-card text-neutral-900',
          'font-sans text-body placeholder:text-neutral-400',
          'transition-colors duration-150 resize-none',
          error
            ? 'border-error focus:border-error focus:ring-error/20'
            : 'border-surface-border focus:border-primary-400 focus:ring-primary-400/20',
          'focus:outline-none focus:ring-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      />

      <div className="flex justify-between items-center">
        {hint && !error && (
          <p id={hintId} className="text-meta text-neutral-400">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-meta text-error">
            {error}
          </p>
        )}
        {showCount && maxLength && (
          <p className={[
            'text-meta ml-auto',
            currentLength >= maxLength ? 'text-error' : 'text-neutral-400',
          ].join(' ')}>
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
})

Textarea.displayName = 'Textarea'

// ============================================================
// NATURAL LANGUAGE INPUT
// The save flow input — single warm field, generous placeholder
// ============================================================

type NaturalInputProps = {
  onSubmit?: (value: string) => void
} & Omit<TextareaProps, 'onSubmit'>

const NaturalInput = forwardRef<HTMLTextAreaElement, NaturalInputProps>(function NaturalInput(
  {
    onSubmit,
    placeholder = 'A restaurant, film, book — anything someone told you about...',
    className = '',
    ...props
  },
  ref
) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Submit on Enter (not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const value = (e.target as HTMLTextAreaElement).value.trim()
      if (value && onSubmit) {
        onSubmit(value)
      }
    }
  }

  return (
    <textarea
      ref={ref}
      rows={3}
      placeholder={placeholder}
      onKeyDown={handleKeyDown}
      className={[
        'w-full rounded-2xl border-0 px-5 py-4',
        'bg-neutral-50 text-neutral-900',
        'font-sans text-body placeholder:text-neutral-400',
        'focus:outline-none focus:ring-2 focus:ring-primary-400/30',
        'resize-none transition-shadow duration-200',
        'shadow-inner',
        className,
      ].join(' ')}
      {...props}
    />
  )
})

NaturalInput.displayName = 'NaturalInput'

export { Input, Textarea, NaturalInput }
export type { InputProps, TextareaProps, NaturalInputProps }
