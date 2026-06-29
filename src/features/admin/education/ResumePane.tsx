import { useMemo, useState } from 'react'
import { AlertTriangle, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { useToast } from '@/components/ui/use-toast'
import { useStudentAccounts } from '../api/students'
import type { ResumeRow } from './types'
import { useAddResumeFeedback, useResume, useResumes } from './api'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성 중',
  COMPLETED: '작성 완료',
}
const fmt = (iso: string | null) =>
  iso ? iso.slice(0, 16).replace('T', ' ') : '-'

// 이력서 상세 팝업 — content + 피드백 목록 + 피드백 작성(실 BE).
function ResumeDetailModal({
  courseId,
  cohortId,
  resumeId,
  studentName,
  onClose,
}: {
  courseId: string
  cohortId: string
  resumeId: string
  studentName: string
  onClose: () => void
}) {
  const { data, isPending } = useResume(courseId, cohortId, resumeId)
  const addFeedback = useAddResumeFeedback()
  const toast = useToast()
  const [body, setBody] = useState('')

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
    <Modal
      open
      onClose={onClose}
      title={`이력서 상세 — ${studentName}`}
      footer={
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {isPending || !data ? (
        <div className="text-fg-muted py-8 text-center">불러오는 중…</div>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <dl className="flex flex-col gap-3">
            <div className="flex gap-3">
              <dt className="text-fg-muted w-16 shrink-0">제목</dt>
              <dd className="text-fg font-medium">{data.title}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-fg-muted w-16 shrink-0">상태</dt>
              <dd>
                <StatusBadge
                  label={STATUS_LABEL[data.status] ?? data.status}
                  tone={data.status === 'COMPLETED' ? 'success' : 'warning'}
                />
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-fg-muted w-16 shrink-0">내용</dt>
              <dd className="text-fg min-w-0 flex-1 break-words whitespace-pre-wrap">
                {data.content || '-'}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-fg-muted w-16 shrink-0">수정일</dt>
              <dd className="text-fg-muted tabular-nums">
                {fmt(data.updatedAt)}
              </dd>
            </div>
          </dl>

          {/* 피드백 */}
          <div className="border-divider border-t pt-4">
            <p className="text-fg mb-2 text-[13px] font-semibold">
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
                className="border-border focus:border-brand text-fg flex-1 rounded-lg border bg-white px-3 py-2 text-sm outline-none"
              />
              <Button onClick={onSubmit} disabled={addFeedback.isPending}>
                <MessageSquarePlus className="h-4 w-4" /> 등록
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

// 이력서 탭 — 기수 이력서 현황(학생명 join) + 상세/피드백(실 BE). 정본 §32 lean.
export function ResumePane({
  courseId,
  cohortId,
}: {
  courseId: string
  cohortId: string
}) {
  const { data, isPending, isError, refetch } = useResumes(courseId, cohortId)
  const { data: students } = useStudentAccounts(cohortId)
  const [openRow, setOpenRow] = useState<ResumeRow | null>(null)

  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of students?.items ?? []) map.set(s.id, s.name)
    return (userId: string) => map.get(userId) ?? '(이름 미확인)'
  }, [students])

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="이력서 현황을 불러오지 못했어요"
        description="실 BE(learning-service) 연결을 확인한 뒤 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const columns: Column<ResumeRow>[] = [
    {
      key: 'student',
      header: '수강생',
      cell: (r) => (
        <span className="text-fg font-medium">{nameOf(r.studentUserId)}</span>
      ),
    },
    {
      key: 'title',
      header: '이력서 제목',
      cell: (r) => <span className="text-fg text-[13px]">{r.title}</span>,
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={STATUS_LABEL[r.status] ?? r.status}
          tone={r.status === 'COMPLETED' ? 'success' : 'warning'}
        />
      ),
    },
    {
      key: 'feedback',
      header: '피드백',
      className: 'w-20',
      cell: (r) => (
        <span className="text-fg-muted text-[13px] tabular-nums">
          {r.feedbackCount}건
        </span>
      ),
    },
    {
      key: 'updated',
      header: '수정일',
      className: 'w-40',
      cell: (r) => (
        <span className="text-fg-subtle text-xs tabular-nums">
          {fmt(r.updatedAt)}
        </span>
      ),
    },
    {
      key: 'action',
      header: '액션',
      align: 'right',
      className: 'w-24',
      cell: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpenRow(r)
          }}
          className="bg-info-bg text-info hover:bg-info-bg/70 rounded-md px-2 py-1 text-xs font-medium"
        >
          상세·피드백
        </button>
      ),
    },
  ]

  return (
    <div>
      <p className="text-fg-muted mb-3 text-sm">총 {data.length}개 이력서</p>
      <DataTable
        columns={columns}
        rows={data}
        rowKey={(r) => r.id}
        onRowClick={(r) => setOpenRow(r)}
        empty="등록된 이력서가 없어요"
      />
      {openRow && (
        <ResumeDetailModal
          courseId={courseId}
          cohortId={cohortId}
          resumeId={openRow.id}
          studentName={nameOf(openRow.studentUserId)}
          onClose={() => setOpenRow(null)}
        />
      )}
    </div>
  )
}
