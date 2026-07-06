import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlignLeft,
  Check,
  ChevronDown,
  Image as ImageIcon,
  ImagePlus,
  Minus,
  type LucideIcon,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Checkbox } from '@/components/ui/Checkbox'
import { cn } from '@/shared/lib/cn'
import type { AdminTemplateFieldType } from './types'

/** 항목 타입 선택지 — 아이콘 + 라벨 + 한줄 설명. */
const TYPE_OPTIONS: {
  value: AdminTemplateFieldType
  label: string
  icon: LucideIcon
  hint: string
}[] = [
  {
    value: 'long_text',
    label: '긴 텍스트',
    icon: AlignLeft,
    hint: '여러 줄 서술',
  },
  {
    value: 'short_text',
    label: '짧은 텍스트',
    icon: Minus,
    hint: '한 줄 입력',
  },
  { value: 'image', label: '이미지', icon: ImageIcon, hint: '사진·캡처 첨부' },
  {
    value: 'text_image',
    label: '텍스트 + 이미지',
    icon: ImagePlus,
    hint: '서술 + 사진 첨부',
  },
]

/**
 * 항목 타입 커스텀 드롭다운 — 아이콘 앞·라벨 뒤.
 * 목록은 포털(fixed)로 띄워 모달 본문 overflow에 잘리지 않게 한다.
 */
function TypePicker({
  value,
  onChange,
  disabled,
}: {
  value: AdminTemplateFieldType
  onChange: (v: AdminTemplateFieldType) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const selected =
    TYPE_OPTIONS.find((o) => o.value === value) ?? TYPE_OPTIONS[0]
  const SelIcon = selected.icon

  // 열릴 때 트리거 위치 기준으로 목록을 배치(아래 공간 부족하면 위로).
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const estHeight = 4 + TYPE_OPTIONS.length * 52
    const below = window.innerHeight - r.bottom
    const openUp = below < estHeight + 12 && r.top > below
    setPos({
      top: openUp ? r.top - estHeight - 6 : r.bottom + 6,
      left: r.left,
      width: r.width,
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false)
      }
    }
    const onScrollOrResize = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    // 캡처 단계로 모달 본문 스크롤도 감지해 닫는다.
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="border-border bg-surface text-fg focus:border-brand flex h-10 w-52 items-center justify-between gap-2 rounded-lg border px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <SelIcon className="text-fg-muted h-4 w-4" />
          <span className="font-medium">{selected.label}</span>
        </span>
        <ChevronDown className="text-fg-subtle h-4 w-4" />
      </button>
      {open &&
        !disabled &&
        pos &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className="border-border fixed z-[10050] overflow-hidden rounded-lg border bg-white p-1 shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
          >
            {TYPE_OPTIONS.map((o) => {
              const Icon = o.icon
              const isSel = o.value === value
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'hover:bg-surface-muted flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left',
                      isSel && 'bg-brand/5',
                    )}
                  >
                    <span className="bg-surface-muted text-fg-muted inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-fg block text-[13px] font-semibold">
                        {o.label}
                      </span>
                      <span className="text-fg-subtle block text-[11px]">
                        {o.hint}
                      </span>
                    </span>
                    {isSel && <Check className="text-brand h-4 w-4 shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body,
        )}
    </>
  )
}

export interface FieldFormValues {
  name: string
  helpText: string
  required: boolean
  type: AdminTemplateFieldType
}

interface FieldFormModalProps {
  open: boolean
  onClose: () => void
  /** '항목 추가 — AI 캠프 기본 v2.1' 등 컨텍스트 포함 타이틀 */
  title: string
  /** 수정 시 기존 값 — 미전달이면 추가 모드 기본값 */
  initial?: FieldFormValues
  /**
   * 타입 변경 허용 여부 — §32 팀별 수정 가능 항목(항목명·설명·필수·순서)에 타입이
   * 없어 팀 화면의 기존 항목 수정에서는 잠근다(신규 추가·템플릿 편집은 허용).
   */
  typeEditable?: boolean
  /** 하단 보존 정책 안내 — 화면별 §31/§32 원문 전달 */
  notice: string
  pending?: boolean
  onSubmit: (values: FieldFormValues) => void
}

/**
 * 일지 항목 추가/수정 폼 모달 — 템플릿(§31)·팀별(§32) 공용.
 * Figma 에 폼 frame 미존재(openQuestion) — 항목 도메인 모델(항목명·설명/도움말·필수·
 * 타입 2종)대로 최소 폼 구성. 항목명 필수(빈 값 제출 차단).
 */
export function FieldFormModal({
  open,
  onClose,
  title,
  initial,
  typeEditable = true,
  notice,
  pending,
  onSubmit,
}: FieldFormModalProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [helpText, setHelpText] = useState(initial?.helpText ?? '')
  const [required, setRequired] = useState(initial?.required ?? false)
  const [type, setType] = useState<AdminTemplateFieldType>(
    initial?.type ?? 'long_text',
  )

  const submit = () => {
    if (!name.trim()) return
    onSubmit({ name: name.trim(), helpText: helpText.trim(), required, type })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      closeOnBackdrop={false}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-sm font-bold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim() || pending}
            className="bg-brand-deep text-on-color hover:bg-brand-deep/90 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? '저장 중…' : initial ? '항목 저장' : '항목 추가'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="field-form-name"
            className="text-fg-muted text-xs font-bold"
          >
            항목명 <span className="text-danger">*</span>
          </label>
          <input
            id="field-form-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 주요 아젠다"
            className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border px-3 text-sm outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="field-form-help"
            className="text-fg-muted text-xs font-bold"
          >
            설명/도움말
          </label>
          <input
            id="field-form-help"
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            placeholder="작성 시 보이는 도움말 (선택)"
            className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border px-3 text-sm outline-none"
          />
        </div>
        <div className="flex items-start gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-fg-muted text-xs font-bold">타입</span>
            <TypePicker
              value={type}
              onChange={setType}
              disabled={!typeEditable}
            />
          </div>
          <div className="mt-6">
            <Checkbox
              checked={required}
              onChange={setRequired}
              label="필수 항목"
            />
          </div>
        </div>
        <ul className="text-fg-subtle flex flex-col gap-1 text-xs">
          <li>
            • 타입: 텍스트(짧은/긴) · 이미지 · 텍스트+이미지 — 선택형·점수형은
            범위 제외
          </li>
          <li>• {notice}</li>
        </ul>
      </div>
    </Modal>
  )
}
