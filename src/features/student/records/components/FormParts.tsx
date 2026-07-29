import type {
  ReactNode,
  TextareaHTMLAttributes,
  InputHTMLAttributes,
} from 'react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { inputClass } from '@/components/ui/inputClass'

// 기록실 등록/수정 폼 공유 프리미티브 — 빵부스러기·라벨·입력·지원형식·하단 액션바.

/** 빵부스러기 (기록실 › 블로그 › 새 등록) */
export function Crumbs({ items }: { items: string[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[12px]">
      {items.map((it, i) => {
        const last = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            <span className={last ? 'text-fg font-semibold' : 'text-fg-subtle'}>
              {it}
            </span>
            {!last && <span className="text-fg-subtle">›</span>}
          </span>
        )
      })}
    </nav>
  )
}

/** 필드 라벨 (* 필수 + 보조 안내) */
export function FieldLabel({
  children,
  required,
  hint,
}: {
  children: ReactNode
  required?: boolean
  hint?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-fg text-[13px] font-bold">
        {children}
        {required && <span className="text-danger ml-0.5">*</span>}
      </span>
      {hint && <span className="text-fg-subtle text-[11px]">{hint}</span>}
    </div>
  )
}

export function TextInput({
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={error || undefined}
      className={cn(inputClass({ size: 'md', invalid: error }), className)}
    />
  )
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        inputClass({
          size: 'md',
          className: 'min-h-[112px] resize-none leading-6',
        }),
        props.className,
      )}
    />
  )
}

/** 지원 형식 표시 (JPEG PNG GIF WebP SVG) */
export function FormatRow({
  formats = ['JPEG', 'PNG', 'GIF', 'WebP', 'SVG'],
}: {
  formats?: string[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-fg-subtle mr-1 text-[11px]">지원 형식</span>
      {formats.map((f) => (
        <span
          key={f}
          className="border-border text-fg-muted rounded-md border px-2 py-1 text-[11px] font-semibold"
        >
          {f}
        </span>
      ))}
    </div>
  )
}

/** 하단 액션바 (이전·취소 ... [임시저장] 제출) + 보조 안내 */
export function FormBar({
  backLabel,
  onBack,
  note,
  submitLabel,
  onSubmit,
  disabled,
  footer,
  secondaryLabel,
  onSecondary,
  secondaryDisabled,
}: {
  backLabel: string
  onBack: () => void
  note?: string
  submitLabel: string
  onSubmit: () => void
  disabled?: boolean
  footer?: string
  /** 보조 액션(예: 임시저장) — 있으면 제출 왼쪽에 아웃라인 버튼으로 노출 */
  secondaryLabel?: string
  onSecondary?: () => void
  secondaryDisabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="border-border flex items-center justify-between border-t pt-5">
        <button
          type="button"
          onClick={onBack}
          className="text-fg-muted hover:text-fg flex items-center gap-1 text-[13px] font-semibold"
        >
          ‹ {backLabel}
        </button>
        <div className="flex items-center gap-4">
          {note && <span className="text-fg-subtle text-[12px]">{note}</span>}
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              disabled={secondaryDisabled}
              className="border-border text-fg hover:bg-surface-muted rounded-[10px] border px-5 py-3 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {secondaryLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            className={buttonClass({ size: 'md' })}
          >
            {submitLabel}
          </button>
        </div>
      </div>
      {footer && (
        <p className="text-fg-subtle text-center text-[11px]">ⓘ {footer}</p>
      )}
    </div>
  )
}
