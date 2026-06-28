import { useMemo, useState } from 'react'
import { AlertTriangle, FolderOpen, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { cn } from '@/shared/lib/cn'
import type { HrdAttendanceStatus, StudentAttendanceRow } from '@/shared/types'
import { useStudentAttendance } from '../api/students'
import { useCourseConfig, useCourseList } from '../api/settings'

const HRD_META: Record<HrdAttendanceStatus, { label: string; cls: string }> = {
  normal: { label: '정상', cls: 'text-success' },
  late: { label: '지각', cls: 'text-warning' },
  absent: { label: '결석', cls: 'text-danger' },
  early_leave: { label: '조퇴·외출', cls: 'text-info' },
  leave_missing: { label: '퇴실 누락', cls: 'text-accent-strong' },
}

// 오늘(YYYY-MM-DD).
function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 기수 기간으로 기본 조회 일자 결정 — 오늘이 기간 안이면 오늘, 종료 후면 종료일, 시작 전이면 시작일.
function defaultDate(start: string | null, end: string | null): string {
  const t = today()
  if (start && t < start) return start
  if (end && t > end) return end
  return t
}

// 출결 탭 — HRD-Net 일별 출결 관제. 과정/기수/날짜 선택 → 학생별 입퇴실·상태. (Figma 1457:10799)
export function AttendanceTab() {
  const { data: courses } = useCourseList()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const courseId = selectedCourseId ?? courses?.[0]?.courseId ?? null
  const { data: courseConfig } = useCourseConfig(courseId)
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null)
  const cohortId = selectedCohortId ?? courseConfig?.cohorts?.[0]?.id ?? null

  const selectedCohort = courseConfig?.cohorts?.find((c) => c.id === cohortId)
  // 기수 기간 기준 기본 일자(기수 바뀌면 자동 갱신).
  const fallbackDate = useMemo(
    () =>
      defaultDate(
        selectedCohort?.startDate ?? null,
        selectedCohort?.endDate ?? null,
      ),
    [selectedCohort?.startDate, selectedCohort?.endDate],
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const date = selectedDate ?? fallbackDate

  const { data, isPending, isError, refetch } = useStudentAttendance(
    courseId,
    cohortId,
    date,
  )

  const [onlyIssues, setOnlyIssues] = useState(false)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const rows = data?.rows ?? []
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (onlyIssues && r.hrdStatus === 'normal') return false
      if (needle) {
        const hay = `${r.studentName} ${r.hrdStatusLabel}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [data, onlyIssues, q])

  const columns: Column<StudentAttendanceRow>[] = [
    {
      key: 'student',
      header: '수강생',
      className: 'w-32',
      cell: (r) => <span className="text-fg font-medium">{r.studentName}</span>,
    },
    {
      key: 'in',
      header: '입실',
      className: 'w-20',
      cell: (r) => (
        <span className="text-fg-muted tabular-nums">{r.checkIn ?? '-'}</span>
      ),
    },
    {
      key: 'out',
      header: '퇴실',
      className: 'w-20',
      cell: (r) => (
        <span className="text-fg-muted tabular-nums">{r.checkOut ?? '-'}</span>
      ),
    },
    {
      key: 'hrd',
      header: 'HRD 상태',
      className: 'w-28',
      cell: (r) => (
        <span className={cn('text-sm font-medium', HRD_META[r.hrdStatus].cls)}>
          {r.hrdStatusLabel || HRD_META[r.hrdStatus].label}
        </span>
      ),
    },
  ]

  // 선택 컨트롤(과정·기수·월) — 항상 표시.
  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="과정 선택"
        value={courseId ?? ''}
        onChange={(e) => {
          setSelectedCourseId(e.target.value)
          setSelectedCohortId(null)
          setSelectedDate(null)
        }}
        className="border-border focus:border-brand text-fg h-9 rounded-lg border bg-white px-3 text-sm outline-none"
      >
        {(courses ?? []).map((c) => (
          <option key={c.courseId} value={c.courseId}>
            {c.title}
          </option>
        ))}
        {(courses ?? []).length === 0 && (
          <option value="">등록 과정 없음</option>
        )}
      </select>
      <select
        aria-label="기수 선택"
        value={cohortId ?? ''}
        onChange={(e) => {
          setSelectedCohortId(e.target.value)
          setSelectedDate(null)
        }}
        className="border-border focus:border-brand text-fg h-9 rounded-lg border bg-white px-3 text-sm outline-none"
      >
        {(courseConfig?.cohorts ?? []).map((c) => (
          <option key={c.id} value={c.id}>
            {c.cohortNo}기
          </option>
        ))}
        {(courseConfig?.cohorts ?? []).length === 0 && (
          <option value="">기수 없음</option>
        )}
      </select>
      <input
        type="date"
        aria-label="조회 일자 선택"
        value={date}
        min={selectedCohort?.startDate ?? undefined}
        max={selectedCohort?.endDate ?? undefined}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="border-border focus:border-brand text-fg h-9 rounded-lg border bg-white px-3 text-sm outline-none"
      />
    </div>
  )

  if (!courseId || !cohortId) {
    return (
      <>
        <div className="mb-4">{controls}</div>
        <Empty
          icon={<FolderOpen className="h-6 w-6" />}
          title="조회할 과정·기수를 선택하세요"
          description="등록된 과정이 없으면 ‘교육 과정 추가’에서 먼저 등록해 주세요."
        />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {controls}
        <p className="text-info flex items-center gap-1 text-xs font-medium">
          <Lock className="h-3 w-3" /> HRD-Net 원본은 읽기 전용입니다.
        </p>
      </div>

      {isPending ? (
        <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
      ) : isError || !data ? (
        <Empty
          icon={<AlertTriangle className="h-6 w-6" />}
          title="출결 현황을 불러오지 못했어요"
          description="실 BE(learning-service)·HRD Key 연결을 확인한 뒤 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard
              label="출석(정상)"
              value={data.summary.present}
              tone="success"
            />
            <KpiCard label="지각" value={data.summary.late} tone="warning" />
            <KpiCard
              label="조퇴·외출"
              value={data.summary.earlyLeaveOuting}
              tone="info"
            />
            <KpiCard label="결석" value={data.summary.absent} tone="danger" />
            <KpiCard
              label="퇴실 누락"
              value={data.summary.hrdMismatch}
              tone="accent"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1">
              <span className="bg-accent-bg text-accent-strong rounded-md px-3 py-1.5 text-sm font-medium">
                {data.cohortLabel} · {data.date}
              </span>
              <button
                type="button"
                onClick={() => setOnlyIssues(false)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  !onlyIssues
                    ? 'bg-surface-muted text-fg'
                    : 'text-fg-muted hover:bg-surface-muted',
                )}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setOnlyIssues(true)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  onlyIssues
                    ? 'bg-surface-muted text-fg'
                    : 'text-fg-muted hover:bg-surface-muted',
                )}
              >
                이상만
              </button>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="이름·출결 상태 검색"
              aria-label="출결 검색"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-9 w-56 rounded-lg border bg-white px-3 text-sm outline-none"
            />
          </div>

          <div className="mt-3">
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              empty="해당 월의 출결 데이터가 없어요 (HRD-Net 미집계 월일 수 있어요)"
            />
            <div className="text-fg-subtle mt-3 text-xs">
              총 {filtered.length}건
            </div>
          </div>
        </>
      )}
    </>
  )
}
