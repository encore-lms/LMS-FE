import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/shared/lib/date'
import type { ResumeRow } from '@/features/admin/education/types'
import { useCohortRoster } from '../api/console'
import { useInstructorResumes } from './api'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성 중',
  COMPLETED: '작성 완료',
}
const fmt = (iso: string | null) => (iso ? formatDateTime(iso) : '-')

// 이력서 탭(강사) — 기수 이력서 현황(수강생명 join) + 검색. 상세·피드백은 별도 페이지로 이동.
export function ResumeViewPane({ cohortId }: { cohortId: string }) {
  const { data, isPending, isError, refetch } = useInstructorResumes(cohortId)
  // 학생명 join — 로스터 정본은 auth(/users/cohort-students). 추천서 화면과 동일 관례.
  const { data: roster } = useCohortRoster(cohortId)
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  // 상세는 페이지 전환 — 모달은 이력서 문서를 담기에 좁고 피드백 작성 흐름과도 맞지 않는다.
  const openDetail = (resumeId: string) =>
    navigate(`/instructor/cohorts/${cohortId}/resumes/${resumeId}`)

  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of roster ?? []) map.set(s.userId, s.name)
    return (userId: string) => map.get(userId) ?? '(이름 미확인)'
  }, [roster])

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
          onRowClick={(r) => openDetail(r.id)}
          empty={
            (data?.length ?? 0) === 0
              ? '등록된 이력서가 없어요'
              : '조건에 맞는 이력서가 없어요'
          }
        />
      </div>
    </DataBoundary>
  )
}
