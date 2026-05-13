// components/ui/button.tsx
// Taareef Button — all variants.
// Primary: warm terracotta. Secondary: outlined. Ghost: text only.
// All variants have proper focus, disabled, and loading states.
// Never use a plain <button> element anywhere in the app — always use this.

'use client'

import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'full'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-primary-500 text-white',
    'hover:bg-primary-600 active:bg-primary-700',
    'disabled:bg-primary-200 disabled:text-primary-400',
    'shadow-fab',
  ].join(' '),

  secondary: [
    'bg-transparent text-primary-500 border border-primary-300',
    'hover:bg-primary-50 active:bg-primary-100',
    'disabled:border-neutral-200 disabled:text-neutral-400',
  ].join(' '),

  ghost: [
    'bg-transparent text-neutral-600',
    'hover:bg-neutral-100 active:bg-neutral-200',
    'disabled:text-neutral-300',
  ].join(' '),

  danger: [
    'bg-transparent text-error border border-red-200',
    'hover:bg-red-50 active:bg-red-100',
    'disabled:border-neutral-200 disabled:text-neutral-400',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm:   'h-9 px-4 text-sm rounded-lg',
  md:   'h-11 px-6 text-button rounded-xl',
  lg:   'h-12 px-8 text-button rounded-xl',
  full: 'h-12 w-full px-6 text-button rounded-xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    className = '',
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={[
        // Base styles — all buttons share these
        'inline-flex items-center justify-center gap-2',
        'font-sans font-semibold',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'no-tap-highlight select-none',
        // Variant and size
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </button>
  )
})

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

Button.displayName = 'Button'

export { Button }
export type { ButtonVariant, ButtonSize, ButtonProps }
