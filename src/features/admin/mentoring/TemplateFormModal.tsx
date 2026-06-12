import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { apiErrorOf, useCreateLogTemplate } from './api'

interface TemplateFormModalProps {
  open: boolean
  onClose: () => void
  /** 생성 직후 우측 편집 영역에 선택 — 항목은 빈 상태에서 '항목 추가'로 시작 */
  onCreated: (templateId: string) => void
}

/**
 * 새 템플릿 생성 모달 — 이름 필수·설명 선택(Figma 폼 frame 미존재 openQuestion, 최소 폼).
 * 항목 편집은 생성 후 우측 '항목 편집' 카드에서 진행한다. 기본 여부는 1개 고정이라
 * 생성 시 항상 OFF(기본 템플릿 변경 UI 는 frame 미존재 — BE·디자인 확정 후 TODO).
 */
export function TemplateFormModal({
  open,
  onClose,
  onCreated,
}: TemplateFormModalProps) {
  const toast = useToast()
  const createTemplate = useCreateLogTemplate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const submit = () => {
    if (!name.trim()) return
    createTemplate.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: (created) => {
          toast.success(
            `새 템플릿 — ${created.name} · 항목 추가로 구성을 시작하세요`,
          )
          onCreated(created.templateId)
          onClose()
        },
        onError: (error) =>
          toast.danger(
            apiErrorOf(error).message ?? '템플릿 생성에 실패했어요.',
          ),
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="새 템플릿"
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
            disabled={!name.trim() || createTemplate.isPending}
            className="bg-brand-deep text-on-color hover:bg-brand-deep/90 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createTemplate.isPending ? '생성 중…' : '템플릿 생성'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="template-form-name"
            className="text-fg-muted text-xs font-bold"
          >
            템플릿 이름 <span className="text-danger">*</span>
          </label>
          <input
            id="template-form-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: AI 캠프 기본 v2.2"
            className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border px-3 text-sm outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="template-form-desc"
            className="text-fg-muted text-xs font-bold"
          >
            설명
          </label>
          <input
            id="template-form-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="템플릿 용도 한 줄 요약 (선택)"
            className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border px-3 text-sm outline-none"
          />
        </div>
        <ul className="text-fg-subtle flex flex-col gap-1 text-xs">
          <li>• 신규 배정 팀에만 기본 적용 — 기존 팀에는 자동 반영 안 됨</li>
          <li>• 생성 후 항목 편집 카드에서 항목을 추가합니다</li>
        </ul>
      </div>
    </Modal>
  )
}
