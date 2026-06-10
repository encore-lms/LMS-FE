import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useAssignment } from '../../api/course'
import { AssignmentSummary, STATUS_BADGE } from './components/AssignmentSummary'
import { SubmissionForm } from './components/SubmissionForm'
import { SubmissionState } from './components/SubmissionState'
import { ConfirmResubmitModal } from './components/ConfirmResubmitModal'

/**
 * 과제 상세·제출 (/student/course/assignments/:assignmentId) — Figma 2236:10410.
 * 제출 폼 + 제출 이력/검토 예시. 제출 저장 → 토스트(2236:10480), 수정 제출 확인 → 모달(2236:10522).
 */
export default function AssignmentDetailPage() {
  const { assignmentId = '' } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data, isPending, isError, refetch } = useAssignment(assignmentId)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(
    params.get('toast') === 'submitted' ? '제출이 저장되었습니다.' : null,
  )
  usePageHeader(
    '과제 상세·제출',
    '마감 전에는 마지막 제출본이 유효합니다. 텍스트·URL·첨부 중 하나 이상을 입력하세요.',
  )

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

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
  const badge = STATUS_BADGE[data.status]

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* 상태 배지 — 제목은 공유 헤더로 이동, 배지는 본문 우측 정렬로 유지 */}
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

      <AssignmentSummary detail={data} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_376px]">
        <SubmissionForm
          draft={data.draft}
          onSave={() => setToast('제출이 저장되었습니다.')}
          onBack={back}
        />
        <SubmissionState detail={data} onResubmit={() => setModalOpen(true)} />
      </div>

      <ConfirmResubmitModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onConfirm={() => {
          setModalOpen(false)
          setToast('수정 제출이 저장되었습니다.')
        }}
      />

      {toast && (
        <div className="bg-brand-deep fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
          <span className="bg-brand flex size-4 items-center justify-center rounded-full">
            <svg
              viewBox="0 0 24 24"
              className="size-3"
              fill="none"
              stroke="white"
              strokeWidth="3"
            >
              <path
                d="m5 13 4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
