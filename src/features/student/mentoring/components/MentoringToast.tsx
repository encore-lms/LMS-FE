import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

// 멘토링 완료 알림 토스트 — 화면 상단 중앙에 고정(viewport fixed)으로 떠서 자동으로 사라진다.
// 페이지 스크롤 위치와 무관하게 항상 보이도록 portal 로 body 에 렌더한다. Figma 3083:5468/5787/6425.
export type MentoringToastTone = 'success' | 'warning'

const TONE = {
  success: {
    box: 'bg-success-bg border-success',
    icon: 'text-success',
    label: 'text-success',
    action: 'border-success text-success',
    glyph: '✓',
  },
  warning: {
    box: 'bg-warning-bg border-warning',
    icon: 'text-warning',
    label: 'text-warning',
    action: 'border-warning text-warning',
    glyph: '!',
  },
} satisfies Record<MentoringToastTone, Record<string, string>>

export function MentoringToast({
  tone,
  label,
  message,
  sub,
  actionLabel,
  onAction,
  onClose,
  duration = 6000,
}: {
  tone: MentoringToastTone
  label: string
  message: string
  sub?: string
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
  /** 자동 닫힘까지 ms (기본 6000) */
  duration?: number
}) {
  const t = TONE[tone]
  const [show, setShow] = useState(false)

  const close = useCallback(() => {
    setShow(false)
    window.setTimeout(onClose, 200) // 퇴장 트랜지션 후 언마운트
  }, [onClose])

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true)) // 입장 애니메이션
    const timer = window.setTimeout(close, duration)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [close, duration])

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[80] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'pointer-events-auto flex w-full max-w-[680px] items-center justify-between gap-4 rounded-[14px] border px-5 py-4 shadow-[0px_12px_32px_0px_rgba(18,23,38,0.18)] transition-all duration-300 ease-out',
          show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
          t.box,
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'bg-surface flex size-9 shrink-0 items-center justify-center rounded-full text-[16px] font-bold',
              t.icon,
            )}
          >
            {t.glyph}
          </span>
          <div className="flex flex-col gap-0.5">
            <span
              className={cn('text-[10px] font-bold tracking-[0.12em]', t.label)}
            >
              {label}
            </span>
            <span className="text-fg text-[14px] font-bold">{message}</span>
            {sub && <span className="text-fg-muted text-[12px]">{sub}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actionLabel && (
            <button
              type="button"
              onClick={() => {
                onAction?.()
                close()
              }}
              className={cn(
                'bg-surface rounded-lg border px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap',
                t.action,
              )}
            >
              {actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="text-fg-subtle px-1 text-[14px]"
          >
            ✕
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
