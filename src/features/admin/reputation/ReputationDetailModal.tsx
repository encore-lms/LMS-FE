// 평판 상세 모달 — 행 데이터 기반 읽기 전용 + 멘토 평가 상세 펼침. ReputationPage에서 분리.
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MentorEvaluationDetail } from './MentorEvaluationDetail'
import {
  ENDORSEMENT_META,
  MENTOR_EVAL_META,
  PUSH_LABEL,
} from './reputationMeta'
import type { ReputationStudent } from './types'

export function ReputationDetailModal({
  student,
  peerDegraded,
  onClose,
}: {
  student: ReputationStudent | null
  peerDegraded: boolean | undefined
  onClose: () => void
}) {
  return (
    <Modal
      open={!!student}
      onClose={onClose}
      title={student ? `${student.name} 평판 상세` : ''}
    >
      {student && (
        <div className="flex flex-col gap-4">
          <p className="text-fg-subtle font-mono text-xs">{student.uuid}</p>
          <div className="border-border rounded-xl border p-4">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-fg-muted">강사 추천서</dt>
                <dd className="flex items-center gap-2">
                  <StatusBadge
                    label={ENDORSEMENT_META[student.endorsementStatus].label}
                    tone={ENDORSEMENT_META[student.endorsementStatus].tone}
                  />
                  <span className="text-fg-subtle text-xs">
                    {student.endorsementBy}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-fg-muted">멘토 평가·추천</dt>
                <dd className="flex items-center gap-2">
                  <StatusBadge
                    label={MENTOR_EVAL_META[student.mentorEvalStatus].label}
                    tone={MENTOR_EVAL_META[student.mentorEvalStatus].tone}
                  />
                  <span className="text-fg-subtle text-xs">
                    {student.mentorBy}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-fg-muted">동료 5축</dt>
                <dd className="text-fg font-semibold tabular-nums">
                  {peerDegraded ? (
                    <span className="text-warning font-normal">조회 실패</span>
                  ) : student.peerTotal === 0 ? (
                    <span className="text-fg-subtle font-normal">
                      대상 없음
                    </span>
                  ) : (
                    `${student.peerCount} / ${student.peerTotal}`
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-fg-muted">누락 푸시 대상</dt>
                <dd className="text-fg text-right">
                  {student.pushTargets.length === 0
                    ? '없음 (완료)'
                    : student.pushTargets.map((t) => PUSH_LABEL[t]).join(' · ')}
                </dd>
              </div>
            </dl>
          </div>

          {/* 멘토가 실제 남긴 평가 — 5축 점수·코멘트·추천 사유 */}
          <MentorEvaluationDetail studentId={student.id} />
        </div>
      )}
    </Modal>
  )
}
