import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'
import {
  ToastContext,
  type ToastContextValue,
  type ToastShowOptions,
  type ToastTone,
} from '@/components/ui/use-toast'

interface ToastItem {
  id: number
  tone: ToastTone
  message: ReactNode
}

const toneStyles: Record<ToastTone, string> = {
  success: 'bg-success-bg text-success border-success/30',
  danger: 'bg-danger-bg text-danger border-danger/30',
  info: 'bg-info-bg text-info border-info/30',
  warning: 'bg-warning-bg text-warning border-warning/30',
}

let nextId = 0

/**
 * 앱 루트에 한 번 감싸 두면 어디서든 useToast() 로 토스트를 띄울 수 있다.
 * 색은 디자인 토큰(success-bg/info-bg 등)으로만 표현하고, 자동 dismiss 한다.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback(
    (message: ReactNode, opts?: ToastShowOptions) => {
      const id = ++nextId
      const duration = opts?.duration ?? 3000
      setToasts((prev) => [
        ...prev,
        { id, tone: opts?.tone ?? 'info', message },
      ])
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach(clearTimeout)
      map.clear()
    }
  }, [])

  const value: ToastContextValue = {
    show,
    success: (m, d) => show(m, { tone: 'success', duration: d }),
    danger: (m, d) => show(m, { tone: 'danger', duration: d }),
    info: (m, d) => show(m, { tone: 'info', duration: d }),
    warning: (m, d) => show(m, { tone: 'warning', duration: d }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed right-4 bottom-4 z-[60] flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-md',
                toneStyles[t.tone],
              )}
            >
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="닫기"
                className="ml-auto shrink-0 opacity-60 transition-opacity hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
