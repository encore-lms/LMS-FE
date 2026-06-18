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

/**
 * 공통 토스트 컴포넌트 — Figma 1637:10913 (공통 컴포넌트/Toast).
 * 4가지 톤별 solid 배경. 이 토큰 매핑이 디자인의 단일 출처이며,
 * 앱 전역에서 이 토스트만 사용한다(개별 토스트 컴포넌트 금지).
 *   success(작업 완료) → accent-strong #5c4fd9
 *   danger (작업 실패) → #ef4444
 *   warning(확인 필요) → #f1f3f5 / 어두운 글자
 *   info   (조회 완료) → brand-deep #121726
 */
const toneStyles: Record<
  ToastTone,
  { box: string; text: string; close: string }
> = {
  success: {
    box: 'bg-accent-strong',
    text: 'text-white',
    close: 'text-[#d8dee9]',
  },
  danger: { box: 'bg-[#ef4444]', text: 'text-white', close: 'text-[#d8dee9]' },
  info: { box: 'bg-brand-deep', text: 'text-white', close: 'text-[#d8dee9]' },
  warning: {
    box: 'bg-[#f1f3f5]',
    text: 'text-[#121726]',
    close: 'text-[#121726]/40',
  },
}

let nextId = 0

/**
 * 앱 루트에 한 번 감싸 두면 어디서든 useToast() 로 토스트를 띄울 수 있다.
 * 화면 우하단(하단 30px·우측 30px)에 고정으로 쌓이고, 자동 dismiss 한다.
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
        <div className="fixed right-[30px] bottom-[30px] z-[60] flex w-[420px] max-w-[calc(100vw-2rem)] flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-[12px] px-[14px] py-[15px] drop-shadow-[0px_8px_12px_rgba(0,0,0,0.14)]',
                toneStyles[t.tone].box,
              )}
            >
              <span
                className={cn(
                  'flex-1 text-[13px] leading-[20px] font-semibold [word-break:break-word]',
                  toneStyles[t.tone].text,
                )}
              >
                {t.message}
              </span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="닫기"
                className={cn(
                  'shrink-0 text-[18px] leading-none font-medium transition-opacity hover:opacity-70',
                  toneStyles[t.tone].close,
                )}
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
