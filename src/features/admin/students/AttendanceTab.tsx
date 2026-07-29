import { useMemo, useState } from 'react'
import { FolderOpen, Lock } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Select } from '@/components/ui/Select'
import { AttendanceIssueCell } from './AttendanceIssueCell'
import { cn } from '@/shared/lib/cn'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import type { HrdAttendanceStatus, StudentAttendanceRow } from '@/shared/types'
import { useStudentAttendance } from '../api/students'
import { useCourseConfig, useCourseList } from '../api/settings'

// 출결 필터(이전 LMS 기준). 미입실=입실 없음, 미퇴실=퇴실 없음.
type AttendanceFilter = 'all' | 'late' | 'absent' | 'no_checkin' | 'no_checkout'

const HRD_META: Record<HrdAttendanceStatus, { label: string; cls: string }> = {
  normal: { label: '정상', cls: 'text-success' },
  late: { label: '지각', cls: 'text-warning' },
  absent: { label: '결석', cls: 'text-danger' },
  early_leave: { label: '조퇴·외출', cls: 'text-info' },
  leave_missing: { label: '퇴실 누락', cls: 'text-accent-strong' },
}

// 오늘(YYYY-MM-DD) — 로컬 기준.
function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 선택 가능한 최대 일자 — 오늘. 단 기수가 이미 종료됐으면 종료일.
function maxDate(end: string | null): string {
  const t = today()
  return end && end < t ? end : t
}

// 기본 조회 일자 — 개강일~max(오늘/종료일) 안으로 오늘을 clamp.
function defaultDate(start: string | null, end: string | null): string {
  const t = today()
  const max = maxDate(end)
  if (start && t < start) return start // 미개강 기수: 개강일(조회 데이터는 없을 수 있음)
  return t > max ? max : t
}

// 출결 탭 — HRD-Net 일별 출결 관제. 과정/기수/날짜 선택 → 학생별 입퇴실·상태. (Figma 1457:10799)
export function AttendanceTab() {
  const { data: courses } = useCourseList()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const courseId = selectedCourseId ?? courses?.[0]?.courseId ?? null
  const { data: courseConfig } = useCourseConfig(courseId)
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null)
  // 기본 기수 = 오늘이 기간에 포함된 운영 기수(없으면 첫 기수). 시작일 DESC라 [0]은 최신(미개강일 수 있음).
  const defaultCohortId = useMemo(() => {
    const cohorts = courseConfig?.cohorts ?? []
    const t = today()
    const operating = cohorts.find((c) => c.startDate <= t && t <= c.endDate)
    return operating?.id ?? cohorts[0]?.id ?? null
  }, [courseConfig?.cohorts])
  const cohortId = selectedCohortId ?? defaultCohortId

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

  const [statusFilter, setStatusFilter] = useSearchParamState(
    'statusfilter',
    'all',
  )
  const [q, setQ] = useSearchParamState('q')

  // 이전 LMS 기준: 지각·결석은 상태, 미입실=입실(checkIn) 없음, 미퇴실=퇴실(checkOut) 없음.
  const matchFilter = (r: StudentAttendanceRow, f: AttendanceFilter) => {
    switch (f) {
      case 'late':
        return r.hrdStatus === 'late'
      case 'absent':
        return r.hrdStatus === 'absent'
      case 'no_checkin':
        return r.checkIn === null
      case 'no_checkout':
        return r.checkOut === null
      default:
        return true
    }
  }

  const rows = useMemo(() => data?.rows ?? [], [data])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = rows.filter((r) => {
      if (!matchFilter(r, statusFilter as AttendanceFilter)) return false
      if (needle) {
        const hay = `${r.studentName} ${r.hrdStatusLabel}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    // 이름 가나다순 고정(운영 요구)
    return [...list].sort((a, b) =>
      (a.studentName ?? '').localeCompare(b.studentName ?? '', 'ko'),
    )
  }, [rows, statusFilter, q])

  // 필터 탭 + 건수(전체/지각/결석/미입실/미퇴실).
  const filterTabs: { key: AttendanceFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'late', label: '지각' },
    { key: 'absent', label: '결석' },
    { key: 'no_checkin', label: '미입실' },
    { key: 'no_checkout', label: '미퇴실' },
  ]
  const filterCount = (f: AttendanceFilter) =>
    f === 'all' ? rows.length : rows.filter((r) => matchFilter(r, f)).length

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
    {
      // 그 날 낸 출결 폼 — 유형은 바로 보이고 사유·증빙은 아이콘 호버로 편다.
      key: 'issue',
      header: '이슈사항',
      className: 'w-44',
      cell: (r) => <AttendanceIssueCell issue={r.issue} />,
    },
  ]

  // 선택 컨트롤(과정·기수·월) — 항상 표시.
  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="과정 선택"
        value={courseId}
        onChange={(v) => {
          setSelectedCourseId(v)
          setSelectedCohortId(null)
          setSelectedDate(null)
        }}
        options={(courses ?? []).map((c) => ({
          value: c.courseId,
          label: c.title,
        }))}
        placeholder="등록 과정 없음"
        className="h-11"
      />
      <Select
        aria-label="기수 선택"
        value={cohortId}
        onChange={(v) => {
          setSelectedCohortId(v)
          setSelectedDate(null)
        }}
        options={(courseConfig?.cohorts ?? []).map((c) => ({
          value: c.id,
          label: `${c.cohortNo}기`,
        }))}
        placeholder="기수 없음"
        className="h-11"
      />
      {/* DateTimePicker 루트가 w-full이라 폭 고정 래퍼로 한 줄 유지(좁아지면 wrap). */}
      <div className="w-40">
        <DateTimePicker
          mode="date"
          value={date}
          onChange={(v) => v && setSelectedDate(v)}
          ariaLabel="조회 일자 선택"
          min={selectedCohort?.startDate ?? undefined}
          max={maxDate(selectedCohort?.endDate ?? null)}
        />
      </div>
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

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={refetch}
        loadingText="불러오는 중…"
        errorTitle="출결 현황을 불러오지 못했어요"
        errorDescription="연결 상태를 확인한 뒤 다시 시도해 주세요."
      >
        {data && (
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
                {filterTabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setStatusFilter(t.key)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium',
                      statusFilter === t.key
                        ? 'bg-accent-bg text-accent-strong'
                        : 'text-fg-muted hover:bg-surface-muted',
                    )}
                  >
                    {t.label}{' '}
                    <span className="text-fg-subtle">{filterCount(t.key)}</span>
                  </button>
                ))}
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="이름·출결 상태 검색"
                aria-label="출결 검색"
                className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface h-9 w-56 rounded-lg border px-3 text-sm outline-none"
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
      </DataBoundary>
    </>
  )
}
