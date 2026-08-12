import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useAssignment, useSubmitAssignment } from '../../api/course'
import { AssignmentSummary } from './components/AssignmentSummary'
import { STATUS_BADGE } from './meta'
import { SubmissionForm } from './components/SubmissionForm'
import { SubmissionState } from './components/SubmissionState'
import { ConfirmResubmitModal } from './components/ConfirmResubmitModal'
import type { AssignmentDraft, AssignmentStatus } from './types'

/**
 * 과제 상세·제출 (/student/course/assignments/:assignmentId).
 * 제출 전·후 모두 같은 폼 화면을 쓴다 — 제출본이 있으면 프리필되고, 우측 타임라인이
 * 제출 이력을 보여준다(2026-08-11 참조 이미지 정본). 재제출은 덮어쓰기 확인 모달을 거친다.
 */
export default function AssignmentDetailPage() {
  const { assignmentId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useAssignment(assignmentId)
  const submitAssignment = useSubmitAssignment(assignmentId)
  const toast = useToast()
  usePageHeader(
    '과제 상세·제출',
    '마감 전에는 마지막 제출본이 유효합니다. 텍스트·URL·첨부 중 하나 이상을 입력하세요.',
  )

  // data 로드(또는 다른 과제로 전환) 시 초기화
  const [hasHistory, setHasHistory] = useState(false)
  const [submitted, setSubmitted] = useState<AssignmentDraft | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [pending, setPending] = useState<AssignmentDraft | null>(null)

  useEffect(() => {
    if (!data) return
    setHasHistory(data.hasHistory)
    setSubmitted(data.draft)
    setModalOpen(false)
    setPending(null)
  }, [data])

  const back = () => navigate('/student/course/assignments')

  // 제출 후에는 '제출 완료'로 보이도록 유효 상태 계산
  const effectiveStatus: AssignmentStatus =
    data && hasHistory && data.status === 'not_submitted'
      ? 'submitted'
      : (data?.status ?? 'not_submitted')
  const badge = STATUS_BADGE[effectiveStatus]

  // 제출 확정(첫 제출·재제출 공통) — 화면은 그대로 폼, 이력은 상세 재조회로 갱신된다.
  const commit = (draft: AssignmentDraft, msg: string) => {
    setSubmitted(draft)
    setHasHistory(true)
    setModalOpen(false)
    setPending(null)
    toast.success(msg)
  }
  const submit = (draft: AssignmentDraft, successMessage: string) => {
    submitAssignment.mutate(draft, {
      onSuccess: () => commit(draft, successMessage),
      onError: () =>
        toast.danger('과제 제출에 실패했습니다. 잠시 후 다시 시도해주세요.'),
    })
  }
  const handleSave = (draft: AssignmentDraft) => {
    // 기존 제출본이 있으면 덮어쓰기 확인 모달, 첫 제출이면 바로 완료
    if (hasHistory) {
      setPending(draft)
      setModalOpen(true)
    } else {
      submit(draft, '과제 제출이 완료되었습니다.')
    }
  }

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="과제를 불러오는 중…"
      errorTitle="과제를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="flex flex-col gap-8 p-8">
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

          <AssignmentSummary detail={data} status={effectiveStatus} />

          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_320px]">
            <SubmissionForm
              key={data.submittedAtLabel ?? 'first'}
              draft={submitted ?? data.draft}
              isSaving={submitAssignment.isPending}
              onSave={handleSave}
              onBack={back}
            />
            <SubmissionState detail={data} />
          </div>

          <ConfirmResubmitModal
            open={modalOpen}
            isSaving={submitAssignment.isPending}
            onCancel={() => setModalOpen(false)}
            onConfirm={() =>
              pending && submit(pending, '과제 제출이 완료되었습니다.')
            }
          />
        </div>
      )}
    </DataBoundary>
  )
}
