import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import { useStudentAccounts } from '../api/students'
import { useOpsAccounts } from '../api/settings'
import { ActionModal, type ActionModalSpec } from '../settings/ActionModal'
import type { InstructorAssignmentRow, AssignmentSubmissionRow } from './types'
import {
  useAssignmentSubmissions,
  useChangeSubmissionStatus,
  useCohortAssignments,
  useDeleteInstructorAssignment,
} from './api'

const SUB_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  submitted: { label: '제출', tone: 'info' },
  supplement_requested: { label: '보완 요청', tone: 'warning' },
  review_done: { label: '검토 완료', tone: 'success' },
  not_submitted: { label: '미제출', tone: 'neutral' },
}

// 제출 현황 검토 모달 — 학생별 제출(본문·URL·상태) + 상태 변경(보완요청/검토완료) + 피드백.
function SubmissionsModal({
  assignmentId,
  title,
  nameOf,
  onClose,
}: {
  assignmentId: string
  title: string
  nameOf: (userId: string) => string
  onClose: () => void
}) {
  const { data, isPending } = useAssignmentSubmissions(assignmentId)
  const { data: ops } = useOpsAccounts()
  const changeStatus = useChangeSubmissionStatus(assignmentId)
  const toast = useToast()
  const [openRow, setOpenRow] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  const authorName = useMemo(() => {
    if (!data) return '운영자'
    const o = (ops?.items ?? []).find((x) => x.id === data.createdByUserId)
    return o?.name ?? '운영자'
  }, [ops, data])

  const act = (submissionId: string, status: string) => {
    changeStatus.mutate(
      { submissionId, status, feedback: feedback.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(
            status === 'review_done'
              ? '검토 완료 처리했어요'
              : '보완 요청했어요',
          )
          setFeedback('')
        },
        onError: () => toast.danger('처리에 실패했어요'),
      },
    )
  }

  return (
    <Modal open onClose={onClose} size="lg" footer={null}>
      <div className="flex flex-col gap-4">
        {/* 과제 상세 — 제목·작성자 / 작성일·마감일 / 내용 */}
        <article>
          <h2 className="text-fg text-[22px] leading-snug font-bold">
            {data?.assignmentTitle ?? title}
          </h2>
          <div className="text-fg-muted mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            <span>작성자 {authorName}</span>
          </div>
          <div className="text-fg-muted mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            <span>작성일 {data?.createdAtLabel || '-'}</span>
            <span className="bg-border h-3 w-px" />
            <span className={data?.closed ? 'text-danger' : undefined}>
              마감일 {data?.dueAtLabel || '없음'}
              {data?.dueLabel ? ` (${data.dueLabel})` : ''}
            </span>
          </div>
          <div className="text-fg mt-4 text-[15px] leading-7 break-words whitespace-pre-wrap">
            {data?.description?.trim() ? (
              data.description
            ) : (
              <span className="text-fg-subtle italic">내용이 없습니다.</span>
            )}
          </div>
        </article>

        {/* 구분선 + 제출 현황 */}
        <div className="border-divider border-t pt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-fg text-[15px] font-bold">제출 현황</h3>
            <p className="text-fg-muted text-xs">
              제출 {data?.counts.submitted ?? 0} · 보완{' '}
              {data?.counts.supplementRequested ?? 0} · 검토완료{' '}
              {data?.counts.reviewDone ?? 0}
            </p>
          </div>
        </div>

        {isPending ? (
          <div className="text-fg-muted py-8 text-center">불러오는 중…</div>
        ) : !data || data.rows.length === 0 ? (
          <Empty
            icon={<Users className="h-6 w-6" />}
            title="제출이 없어요"
            description="수강생이 제출하면 여기에서 검토할 수 있어요."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {data.rows.map((r: AssignmentSubmissionRow) => {
              const open = openRow === r.id
              const st = SUB_STATUS[r.status] ?? SUB_STATUS.submitted
              return (
                <div
                  key={r.id}
                  className="border-border overflow-hidden rounded-xl border"
                >
                  <button
                    type="button"
                    onClick={() => setOpenRow(open ? null : r.id)}
                    className="hover:bg-surface-muted flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-fg text-sm font-semibold">
                        {nameOf(r.studentUserId)}
                      </span>
                      <StatusBadge label={st.label} tone={st.tone} />
                    </span>
                    <span className="text-fg-subtle text-xs tabular-nums">
                      {r.submittedAtLabel ?? '-'}
                    </span>
                  </button>

                  {open && (
                    <div className="border-divider flex flex-col gap-3 border-t px-4 py-3">
                      {r.bodyText && (
                        <p className="text-fg text-[14px] leading-6 whitespace-pre-wrap">
                          {r.bodyText}
                        </p>
                      )}
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-info text-[13px] break-all hover:underline"
                        >
                          {r.url}
                        </a>
                      )}

                      {r.feedbacks.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          {r.feedbacks.map((f, i) => (
                            <div
                              key={i}
                              className="bg-surface-muted rounded-lg px-3 py-2"
                            >
                              <p className="text-fg text-[13px] whitespace-pre-wrap">
                                {f.text}
                              </p>
                              <p className="text-fg-subtle mt-0.5 text-[11px]">
                                {f.byStudent ? '수강생' : '운영/강사'} ·{' '}
                                {f.timeLabel}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 검토 액션 */}
                      <textarea
                        value={openRow === r.id ? feedback : ''}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="피드백(선택) 입력 후 상태 변경"
                        rows={2}
                        className="border-border focus:border-brand text-fg bg-surface rounded-lg border px-3 py-2 text-sm outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => act(r.id, 'supplement_requested')}
                          disabled={changeStatus.isPending}
                        >
                          보완 요청
                        </Button>
                        <Button
                          onClick={() => act(r.id, 'review_done')}
                          disabled={changeStatus.isPending}
                        >
                          검토 완료
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// 과제 탭 — 강사식 과제 관리(실 BE). 선택 기수 스코프: 목록·생성·제출 현황·검토.
export function AssignmentsPane({
  courseId,
  cohortId,
}: {
  courseId: string
  cohortId: string
}) {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useCohortAssignments(cohortId)
  const { data: students } = useStudentAccounts(cohortId)
  const deleteA = useDeleteInstructorAssignment(cohortId)
  const toast = useToast()

  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of students?.items ?? []) map.set(s.id, s.name)
    return (userId: string) => map.get(userId) ?? '수강생'
  }, [students])

  // 목록 필터 — KPI 카드 대신 상태·검색으로 좁혀 본다(운영 요구).
  const [statusFilter, setStatusFilter] = useState('all')
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const needle = q.trim()
    return (data?.items ?? []).filter((r) => {
      if (needle && !r.title.includes(needle)) return false
      switch (statusFilter) {
        case 'submitted':
          return r.counts.submitted > 0
        case 'supplement':
          return r.counts.supplementRequested > 0
        case 'done':
          return r.counts.reviewDone > 0
        case 'closed':
          return r.closed
        default:
          return true
      }
    })
  }, [data, q, statusFilter])
  const [subView, setSubView] = useState<InstructorAssignmentRow | null>(null)
  // 삭제 확인 대상 — 파괴적 액션은 ActionModal 확인을 거친다.
  const [deleteTarget, setDeleteTarget] =
    useState<InstructorAssignmentRow | null>(null)

  // 과제 등록·수정은 강사·운영 공용 폼 페이지로 이동(팝업 폐지, 첨부 포함).
  const hubQs = `?course=${courseId}&cohort=${cohortId}`
  const goCreate = () => navigate(`/admin/education/assignments/new${hubQs}`)
  const goEdit = (id: string) =>
    navigate(`/admin/education/assignments/${id}${hubQs}`)

  const deleteSpec: ActionModalSpec | null = deleteTarget
    ? {
        title: '과제 삭제',
        subtitle: '삭제한 과제는 복구할 수 없습니다.',
        rows: [
          { label: '과제', value: deleteTarget.title },
          {
            label: '제출 현황',
            value: `제출 ${deleteTarget.counts.submitted} · 보완 ${deleteTarget.counts.supplementRequested} · 검토 ${deleteTarget.counts.reviewDone}`,
          },
          { label: '처리', value: '과제·제출 이력 영구 삭제' },
        ],
        confirmLabel: '삭제',
      }
    : null
  const onDelete = () => {
    if (!deleteTarget) return
    const r = deleteTarget
    deleteA.mutate(r.id, {
      onSuccess: () => toast.success(`삭제 — ${r.title}`),
      onError: () => toast.danger('삭제에 실패했어요'),
      onSettled: () => setDeleteTarget(null),
    })
  }

  const columns: Column<InstructorAssignmentRow>[] = [
    {
      key: 'title',
      header: '과제',
      cell: (r) => (
        <div className="flex flex-col">
          <span className="text-fg font-medium">{r.title}</span>
        </div>
      ),
    },
    {
      key: 'due',
      header: '마감',
      className: 'w-28',
      cell: (r) => (
        <span
          className={r.closed ? 'text-danger text-xs' : 'text-fg-muted text-xs'}
        >
          {r.dueLabel}
        </span>
      ),
    },
    {
      key: 'counts',
      header: '제출 현황',
      className: 'w-44',
      cell: (r) => (
        <span className="text-fg-muted text-[13px]">
          제출 {r.counts.submitted} · 보완 {r.counts.supplementRequested} · 검토{' '}
          {r.counts.reviewDone}
        </span>
      ),
    },
    {
      key: 'action',
      header: '액션',
      align: 'right',
      className: 'w-40',
      cell: (r) => (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setSubView(r)
            }}
            className="bg-info-bg text-info hover:bg-info-bg/70 rounded-md px-2 py-1 text-xs font-medium"
          >
            제출 현황
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goEdit(r.id)
            }}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium"
          >
            수정
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteTarget(r)
            }}
            className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2 py-1 text-xs font-medium"
          >
            삭제
          </button>
        </div>
      ),
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="불러오는 중…"
      errorTitle="과제를 불러오지 못했어요"
      errorDescription="일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요."
    >
      <div>
        {/* KPI 카드 대신 필터 바 — 검색·제출 상태로 목록을 좁힌다(운영 요구). */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-fg-muted text-sm">
            총 {filtered.length}개 과제
            {data && filtered.length !== data.total && ` (전체 ${data.total})`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="border-border focus-within:border-brand bg-surface flex h-9 w-56 items-center gap-2 rounded-lg border px-3">
              <Search className="text-fg-subtle h-4 w-4 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="과제·과목 검색"
                aria-label="과제 검색"
                className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none focus-visible:shadow-none"
              />
            </div>
            <Select
              aria-label="제출 상태 필터"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: '전체' },
                { value: 'submitted', label: '제출 있음' },
                { value: 'supplement', label: '보완 요청' },
                { value: 'done', label: '검토 완료' },
                { value: 'closed', label: '마감됨' },
              ]}
            />
            <Button onClick={goCreate}>
              <Plus className="h-4 w-4" /> 과제 등록
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSubView(r)}
          empty={
            (data?.total ?? 0) === 0
              ? '등록된 과제가 없어요'
              : '조건에 맞는 과제가 없어요'
          }
        />

        {/* 과제 삭제 확인 — 복구 불가 액션 */}
        <ActionModal
          spec={deleteSpec}
          onClose={() => setDeleteTarget(null)}
          onConfirm={onDelete}
          pending={deleteA.isPending}
        />

        {/* 제출 현황 검토 */}
        {subView && (
          <SubmissionsModal
            assignmentId={subView.id}
            title={subView.title}
            nameOf={nameOf}
            onClose={() => setSubView(null)}
          />
        )}
      </div>
    </DataBoundary>
  )
}
