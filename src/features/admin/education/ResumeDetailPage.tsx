import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { formatDateTime } from '@/shared/lib/date'
import { useStudentAccounts } from '../api/students'
import { ResumeContentView } from '@/features/student/resume/ResumeDocView'
import { useAddResumeFeedback, useResume } from './api'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성 중',
  COMPLETED: '작성 완료',
}
const fmt = (iso: string | null) => (iso ? formatDateTime(iso) : '-')

// 운영 이력서 상세(페이지) — 과정·기수·교과목 이력서 탭에서 진입. content 문서 뷰 + 피드백.
// courseId/cohortId는 목록(ResumePane)에서 쿼리로 전달.
export default function ResumeDetailPage() {
  const { resumeId = '' } = useParams()
  const [params] = useSearchParams()
  const courseId = params.get('courseId') ?? ''
  const cohortId = params.get('cohortId') ?? ''
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useResume(
    courseId,
    cohortId,
    resumeId,
  )
  const { data: students } = useStudentAccounts(cohortId)
  const addFeedback = useAddResumeFeedback()
  const [body, setBody] = useState('')

  const studentName = useMemo(() => {
    const s = (students?.items ?? []).find((x) => x.id === data?.studentUserId)
    return s?.name ?? '(이름 미확인)'
  }, [students, data])

  usePageHeader('이력서 상세', '수강생 이력서 본문 확인 · 피드백 작성')

  // 진입 시 과정·기수 컨텍스트를 유지해 이력서 탭으로 복귀(EducationPage가 URL로 상태 복원).
  const goList = () => {
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
    addFeedback.mutate(
      { courseId, cohortId, resumeId, body: body.trim() },
      {
        onSuccess: () => {
          toast.success('피드백을 등록했어요')
          setBody('')
        },
        onError: () => toast.danger('피드백 등록에 실패했어요'),
      },
    )
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

          {/* 피드백 */}
          <section className="border-border bg-surface rounded-xl border p-5">
            <p className="text-fg mb-3 text-sm font-semibold">
              피드백 {data.feedbacks.length}건
            </p>
            <div className="mb-3 flex flex-col gap-2">
              {data.feedbacks.length === 0 ? (
                <p className="text-fg-subtle text-xs">아직 피드백이 없어요.</p>
              ) : (
                data.feedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="bg-surface-muted rounded-lg px-3 py-2"
                  >
                    <p className="text-fg text-[13px] whitespace-pre-wrap">
                      {f.body}
                    </p>
                    <p className="text-fg-subtle mt-1 text-[11px] tabular-nums">
                      {fmt(f.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-start gap-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="피드백을 입력하세요"
                rows={2}
                className="border-border focus:border-brand text-fg bg-surface flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus-visible:shadow-none"
              />
              <Button onClick={onSubmit} disabled={addFeedback.isPending}>
                <MessageSquarePlus className="h-4 w-4" /> 등록
              </Button>
            </div>
          </section>
        </div>
      )}
    </DataBoundary>
  )
}
