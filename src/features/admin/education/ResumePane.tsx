import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { formatDateTime } from '@/shared/lib/date'
import { useStudentAccounts, useCohortRoster } from '@/shared/api/students'
import type { ResumeRow } from './types'
import { useResumes } from './api'
import { ListToolbar } from '@/components/ui/ListToolbar'
import { useInstructorResumes } from '@/features/instructor/education/api'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성 중',
  COMPLETED: '작성 완료',
}
const fmt = (iso: string | null) => (iso ? formatDateTime(iso) : '-')

// 이력서 탭 — 기수 이력서 현황(수강생명 join) + 검색 + 상세(페이지 전환). 정본 §32 lean.
// source: 매니저(admin, 기본)·강사(instructor) 공용 — 데이터·이름 join·상세 경로만 역할 미러(MaterialsPane 규약).
export function ResumePane({
  courseId,
  cohortId,
  source = 'admin',
}: {
  /** 매니저(source='admin')만 필요. */
  courseId?: string
  cohortId: string
  source?: 'admin' | 'instructor'
}) {
  const isAdmin = source === 'admin'
  const adminQuery = useResumes(
    isAdmin ? (courseId ?? null) : null,
    isAdmin ? cohortId : null,
  )
  const instructorQuery = useInstructorResumes(isAdmin ? null : cohortId)
  const { data, isPending, isError, refetch } = isAdmin
    ? adminQuery
    : instructorQuery
  // 수강생명 join — 매니저는 계정 목록, 강사는 계정 목록이 403이라 담당 기수 로스터.
  const { data: students } = useStudentAccounts(cohortId, isAdmin)
  const { data: roster } = useCohortRoster(isAdmin ? null : cohortId)
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    if (isAdmin) for (const s of students?.items ?? []) map.set(s.id, s.name)
    else for (const r of roster ?? []) map.set(r.userId, r.name)
    return (userId: string) => map.get(userId) ?? '(이름 미확인)'
  }, [isAdmin, students, roster])

  // 상세는 페이지 전환 — 매니저는 courseId/cohortId를 쿼리로, 강사는 기수 스코프 경로로.
  const openDetail = (resumeId: string) =>
    navigate(
      isAdmin
        ? `/admin/education/resume/${resumeId}?courseId=${courseId}&cohortId=${cohortId}`
        : `/instructor/cohorts/${cohortId}/resumes/${resumeId}`,
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
        {/* 탭 공통 툴바(ListToolbar) — 좌: 총 개수 / 우: 검색(2026-08-07 통일). */}
        <div className="mb-3">
          <ListToolbar
            left={
              <span>
                총 {rows.length}개 이력서
                {needle && data && (
                  <span className="text-fg-subtle"> · 전체 {data.length}</span>
                )}
              </span>
            }
            search={{
              value: q,
              onChange: setQ,
              placeholder: '이름·이력서 제목 검색',
              ariaLabel: '이력서 검색',
            }}
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
