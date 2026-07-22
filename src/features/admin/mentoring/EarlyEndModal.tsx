import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { apiErrorOf, useEarlyEndAssignment } from './api'
import type { MentorAssignmentRow } from './types'

interface EarlyEndModalProps {
  open: boolean
  onClose: () => void
  row: MentorAssignmentRow
}

/**
 * 조기 종료 모달 — 사유 입력 필수(422 MENTOR_EARLY_END_REASON_REQUIRED 선차단).
 * 운영자가 팀을 조기 종료 처리하면 평가 가능 상태로 전환(§29).
 * 사유는 멘토에게만 표시 · 수강생 비공개(05-26 §3).
 */
export function EarlyEndModal({ open, onClose, row }: EarlyEndModalProps) {
  const toast = useToast()
  const earlyEnd = useEarlyEndAssignment()
  const [reason, setReason] = useState('')

  if (!row.assignmentId) return null
  const assignmentId = row.assignmentId

  const submit = () => {
    earlyEnd.mutate(
      { assignmentId, reason: reason.trim() },
      {
        onSuccess: (updated) => {
          toast.success(
            `조기 종료 — ${updated.teamName} · 평가 가능 상태 전환 (사유는 멘토에게만 표시)`,
          )
          onClose()
        },
        onError: (error) =>
          toast.danger(
            apiErrorOf(error).message ?? '조기 종료 처리에 실패했어요.',
          ),
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`조기 종료 — ${row.teamName}`}
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
            disabled={!reason.trim() || earlyEnd.isPending}
            className="bg-warning text-on-color hover:bg-warning/90 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {earlyEnd.isPending ? '처리 중…' : '조기 종료 처리'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-fg-muted text-sm">
          {row.cohortLabel} · {row.teamName} — 배정 {row.allocatedHours}h · 누적
          인정 {row.recognizedHours ?? 0}h
        </p>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="early-end-reason"
            className="text-fg-muted text-xs font-bold"
          >
            조기 종료 사유 <span className="text-danger">*</span>
          </label>
          <textarea
            id="early-end-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="조기 종료 사유를 입력해주세요 (필수)"
            className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus-visible:shadow-none"
          />
        </div>
        <ul className="text-fg-subtle flex flex-col gap-1 text-xs">
          <li>• 조기 종료 시 팀은 평가·추천 가능 상태로 전환됩니다.</li>
          <li>• 사유는 멘토에게만 표시되고 수강생에게는 비공개입니다.</li>
        </ul>
      </div>
    </Modal>
  )
}
