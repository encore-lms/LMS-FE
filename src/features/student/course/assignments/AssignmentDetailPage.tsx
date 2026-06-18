import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useAssignment } from '../../api/course'
import { AssignmentSummary, STATUS_BADGE } from './components/AssignmentSummary'
import { SubmissionForm } from './components/SubmissionForm'
import { SubmissionState } from './components/SubmissionState'
import { SubmissionSummary } from './components/SubmissionSummary'
import { ConfirmResubmitModal } from './components/ConfirmResubmitModal'
import type { AssignmentDraft, AssignmentStatus } from './types'

/**
 * 과제 상세·제출 (/student/course/assignments/:assignmentId) — Figma 2236:10410.
 * 제출 흐름:
 *  - 미제출 → 제출 폼(2236:10410). 제출 저장 → 제출 완료 요약(2236:10480) + 토스트.
 *  - 제출 완료 → 제출 요약(휴지 상태). 제출 보기·수정 → 폼. 제출 저장 → 덮어쓰기 확인 모달(2236:10522).
 */
export default function AssignmentDetailPage() {
  const { assignmentId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useAssignment(assignmentId)
  const toast = useToast()
  usePageHeader(
    '과제 상세·제출',
    '마감 전에는 마지막 제출본이 유효합니다. 텍스트·URL·첨부 중 하나 이상을 입력하세요.',
  )

  // 제출 상태머신 — data 로드(또는 다른 과제로 전환) 시 초기화
  const [mode, setMode] = useState<'summary' | 'form'>('form')
  const [hasHistory, setHasHistory] = useState(false)
  const [submitted, setSubmitted] = useState<AssignmentDraft | null>(null)
  const [submittedAt, setSubmittedAt] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pending, setPending] = useState<AssignmentDraft | null>(null)

  useEffect(() => {
    if (!data) return
    setMode(data.hasHistory ? 'summary' : 'form')
    setHasHistory(data.hasHistory)
    setSubmitted(data.draft)
    setSubmittedAt(data.submittedAtLabel ?? '')
    setModalOpen(false)
    setPending(null)
  }, [data])

  if (isPending) {
    return <div className="text-fg-muted p-8">과제를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="과제를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const back = () => navigate('/student/course/assignments')

  // 제출 후에는 '제출 완료'로 보이도록 유효 상태 계산
  const effectiveStatus: AssignmentStatus =
    hasHistory && data.status === 'not_submitted' ? 'submitted' : data.status
  const badge = STATUS_BADGE[effectiveStatus]

  // 요약으로 확정(첫 제출·수정 제출 공통)
  const commit = (draft: AssignmentDraft, msg: string) => {
    setSubmitted(draft)
    setSubmittedAt('방금 전')
    setHasHistory(true)
    setMode('summary')
    setModalOpen(false)
    setPending(null)
    toast.success(msg)
  }
  const handleSave = (draft: AssignmentDraft) => {
    // 기존 제출본이 있으면 덮어쓰기 확인 모달, 첫 제출이면 바로 완료
    if (hasHistory) {
      setPending(draft)
      setModalOpen(true)
    } else {
      commit(draft, '과제 제출이 완료되었습니다.')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* 상태 배지 — 요약(휴지) 상태에서는 카드 안 배지로 충분하므로 폼 모드에서만 노출 */}
      {mode === 'form' && (
        <div className="flex justify-end">
          <span
            className={cn(
              'shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold',
              badge.cls,
            )}
          >
            {badge.label}
          </span>
        </div>
      )}

      <AssignmentSummary detail={data} status={effectiveStatus} />

      {mode === 'summary' && submitted ? (
        <SubmissionSummary
          detail={data}
          submitted={submitted}
          submittedAtLabel={submittedAt || '방금 전'}
          onEdit={() => setMode('form')}
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_376px]">
          <SubmissionForm draft={submitted} onSave={handleSave} onBack={back} />
          <SubmissionState detail={data} />
        </div>
      )}

      <ConfirmResubmitModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onConfirm={() =>
          pending && commit(pending, '과제 제출이 완료되었습니다.')
        }
      />
    </div>
  )
}
