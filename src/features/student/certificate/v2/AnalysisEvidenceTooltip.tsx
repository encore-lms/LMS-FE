import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const TOOLTIP_WIDTH = 288
const VIEWPORT_GAP = 16
const TRIGGER_GAP = 8

interface TooltipPosition {
  left: number
  top?: number
  bottom?: number
  width: number
}

export function AnalysisEvidenceTooltip({
  label,
  ariaLabel,
  children,
  className,
  triggerClassName,
}: {
  label: string
  ariaLabel?: string
  children: ReactNode
  className?: string
  triggerClassName?: string
}) {
  const title = label.endsWith('근거') ? label : `${label} 분석 근거`
  const tooltipId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const width = Math.min(TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_GAP * 2)
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, VIEWPORT_GAP),
      window.innerWidth - width - VIEWPORT_GAP,
    )
    const tooltipHeight = tooltipRef.current?.offsetHeight ?? 220
    const showAbove =
      rect.bottom + TRIGGER_GAP + tooltipHeight >
        window.innerHeight - VIEWPORT_GAP &&
      rect.top > tooltipHeight + TRIGGER_GAP + VIEWPORT_GAP

    setPosition(
      showAbove
        ? {
            left,
            bottom: window.innerHeight - rect.top + TRIGGER_GAP,
            width,
          }
        : { left, top: rect.bottom + TRIGGER_GAP, width },
    )
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()

    const close = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !tooltipRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    const reposition = () => updatePosition()
    document.addEventListener('pointerdown', close)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    updatePosition()
  }, [children, open, updatePosition])

  return (
    <span className={cn('inline-flex shrink-0', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel ?? `${label} 분석 근거 보기`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen((current) => !current)}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
        className={cn(
          'text-fg-subtle hover:text-fg focus-visible:ring-ring flex size-5 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none',
          triggerClassName,
        )}
      >
        <Info className="size-3.5" aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            style={position ?? { left: VIEWPORT_GAP, top: VIEWPORT_GAP }}
            className="border-border bg-surface text-fg-muted fixed z-[1000] max-h-[min(28rem,calc(100vh-2rem))] overflow-y-auto rounded-xl border p-4 text-[11px] leading-5 font-normal [overflow-wrap:anywhere] whitespace-normal shadow-xl"
          >
            <span className="text-fg mb-2 block font-bold">{title}</span>
            <span className="flex min-w-0 flex-col gap-2">{children}</span>
          </div>,
          document.body,
        )}
    </span>
  )
}
