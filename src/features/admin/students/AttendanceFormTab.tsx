import { useMemo, useState } from 'react'
import { AlertTriangle, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { cn } from '@/shared/lib/cn'
import { formatDateTime } from '@/shared/lib/date'
import type { AttendanceFormRow, AttendanceFormType } from '@/shared/types'
import { useStudentAccounts, useStudentAttendanceForms } from '../api/students'
import { useCourseConfig, useCourseList } from '../api/settings'

const TYPE_META: Record<
  AttendanceFormType,
  { label: string; tone: BadgeTone }
> = {
  late: { label: '지각', tone: 'warning' },
  early_leave: { label: '조퇴', tone: 'info' },
  absent: { label: '결석', tone: 'danger' },
  outing: { label: '외출', tone: 'info' },
}

// 대상일자 필터: 전체 / 오늘 / 날짜 선택.
type DateFilter = 'all' | 'today' | 'pick'

// 출결폼 행 + 조인된 학생 이름·생년월일.
type FormRowView = AttendanceFormRow & { name: string; birth: string }

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 출결 폼 탭 — 수강생 제출 출결 폼 조회(조회 전용). 과정/기수 필터. (Figma 1457:10955)
export function AttendanceFormTab() {
  const { data: courses } = useCourseList()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const courseId = selectedCourseId ?? courses?.[0]?.courseId ?? null
  const { data: courseConfig } = useCourseConfig(courseId)
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null)
  const cohortId = selectedCohortId ?? courseConfig?.cohorts?.[0]?.id ?? null

  const { data, isPending, isError, refetch } = useStudentAttendanceForms(
    courseId,
    cohortId,
  )
  // 제출자 이름·생년월일 join용 — 전체 학생 계정(출결폼은 이미 기수로 필터됨).
  const { data: students } = useStudentAccounts()
  const studentMap = useMemo(() => {
    const m = new Map<string, { name: string; birth: string }>()
    for (const s of students?.items ?? []) {
      m.set(s.id, { name: s.name, birth: s.birthDate })
    }
    return m
  }, [students])

  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [pickedDate, setPickedDate] = useState<string>(today())
  const [q, setQ] = useState('')

  const filtered: FormRowView[] = useMemo(() => {
    const rows = data?.rows ?? []
    const needle = q.trim().toLowerCase()
    const targetDate =
      dateFilter === 'today'
        ? today()
        : dateFilter === 'pick'
          ? pickedDate
          : null
    return rows
      .filter((r) => {
        if (targetDate && r.targetDate !== targetDate) return false
        return true
      })
      .map((r) => {
        const info = studentMap.get(r.submitter)
        return {
          ...r,
          name: info?.name ?? '(미배정)',
          birth: info?.birth ?? '-',
        }
      })
      .filter((r) => {
        if (!needle) return true
        const hay = `${r.name} ${r.birth} ${r.reason}`.toLowerCase()
        return hay.includes(needle)
      })
  }, [data, dateFilter, pickedDate, q, studentMap])

  const columns: Column<FormRowView>[] = [
    {
      key: 'name',
      header: '이름',
      className: 'w-28',
      cell: (r) => <span className="text-fg font-medium">{r.name}</span>,
    },
    {
      key: 'birth',
      header: '생년월일',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg-muted tabular-nums">{r.birth}</span>
      ),
    },
    {
      key: 'date',
      header: '대상 일자',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg-muted tabular-nums">{r.targetDate}</span>
      ),
    },
    {
      key: 'type',
      header: '유형',
      className: 'w-20',
      cell: (r) => (
        <StatusBadge
          label={TYPE_META[r.type].label}
          tone={TYPE_META[r.type].tone}
        />
      ),
    },
    {
      key: 'leave',
      header: '공가',
      className: 'w-16',
      cell: (r) => (
        <span className="text-fg-muted text-xs">
          {r.officialLeaveUsed ? '사용' : '미사용'}
        </span>
      ),
    },
    {
      key: 'reason',
      header: '신청 사유',
      cell: (r) => <span className="text-fg text-sm">{r.reason}</span>,
    },
    {
      key: 'submittedAt',
      header: '제출 시각',
      className: 'w-32',
      cell: (r) => (
        <span className="text-fg-subtle text-xs tabular-nums">
          {formatDateTime(r.submittedAt)}
        </span>
      ),
    },
  ]

  const dateFilters: { key: DateFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'today', label: '오늘' },
    { key: 'pick', label: '날짜 선택' },
  ]

  // 과정/기수 선택 컨트롤 — 항상 표시.
  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="과정 선택"
        value={courseId ?? ''}
        onChange={(e) => {
          setSelectedCourseId(e.target.value)
          setSelectedCohortId(null)
        }}
        className="border-border focus:border-brand text-fg h-11 rounded-lg border bg-white px-3 text-sm outline-none"
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
        onChange={(e) => setSelectedCohortId(e.target.value)}
        className="border-border focus:border-brand text-fg h-11 rounded-lg border bg-white px-3 text-sm outline-none"
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
      <div className="mb-4">{controls}</div>

      {isPending ? (
        <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
      ) : isError || !data ? (
        <Empty
          icon={<AlertTriangle className="h-6 w-6" />}
          title="출결 폼을 불러오지 못했어요"
          description="실 BE(learning-service) 연결을 확인한 뒤 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard label="전체 제출" value={data.summary.totalSubmitted} />
            <KpiCard label="지각" value={data.summary.late} tone="warning" />
            <KpiCard
              label="조퇴·외출"
              value={data.summary.earlyLeaveOuting}
              tone="info"
            />
            <KpiCard label="결석" value={data.summary.absent} tone="danger" />
            <KpiCard
              label="공가 사용"
              value={data.summary.officialLeaveUsed}
              tone="success"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1">
              {dateFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setDateFilter(f.key)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium',
                    dateFilter === f.key
                      ? 'bg-accent-bg text-accent-strong'
                      : 'text-fg-muted hover:bg-surface-muted',
                  )}
                >
                  {f.label}
                </button>
              ))}
              {dateFilter === 'pick' && (
                <div className="ml-1 w-40">
                  <DateTimePicker
                    mode="date"
                    value={pickedDate}
                    onChange={(v) => v && setPickedDate(v)}
                    ariaLabel="조회 일자 선택"
                    max={today()}
                  />
                </div>
              )}
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="이름·생년월일·사유 검색"
              aria-label="출결 폼 검색"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-9 w-56 rounded-lg border bg-white px-3 text-sm outline-none"
            />
          </div>

          <div className="mt-3">
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              empty="제출된 출결 폼이 없어요"
            />
            <div className="text-fg-subtle mt-3 text-xs">
              총 {filtered.length}건 · 전체 제출 {data.summary.totalSubmitted}
            </div>
          </div>
        </>
      )}
    </>
  )
}
