'use client'
import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'

type ToastType = 'success'|'error'|'info'
type Toast     = { id: string; message: string; type: ToastType }
type ToastCtx  = { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastCtx>({ toast: () => {} })
export function useToast() { return useContext(ToastContext) }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div aria-live="polite" style={{ position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'390px', padding:'0 16px', zIndex:600, display:'flex', flexDirection:'column', gap:'8px', pointerEvents:'none' }}>
          {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
        </div>
      )}
    </ToastContext.Provider>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    el.style.opacity = '0'; el.style.transform = 'translateY(8px)'
    requestAnimationFrame(() => { el.style.transition = 'opacity 200ms ease, transform 200ms ease'; el.style.opacity = '1'; el.style.transform = 'translateY(0)' })
  }, [])
  const colours: Record<ToastType,string> = { success:'#1fce94', error:'#c8151e', info:'rgba(240,230,200,0.95)' }
  return (
    <div ref={ref} role="status" style={{ background:'rgba(20,32,20,0.97)', backdropFilter:'blur(16px)', border:`1px solid ${colours[toast.type]}30`, borderRadius:'12px', padding:'12px 16px', fontFamily:'var(--f-body)', fontSize:'13px', fontWeight:500, color:colours[toast.type], boxShadow:'0 4px 20px rgba(0,0,0,0.50)', pointerEvents:'auto', textAlign:'center' }}>
      {toast.message}
    </div>
  )
}
