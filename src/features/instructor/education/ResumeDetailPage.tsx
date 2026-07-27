import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { formatDateTime } from '@/shared/lib/date'
import { ResumeContentView } from '@/features/student/resume/ResumeDocView'
import { useCohortRoster } from '../api/console'
import { useAddInstructorResumeFeedback, useInstructorResume } from './api'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성 중',
  COMPLETED: '작성 완료',
}
const fmt = (iso: string | null) => (iso ? formatDateTime(iso) : '-')

/**
 * 강사 이력서 상세 (/instructor/cohorts/:cohortId/resumes/:resumeId).
 * 문서 뷰 + 피드백 목록·작성. 담당 기수가 아니면 BE가 403으로 막는다.
 */
export default function InstructorResumeDetailPage() {
  const { cohortId = '', resumeId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useInstructorResume(
    cohortId,
    resumeId,
  )
  const { data: roster } = useCohortRoster(cohortId)
  const addFeedback = useAddInstructorResumeFeedback()
  const [body, setBody] = useState('')

  const studentName = useMemo(() => {
    const s = (roster ?? []).find((x) => x.userId === data?.studentUserId)
    return s?.name ?? '(이름 미확인)'
  }, [roster, data])

  usePageHeader('이력서 상세', '수강생 이력서 확인 · 피드백 작성')

  const goList = () =>
    navigate(`/instructor/cohorts/${cohortId}/education?tab=resume`)

  const onSubmit = () => {
    if (!body.trim()) {
      toast.danger('피드백 내용을 입력해 주세요')
      return
    }
    addFeedback.mutate(
      { cohortId, resumeId, body: body.trim() },
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

          <ResumeContentView content={data.content} bordered={false} />

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
