// components/ui/toast.tsx
// Taareef Toast — warm, non-intrusive notifications.
// Auto-dismisses. Never blocks interaction.
// Used for: save confirmation, errors, sync status.

'use client'

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'

// ============================================================
// TYPES
// ============================================================

type ToastVariant = 'default' | 'success' | 'error' | 'warning'

type Toast = {
  id: string
  message: string
  variant?: ToastVariant
  duration?: number   // ms — default 3000
}

type ToastContextType = {
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void
  removeToast: (id: string) => void
}

// ============================================================
// CONTEXT
// ============================================================

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// ============================================================
// PROVIDER
// Wrap the app root with this to enable toasts everywhere.
// ============================================================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((
    message: string,
    variant: ToastVariant = 'default',
    duration = 3000
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts(prev => [...prev, { id, message, variant, duration }])
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// ============================================================
// CONTAINER
// Fixed position, above navigation.
// ============================================================

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[]
  onRemove: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={[
        'fixed left-0 right-0 z-[100]',
        'max-w-[480px] mx-auto',
        'bottom-20 px-4',   // above navigation
        'flex flex-col gap-2',
        'pointer-events-none',
      ].join(' ')}
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

// ============================================================
// TOAST ITEM
// ============================================================

const variantStyles: Record<ToastVariant, { container: string; icon: string }> = {
  default: {
    container: 'bg-neutral-900 text-white',
    icon: '●',
  },
  success: {
    container: 'bg-neutral-900 text-white border-l-4 border-success',
    icon: '✓',
  },
  error: {
    container: 'bg-neutral-900 text-white border-l-4 border-error',
    icon: '!',
  },
  warning: {
    container: 'bg-neutral-900 text-white border-l-4 border-warning',
    icon: '⚠',
  },
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast
  onRemove: (id: string) => void
}) {
  const [isVisible, setIsVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { container, icon } = variantStyles[toast.variant ?? 'default']

  const dismiss = useCallback(() => {
    setIsVisible(false)
    // Remove after fade-out animation
    setTimeout(() => onRemove(toast.id), 200)
  }, [toast.id, onRemove])

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, toast.duration ?? 3000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [dismiss, toast.duration])

  return (
    <div
      role="status"
      className={[
        'pointer-events-auto',
        'flex items-center gap-3',
        'px-4 py-3 rounded-xl',
        'shadow-sheet',
        container,
        'transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0',
        'animate-fade-in',
      ].join(' ')}
      onClick={dismiss}
    >
      <span aria-hidden="true" className="text-xs opacity-70 flex-shrink-0">
        {icon}
      </span>
      <p className="font-sans text-sm font-medium flex-1">
        {toast.message}
      </p>
    </div>
  )
}
