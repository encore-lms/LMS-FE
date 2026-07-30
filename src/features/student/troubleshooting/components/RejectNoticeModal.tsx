import { XCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { buttonClass } from '@/components/ui/buttonClass'
import type { TsReviewStatus } from '../types'

// 강사가 돌려보낸 사례의 사유를 보여준다 — 보완 요청과 인증 취소 두 경우.
// '이어 작성'으로 사유를 반영해 보완한 뒤 다시 요청할 수 있다.
interface RejectNoticeModalProps {
  kind: TsReviewStatus
  reason: string
  onClose: () => void
}

export function RejectNoticeModal({
  kind,
  reason,
  onClose,
}: RejectNoticeModalProps) {
  const revoked = kind === 'revoked'
  const title = revoked ? '인증 취소' : '보완 요청'
  const bannerText = revoked
    ? '강사가 인증을 취소했어요'
    : '강사가 보완을 요청했어요'
  const infoText = revoked
    ? '사유를 반영해 내용을 보완한 뒤 다시 인증을 요청할 수 있어요.'
    : '사유를 반영해 보완한 뒤 다시 인증을 요청할 수 있어요.'
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
          className={buttonClass({ size: 'md' })}
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
          <span className="text-fg text-[12px] font-bold">
            {revoked ? '인증 취소 사유' : '보완 요청 사유'}
          </span>
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
