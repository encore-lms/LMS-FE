import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

// 화면 상단 중앙에 떠서 자동으로 사라지는 토스트(portal — 스크롤 위치 무관).
export function TsToast({
  message,
  onClose,
  duration = 3600,
}: {
  message: string
  onClose: () => void
  duration?: number
}) {
  const [show, setShow] = useState(false)
  const close = useCallback(() => {
    setShow(false)
    window.setTimeout(onClose, 200)
  }, [onClose])
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true))
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
        className={cn(
          'bg-success-bg border-success text-success pointer-events-auto flex items-center gap-2.5 rounded-[14px] border px-5 py-3.5 text-[13px] font-semibold shadow-[0px_12px_32px_0px_rgba(18,23,38,0.18)] transition-all duration-300 ease-out',
          show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
        )}
      >
        <CheckCircle2 className="size-4 shrink-0" />
        {message}
      </div>
    </div>,
    document.body,
  )
}
