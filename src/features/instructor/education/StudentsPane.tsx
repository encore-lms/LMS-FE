import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { SkeletonListPage, SkeletonText } from '@/components/ui/Skeleton'
import { cn } from '@/shared/lib/cn'
import type { HrdAttendanceStatus, StudentAttendanceRow } from '@/shared/types'
import { useInstructorAttendance, useInstructorAttendanceSummary } from './api'

const HRD_META: Record<HrdAttendanceStatus, { label: string; cls: string }> = {
  normal: { label: '정상', cls: 'text-success' },
  late: { label: '지각', cls: 'text-warning' },
  absent: { label: '결석', cls: 'text-danger' },
  early_leave: { label: '조퇴·외출', cls: 'text-info' },
  leave_missing: { label: '퇴실 누락', cls: 'text-accent-strong' },
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <h3 className="text-fg text-base font-bold">{title}</h3>
      {hint && <span className="text-fg-subtle text-xs">{hint}</span>}
    </div>
  )
}

// ── 출석 현황(요약) ──
function StatCard({
  label,
  value,
  unit,
}: {
  label: string
  value: string | number
  unit?: string
}) {
  return (
    <div className="bg-surface-muted rounded-xl px-4 py-3">
      <p className="text-fg-muted text-xs font-medium">{label}</p>
      <p className="text-fg mt-1 text-2xl font-bold">
        {value}
        {unit && (
          <span className="text-fg-subtle ml-1 text-sm font-medium">
            {unit}
          </span>
        )}
      </p>
    </div>
  )
}

