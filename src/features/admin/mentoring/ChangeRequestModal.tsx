import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { apiErrorOf, useCreateLogChangeRequest } from './api'
import {
  MENTORING_LOG_CHANGE_REASON_CODES,
  MENTORING_LOG_CHANGE_REASON_LABEL,
  type MentoringLogChangeReasonCode,
} from './types'
import type { AdminMentoringLogDetail } from './types'

interface ChangeRequestModalProps {
  open: boolean
  onClose: () => void
  detail: AdminMentoringLogDetail
}

/**
 * 일지 수정 요청 모달 — 사유 코드 6종 select + 상세 메모 필수(05-31 확정, 422 선차단).
 * 사유는 이력에 보존되며 멘토에게 알림 발송 — 수강생에게는 비공개(노출 경계).
 * 수정 요청 중에도 기존 유효본 인정 시간·평가 가능 상태 유지(§30).
 */
export function ChangeRequestModal({
  open,
  onClose,
  detail,
}: ChangeRequestModalProps) {
  const toast = useToast()
  const createChangeRequest = useCreateLogChangeRequest()
  const [reasonCode, setReasonCode] = useState<
    MentoringLogChangeReasonCode | ''
  >('')
  const [note, setNote] = useState('')

  const submit = () => {
    if (!reasonCode || !note.trim()) return
    createChangeRequest.mutate(
      { logId: detail.logId, payload: { reasonCode, note: note.trim() } },
      {
        onSuccess: () => {
          toast.success(
            `수정 요청 — ${detail.teamName} ${detail.roundLabel} · 멘토에게 알림 발송 · 기존 유효본 인정 유지`,
          )
          onClose()
        },
        onError: (error) =>
          toast.danger(apiErrorOf(error).message ?? '수정 요청에 실패했어요.'),
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`수정 요청 — ${detail.teamName} · ${detail.roundLabel}`}
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
            disabled={
              !reasonCode || !note.trim() || createChangeRequest.isPending
            }
            className="bg-info text-on-color hover:bg-info/90 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createChangeRequest.isPending ? '요청 중…' : '수정 요청 보내기'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="change-reason-code"
            className="text-fg-muted text-xs font-bold"
          >
            사유 코드 <span className="text-danger">*</span>
          </label>
          <select
            id="change-reason-code"
            value={reasonCode}
            onChange={(e) =>
              setReasonCode(e.target.value as MentoringLogChangeReasonCode | '')
            }
            className="border-border bg-surface text-fg focus:border-brand h-10 w-full rounded-lg border px-3 text-sm outline-none"
          >
            <option value="">사유 코드 선택</option>
            {MENTORING_LOG_CHANGE_REASON_CODES.map((code) => (
              <option key={code} value={code}>
                {MENTORING_LOG_CHANGE_REASON_LABEL[code]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="change-reason-note"
            className="text-fg-muted text-xs font-bold"
          >
            상세 메모 <span className="text-danger">*</span>
          </label>
          <textarea
            id="change-reason-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="(사유 입력 — 멘토 알림에 포함됨)"
            className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none"
          />
        </div>
        <ul className="text-fg-subtle flex flex-col gap-1 text-xs">
          <li>• 사유 코멘트는 이력에 보존되며 멘토에게 알림이 발송됩니다.</li>
          <li>• 수정 요청 중에도 기존 유효본 인정 시간은 유지됩니다.</li>
          <li>
            • 멘토 재제출 시 즉시 자동 유효 처리되고 인정 시간이 재계산됩니다.
          </li>
        </ul>
      </div>
    </Modal>
  )
}
