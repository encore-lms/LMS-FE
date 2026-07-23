import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/shared/lib/date'
import type { ResumeRow } from '@/features/admin/education/types'
import { useCohortStudents } from '../api/console'
import { useInstructorResume, useInstructorResumes } from './api'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성 중',
  COMPLETED: '작성 완료',
}
const fmt = (iso: string | null) => (iso ? formatDateTime(iso) : '-')

// 이력서 상세(조회 전용) — 본문 + 피드백 목록. 피드백 작성은 운영자 전용이라 여기선 표시만.
function ResumeDetailModal({
  cohortId,
  resumeId,
  studentName,
  onClose,
}: {
  cohortId: string
  resumeId: string
  studentName: string
  onClose: () => void
}) {
  const { data, isPending, isError, refetch } = useInstructorResume(
    cohortId,
    resumeId,
  )
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        errorTitle="이력서를 불러오지 못했어요"
      >
        {data && (
          <div>
            <header className="border-divider border-b pb-4">
              <div className="mb-2 flex items-center gap-2">
                <StatusBadge
                  label={STATUS_LABEL[data.status] ?? data.status}
                  tone={data.status === 'COMPLETED' ? 'success' : 'neutral'}
                />
                <span className="text-fg-subtle text-xs">
                  수정 {fmt(data.updatedAt)}
                </span>
              </div>
              <h1 className="text-fg text-xl font-bold">{data.title}</h1>
              <p className="text-fg-muted mt-1 text-sm">{studentName}</p>
            </header>

            <div className="text-fg py-5 text-[15px] leading-7 break-words whitespace-pre-wrap">
              {data.content && data.content.trim() ? (
                data.content
              ) : (
                <span className="text-fg-subtle italic">
                  아직 작성된 내용이 없습니다.
                </span>
              )}
            </div>

            <div className="border-divider border-t pt-4">
              <p className="text-fg-muted mb-3 text-sm font-semibold">
                피드백 {data.feedbacks.length}건
              </p>
              {data.feedbacks.length === 0 ? (
                <p className="text-fg-subtle text-sm">
                  등록된 피드백이 없습니다.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.feedbacks.map((f) => (
                    <li
                      key={f.id}
                      className="bg-surface-muted rounded-lg p-3 text-sm"
                    >
                      <p className="text-fg break-words whitespace-pre-wrap">
                        {f.body}
                      </p>
                      <p className="text-fg-subtle mt-1.5 text-xs">
                        {fmt(f.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DataBoundary>
    </Modal>
  )
}

// 이력서 탭(강사 조회 전용) — 기수 이력서 현황(수강생명 join) + 검색 + 상세 팝업. 피드백 작성 없음.
export function ResumeViewPane({ cohortId }: { cohortId: string }) {
  const { data, isPending, isError, refetch } = useInstructorResumes(cohortId)
  const { data: students } = useCohortStudents(cohortId)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<ResumeRow | null>(null)

  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of students?.rows ?? []) map.set(s.id, s.name)
    return (userId: string) => map.get(userId) ?? '(이름 미확인)'
  }, [students])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data ?? []).filter((r) => {
      if (!needle) return true
      return (
        r.title.toLowerCase().includes(needle) ||
        nameOf(r.studentUserId).toLowerCase().includes(needle)
      )
    })
  }, [data, q, nameOf])

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
          tone={r.status === 'COMPLETED' ? 'success' : 'neutral'}
        />
      ),
    },
    {
      key: 'feedback',
      header: '피드백',
      className: 'w-20',
      cell: (r) => (
        <span className="text-fg-muted text-sm tabular-nums">
          {r.feedbackCount}건
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: '수정일',
      className: 'w-40',
      cell: (r) => (
        <span className="text-fg-subtle text-xs tabular-nums">
          {fmt(r.updatedAt)}
        </span>
      ),
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<SkeletonListPage columns={5} className="" />}
      errorTitle="이력서 현황을 불러오지 못했어요"
      errorDescription="일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요."
    >
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-fg-muted text-sm">총 {filtered.length}명</p>
          <div className="border-border focus-within:border-brand bg-surface flex h-9 w-56 items-center gap-2 rounded-lg border px-3">
            <Search className="text-fg-subtle h-4 w-4 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="수강생·제목 검색"
              aria-label="이력서 검색"
              className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          onRowClick={(r) => setOpen(r)}
          empty={
            (data?.length ?? 0) === 0
              ? '등록된 이력서가 없어요'
              : '조건에 맞는 이력서가 없어요'
          }
        />

        {open && (
          <ResumeDetailModal
            cohortId={cohortId}
            resumeId={open.id}
            studentName={nameOf(open.studentUserId)}
            onClose={() => setOpen(null)}
          />
        )}
      </div>
    </DataBoundary>
  )
}
