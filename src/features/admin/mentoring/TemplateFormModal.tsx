import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/inputClass'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { apiErrorOf, useCreateLogTemplate, useUpdateTemplateMeta } from './api'

interface TemplateFormModalProps {
  open: boolean
  onClose: () => void
  /** 생성 직후 우측 편집 영역에 선택 — 항목은 빈 상태에서 '항목 추가'로 시작 */
  onCreated: (templateId: string) => void
  /** 전달 시 편집(이름·설명 수정) 모드. 미전달이면 생성 모드. */
  editTemplate?: { templateId: string; name: string; description: string }
}

/**
 * 템플릿 생성/이름·설명 수정 모달 — 이름 필수·설명 선택.
 * editTemplate 이 있으면 이름 수정(PATCH .../meta), 없으면 새 템플릿 생성.
 */
export function TemplateFormModal({
  open,
  onClose,
  onCreated,
  editTemplate,
}: TemplateFormModalProps) {
  const toast = useToast()
  const createTemplate = useCreateLogTemplate()
  const updateMeta = useUpdateTemplateMeta()
  const isEdit = !!editTemplate
  const [name, setName] = useState(editTemplate?.name ?? '')
  const [description, setDescription] = useState(
    editTemplate?.description ?? '',
  )
  const pending = createTemplate.isPending || updateMeta.isPending

  const submit = () => {
    if (!name.trim()) return
    if (isEdit) {
      updateMeta.mutate(
        {
          templateId: editTemplate.templateId,
          name: name.trim(),
          description: description.trim(),
        },
        {
          onSuccess: (updated) => {
            toast.success(`템플릿 이름을 '${updated.name}'(으)로 수정했어요.`)
            onClose()
          },
          onError: (error) =>
            toast.danger(
              apiErrorOf(error).message ?? '템플릿 수정에 실패했어요.',
            ),
        },
      )
      return
    }
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
      title={isEdit ? '템플릿 이름 수정' : '새 템플릿'}
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={submit} disabled={!name.trim() || pending}>
            {pending
              ? isEdit
                ? '수정 중…'
                : '생성 중…'
              : isEdit
                ? '수정 저장'
                : '템플릿 생성'}
          </Button>
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
            className={inputClass()}
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
            className={inputClass()}
          />
        </div>
        <ul className="text-fg-subtle flex flex-col gap-1 text-xs">
          {isEdit ? (
            <li>• 이름·설명 수정은 기존 배정 팀에 자동 반영되지 않습니다</li>
          ) : (
            <>
              <li>
                • 신규 배정 팀에만 기본 적용 — 기존 팀에는 자동 반영 안 됨
              </li>
              <li>• 생성 후 항목 편집 카드에서 항목을 추가합니다</li>
            </>
          )}
        </ul>
      </div>
    </Modal>
  )
}
