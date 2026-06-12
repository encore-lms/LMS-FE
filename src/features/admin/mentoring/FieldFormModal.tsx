import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Checkbox } from '@/components/ui/Checkbox'
import type { AdminTemplateFieldType } from './types'

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
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="field-form-type"
              className="text-fg-muted text-xs font-bold"
            >
              타입
            </label>
            <select
              id="field-form-type"
              value={type}
              onChange={(e) =>
                setType(e.target.value as AdminTemplateFieldType)
              }
              disabled={!typeEditable}
              className="border-border bg-surface text-fg focus:border-brand h-10 rounded-lg border px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="long_text">긴 텍스트</option>
              <option value="short_text">짧은 텍스트</option>
            </select>
          </div>
          <div className="mt-5">
            <Checkbox
              checked={required}
              onChange={setRequired}
              label="필수 항목"
            />
          </div>
        </div>
        <ul className="text-fg-subtle flex flex-col gap-1 text-xs">
          <li>
            • 타입은 짧은/긴 텍스트만 — 선택형·점수형·체크리스트는 이번 범위
            제외 (§31)
          </li>
          <li>• {notice}</li>
        </ul>
      </div>
    </Modal>
  )
}
