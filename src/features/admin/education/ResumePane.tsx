import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { formatDateTime } from '@/shared/lib/date'
import { useStudentAccounts } from '../api/students'
import type { ResumeRow } from './types'
import { useResumes } from './api'
import { SearchInput } from '@/components/ui/SearchInput'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성 중',
  COMPLETED: '작성 완료',
}
const fmt = (iso: string | null) => (iso ? formatDateTime(iso) : '-')

// 이력서 탭 — 기수 이력서 현황(학생명 join) + 검색 + 상세(페이지 전환). 정본 §32 lean.
export function ResumePane({
  courseId,
  cohortId,
}: {
  courseId: string
  cohortId: string
}) {
  const { data, isPending, isError, refetch } = useResumes(courseId, cohortId)
  const { data: students } = useStudentAccounts(cohortId)
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of students?.items ?? []) map.set(s.id, s.name)
    return (userId: string) => map.get(userId) ?? '(이름 미확인)'
  }, [students])

  // 상세는 페이지 전환 — courseId/cohortId는 쿼리로 넘긴다.
  const openDetail = (resumeId: string) =>
    navigate(
      `/admin/education/resume/${resumeId}?courseId=${courseId}&cohortId=${cohortId}`,
    )

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
      className: 'w-32',
      cell: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            openDetail(r.id)
          }}
          className="bg-info-bg text-info hover:bg-info-bg/70 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap"
        >
          상세·피드백
        </button>
      ),
    },
  ]

  // 이름 또는 이력서 제목으로 검색(클라이언트 필터).
  const needle = q.trim().toLowerCase()
  const matched = needle
    ? (data ?? []).filter(
        (r) =>
          nameOf(r.studentUserId).toLowerCase().includes(needle) ||
          r.title.toLowerCase().includes(needle),
      )
    : (data ?? [])
  // 이름 가나다순 고정(운영 요구)
  const rows = [...matched].sort((a, b) =>
    nameOf(a.studentUserId).localeCompare(nameOf(b.studentUserId), 'ko'),
  )

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="불러오는 중…"
      errorTitle="이력서 현황을 불러오지 못했어요"
      errorDescription="일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요."
    >
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-fg-muted text-sm">
            총 {rows.length}개 이력서
            {needle && data && (
              <span className="text-fg-subtle"> · 전체 {data.length}</span>
            )}
          </p>
          {/* 탭 공통 필터 바 규격 — 검색은 우측·아이콘 포함·w-56 */}
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="이름·이력서 제목 검색"
            ariaLabel="이력서 검색"
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={(r) => openDetail(r.id)}
          empty={needle ? '검색 결과가 없어요' : '등록된 이력서가 없어요'}
        />
      </div>
    </DataBoundary>
  )
}
