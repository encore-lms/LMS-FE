import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader, useAuth } from '@/shared/store'
import { formatDateTime } from '@/shared/lib/date'
import { useStudentAccounts, useCohortRoster } from '@/shared/api/students'
import {
  useAddInstructorResumeFeedback,
  useDeleteInstructorResumeFeedback,
  useInstructorResume,
} from '@/features/instructor/education/api'
import { ResumeContentView } from '@/features/student/resume/ResumeDocView'
import { ResumeFeedbackSection } from '@/features/student/resume/ResumeFeedbackSection'
import { useAddResumeFeedback, useDeleteResumeFeedback, useResume } from './api'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성 중',
  COMPLETED: '작성 완료',
}
const fmt = (iso: string | null) => (iso ? formatDateTime(iso) : '-')

// 이력서 상세(페이지) — 교육과정 허브 이력서 탭에서 진입. content 문서 뷰 + 피드백.
// source: 매니저(admin, 기본)·강사(instructor) 공용. 매니저는 courseId/cohortId를 쿼리로,
// 강사는 /instructor/cohorts/:cohortId/resumes/:resumeId 경로 파라미터로 받는다.
export default function ResumeDetailPage({
  source = 'admin',
}: {
  source?: 'admin' | 'instructor'
}) {
  const isAdmin = source === 'admin'
  const { resumeId = '', cohortId: cohortIdParam = '' } = useParams()
  const [params] = useSearchParams()
  const courseId = params.get('courseId') ?? ''
  const cohortId = isAdmin ? (params.get('cohortId') ?? '') : cohortIdParam
  const navigate = useNavigate()
  const toast = useToast()
  const adminQuery = useResume(courseId, cohortId, isAdmin ? resumeId : null)
  const instructorQuery = useInstructorResume(
    isAdmin ? null : cohortId,
    isAdmin ? null : resumeId,
  )
  const { data, isPending, isError, refetch } = isAdmin
    ? adminQuery
    : instructorQuery
  // 수강생명 join — 매니저는 계정 목록, 강사는 담당 기수 로스터(계정 목록 403).
  const { data: students } = useStudentAccounts(cohortId, isAdmin)
  const { data: roster } = useCohortRoster(isAdmin ? null : cohortId)
  const addFeedback = useAddResumeFeedback()
  const deleteFeedback = useDeleteResumeFeedback()
  const addInstructorFeedback = useAddInstructorResumeFeedback()
  const deleteInstructorFeedback = useDeleteInstructorResumeFeedback()
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const studentName = useMemo(() => {
    if (isAdmin) {
      const s = (students?.items ?? []).find(
        (x) => x.id === data?.studentUserId,
      )
      return s?.name ?? '(이름 미확인)'
    }
    const r = (roster ?? []).find((x) => x.userId === data?.studentUserId)
    return r?.name ?? '(이름 미확인)'
  }, [isAdmin, students, roster, data])

  usePageHeader('이력서 상세', '수강생 이력서 본문 확인 · 피드백 작성')

  // 진입 시 과정·기수 컨텍스트를 유지해 이력서 탭으로 복귀(허브가 URL로 상태 복원).
  const goList = () => {
    if (!isAdmin) {
      navigate(`/instructor/cohorts/${cohortId}/education?tab=resume`)
      return
    }
    const back = new URLSearchParams({ tab: 'resume' })
    if (courseId) back.set('course', courseId)
    if (cohortId) back.set('cohort', cohortId)
    navigate(`/admin/education?${back.toString()}`)
  }

  const onSubmit = () => {
    if (!body.trim()) {
      toast.danger('피드백 내용을 입력해 주세요')
      return
    }
    const opts = {
      onSuccess: () => {
        toast.success('피드백을 등록했어요')
        setBody('')
      },
      onError: () => toast.danger('피드백 등록에 실패했어요'),
    }
    if (isAdmin)
      addFeedback.mutate(
        { courseId, cohortId, resumeId, body: body.trim() },
        opts,
      )
    else
      addInstructorFeedback.mutate(
        { cohortId, resumeId, body: body.trim() },
        opts,
      )
  }

  const onDelete = (feedbackId: string) => {
    setDeletingId(feedbackId)
    const opts = {
      onSuccess: () => toast.success('피드백을 삭제했어요'),
      onError: () => toast.danger('피드백 삭제에 실패했어요'),
      onSettled: () => setDeletingId(null),
    }
    if (isAdmin)
      deleteFeedback.mutate({ courseId, cohortId, resumeId, feedbackId }, opts)
    else
      deleteInstructorFeedback.mutate({ cohortId, resumeId, feedbackId }, opts)
  }

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="이력서를 불러오는 중…"
      errorTitle="이력서를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goList}
              className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" /> 목록으로
            </button>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-fg font-semibold">{studentName}</span>
              <StatusBadge
                label={STATUS_LABEL[data.status] ?? data.status}
                tone={data.status === 'COMPLETED' ? 'success' : 'warning'}
              />
              <span className="text-fg-subtle text-xs tabular-nums">
                {fmt(data.updatedAt)}
              </span>
            </div>
          </div>

          {/* 이력서 본문 — 학생 문서 뷰와 동일 렌더(상세 페이지는 외곽선 없이) */}
          <ResumeContentView content={data.content} bordered={false} />

          {/* 피드백 — 운영자는 모든 코멘트 삭제, 강사는 본인 것만(BE 동일 정책). */}
          <ResumeFeedbackSection
            feedbacks={data.feedbacks}
            value={body}
            onChange={setBody}
            onSubmit={onSubmit}
            submitting={
              isAdmin ? addFeedback.isPending : addInstructorFeedback.isPending
            }
            onDelete={onDelete}
            deletingId={deletingId}
            canDelete={(f) => isAdmin || f.authorUserId === user?.id}
          />
        </div>
      )}
    </DataBoundary>
  )
}