function AttendanceSummarySection({
  cohortId,
  date,
}: {
  cohortId: string
  /** 아래 '출석' 표와 같은 선택 일자 — 결석 박스·제목이 이 날짜를 따른다('' = 오늘). */
  date: string
}) {
  const { data, isPending, isError, refetch } =
    useInstructorAttendanceSummary(cohortId)
  // 선택 일자 출결 — 아래 표와 같은 쿼리 키라 추가 호출 없이 캐시를 공유한다.
  const { data: daily } = useInstructorAttendance(cohortId, date || undefined)
  const dateLabel = (date || daily?.date || '').replaceAll('-', '.')
  const absentees = (daily?.rows ?? []).filter((r) => r.hrdStatus === 'absent')
  const dailyTotal = daily?.rows.length ?? 0
  return (
    <section>
      <SectionTitle
        title={dateLabel ? `${dateLabel} 출석 현황` : '출석 현황'}
        hint="HRD-Net 라이브"
      />
      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        skeleton={<SkeletonText lines={4} />}
        errorTitle="출석 현황을 불러오지 못했어요"
        errorDescription="HRD 훈련과정ID가 없는 기수이거나 HRD-Net 연결을 확인해 주세요."
      >
        {data && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="재적" value={data.students.total} unit="명" />
              <StatCard label="활동" value={data.students.active} unit="명" />
              <StatCard
                label="중도탈락"
                value={data.students.dropout}
                unit="명"
              />
              <StatCard
                label="평균 출석률"
                value={data.avgRate == null ? '-' : data.avgRate}
                unit={data.avgRate == null ? undefined : '%'}
              />
            </div>

            {/* 선택 일자 결석자 — 요약 API는 오늘 고정이라, 날짜 선택을 따르도록 일별 출결로 계산한다. */}
            <div className="bg-surface-muted rounded-xl p-4">
              <p className="text-fg-muted mb-2 text-xs font-semibold">
                {dateLabel ? `${dateLabel} 결석` : '결석'}{' '}
                {dailyTotal > 0
                  ? `(출석 ${dailyTotal - absentees.length}/${dailyTotal})`
                  : ''}
              </p>
              {dailyTotal === 0 ? (
                <p className="text-fg-subtle text-sm">
                  해당 일자 출결 기록이 없어요
                </p>
              ) : absentees.length === 0 ? (
                <p className="text-fg-subtle text-sm">결석자 없음</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {absentees.map((a) => (
                    <span
                      key={a.id}
                      className="bg-danger-bg text-danger rounded-md px-2 py-1 text-xs font-medium"
                    >
                      {a.studentName}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 관리 필요(이슈) 수강생 */}
            {data.issues.length > 0 && (
              <div className="bg-surface-muted rounded-xl p-4">
                <p className="text-fg-muted mb-2 flex items-center gap-1.5 text-xs font-semibold">
                  <AlertTriangle className="text-warning h-3.5 w-3.5" />
                  관리 필요 (최근 지각·결석 반복)
                </p>
                <ul className="flex flex-col gap-1.5">
                  {data.issues.map((s) => (
                    <li
                      key={s.studentUuid}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-fg font-medium">{s.name}</span>
                      <span className="text-fg-muted text-xs">
                        지각 {s.lateCount} · 결석 {s.absentCount}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DataBoundary>
    </section>
  )
}

// ── 출석(일별, 날짜 선택 가능) — 날짜 상태는 부모 소유(출석 현황 요약과 공유). ──
function TodayAttendanceSection({
  cohortId,
  date,
  onDateChange,
}: {
  cohortId: string
  date: string
  onDateChange: (date: string) => void
}) {
  const { data, isPending, isError, refetch } = useInstructorAttendance(
    cohortId,
    date || undefined,
  )
  const columns: Column<StudentAttendanceRow>[] = [
    {
      key: 'student',
      header: '수강생',
      cell: (r) => (
        <span className="text-fg text-sm font-medium">{r.studentName}</span>
      ),
    },
    {
      key: 'checkIn',
      header: '등원',
      className: 'w-24',
      cell: (r) => (
        <span className="text-fg-muted text-sm tabular-nums">
          {r.checkIn ?? '-'}
        </span>
      ),
    },
    {
      key: 'checkOut',
      header: '하원',
      className: 'w-24',
      cell: (r) => (
        <span className="text-fg-muted text-sm tabular-nums">
          {r.checkOut ?? '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-28',
      cell: (r) => (
        <span
          className={cn(
            'text-sm font-semibold',
            HRD_META[r.hrdStatus]?.cls ?? 'text-fg',
          )}
        >
          {r.hrdStatusLabel || HRD_META[r.hrdStatus]?.label || r.hrdStatus}
        </span>
      ),
    },
  ]
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-fg text-base font-bold">출석</h3>
        {/* 날짜 선택 — 미선택(오늘) 시 응답 일자로 표시. */}
        <input
          type="date"
          aria-label="출석 조회 일자"
          value={date || data?.date || ''}
          onChange={(e) => onDateChange(e.target.value)}
          className="border-border focus:border-brand text-fg h-9 rounded-lg border bg-white px-3 text-sm outline-none"
        />
      </div>
      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        skeleton={<SkeletonListPage columns={4} className="" />}
        errorTitle="오늘 출석을 불러오지 못했어요"
        errorDescription="HRD 훈련과정ID가 없는 기수이거나 HRD-Net 연결을 확인해 주세요."
      >
        {data && (
          <div>
            <div className="mb-3 flex flex-wrap gap-4 text-sm">
              <span className="text-success font-semibold">
                출석 {data.summary.present}
              </span>
              <span className="text-warning font-semibold">
                지각 {data.summary.late}
              </span>
              <span className="text-info font-semibold">
                조퇴·외출 {data.summary.earlyLeaveOuting}
              </span>
              <span className="text-danger font-semibold">
                결석 {data.summary.absent}
              </span>
            </div>
            <DataTable
              columns={columns}
              rows={data.rows}
              rowKey={(r) => r.id}
              empty="해당 일자 출결 기록이 없어요"
            />
          </div>
        )}
      </DataBoundary>
    </section>
  )
}

// 수강생 탭 — 출석 현황 + 출석(일별, 날짜 선택). 모두 조회 전용.
// 날짜는 두 섹션이 공유 — 아래 표에서 날짜를 고르면 위 출석 현황(제목·결석)도 그 날짜를 따른다.
export function StudentsPane({ cohortId }: { cohortId: string }) {
  const [date, setDate] = useState('')
  return (
    <div className="flex flex-col gap-8">
      <AttendanceSummarySection cohortId={cohortId} date={date} />
      <TodayAttendanceSection
        cohortId={cohortId}
        date={date}
        onDateChange={setDate}
      />
    </div>
  )
}
