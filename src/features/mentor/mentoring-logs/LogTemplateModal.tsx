// 일지 작성 — 적용된 템플릿 보기 모달(항목 정의 조회 전용, LogComposeForm 분리).
import { Modal } from '@/components/ui/Modal'
import type { MentoringLogFieldSnapshot } from '../types'
import { TemplateFieldList } from './TemplateFieldList'

export function LogTemplateModal({
  showTemplate,
  setShowTemplate,
  fields,
}: {
  showTemplate: boolean
  setShowTemplate: (open: boolean) => void
  fields: MentoringLogFieldSnapshot[]
}) {
  return (
    <Modal
      open={showTemplate}
      onClose={() => setShowTemplate(false)}
      title="적용된 템플릿"
      footer={
        <button
          type="button"
          onClick={() => setShowTemplate(false)}
          className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-[13px] font-medium"
        >
          닫기
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-fg-muted text-xs">
          팀에 적용된 운영 설정 항목 스냅샷입니다 · 항목 변경은 운영자만
          가능하며 새 일지부터 적용됩니다
        </p>
        <TemplateFieldList
          fields={fields}
          className="border-border rounded-xl border"
        />
      </div>
    </Modal>
  )
}
