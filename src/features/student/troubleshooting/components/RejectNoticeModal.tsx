import { XCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

// 강사 반려 안내 — 인증 요청/변경 제안이 반려됐을 때 사유(코멘트)를 회신으로 보여준다.
// '이어 작성'으로 사유를 반영해 보완할 수 있다. Figma 인증/변경 반려 모달과 대응.
interface RejectNoticeModalProps {
  kind: 'cert' | 'change'
  reviewer: string
  reason: string
  onClose: () => void
}

export function RejectNoticeModal({
  kind,
  reviewer,
  reason,
  onClose,
}: RejectNoticeModalProps) {
  const isCert = kind === 'cert'
  const title = isCert ? '인증 요청 반려' : '변경 제안 반려'
  const bannerText = isCert
    ? '강사가 인증 요청을 반려했어요'
    : '강사가 변경 제안을 반려했어요'
  const infoText = isCert
    ? '사유를 반영해 내용을 보완한 뒤 다시 인증을 요청할 수 있어요.'
    : '사유를 반영해 보완한 뒤 다시 제안할 수 있어요.'
  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={title}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="bg-brand h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white"
        >
          확인
        </button>
      }
    >
      <div className="flex flex-col gap-3.5">
        <div className="bg-danger-bg flex items-center gap-2 rounded-[10px] px-3.5 py-3">
          <XCircle className="text-danger size-[18px] shrink-0" />
          <span className="text-danger text-[13px] font-bold">
            {bannerText}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">검토자</span>
          <span className="border-border bg-surface text-fg rounded-[10px] border px-3.5 py-3 text-[13px]">
            {reviewer}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">반려 사유</span>
          <p className="border-border text-fg-muted rounded-[10px] border px-3.5 py-3 text-[13px] leading-5">
            {reason}
          </p>
        </div>
        <div className="bg-info-bg/60 text-fg-muted rounded-lg px-3 py-2.5 text-[11px] leading-4">
          {infoText}
        </div>
      </div>
    </Modal>
  )
}
