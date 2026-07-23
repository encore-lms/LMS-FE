import { AlertTriangle } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonListPage, SkeletonText } from '@/components/ui/Skeleton'
import { cn } from '@/shared/lib/cn'
import type {
  CohortStudentRow,
  HrdAttendanceStatus,
  StudentAttendanceRow,
} from '@/shared/types'
import { CERT_STATUS_META } from '../cohorts/meta'
import {
  useInstructorAttendance,
  useInstructorAttendanceSummary,
  useInstructorCohortStudents,
} from './api'

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

// ── 수강생 명단 ──
function RosterSection({ cohortId }: { cohortId: string }) {
  const { data, isPending, isError, refetch } =
    useInstructorCohortStudents(cohortId)
  const columns: Column<CohortStudentRow>[] = [
    {
      key: 'student',
      header: '수강생',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">{r.name}</p>
          <p className="text-fg-subtle text-xs">{r.emailUuid}</p>
        </div>
      ),
    },
    {
      key: 'cert',
      header: '증명서',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={CERT_STATUS_META[r.certStatus].label}
          tone={CERT_STATUS_META[r.certStatus].tone}
        />
      ),
    },
    {
      key: 'risk',
      header: '위험',
      className: 'w-24',
      cell: (r) =>
        r.riskFlags.length > 0 ? (
          <span className="bg-danger-bg text-danger rounded px-1.5 py-px text-[11px] font-bold">
            {r.riskFlags.length}건
          </span>
        ) : (
          <span className="text-fg-subtle text-xs">-</span>
        ),
    },
  ]
  return (
    <section>
      <SectionTitle
        title="수강생 명단"
        hint={data ? `${data.total}명` : undefined}
      />
      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        skeleton={<SkeletonListPage columns={3} className="" />}
        errorTitle="명단을 불러오지 못했어요"
      >
        {data && (
          <DataTable
            columns={columns}
            rows={data.rows}
            rowKey={(r) => r.id}
            empty="배정된 수강생이 없어요"
          />
        )}
      </DataBoundary>
    </section>
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

function AttendanceSummarySection({ cohortId }: { cohortId: string }) {
  const { data, isPending, isError, refetch } =
    useInstructorAttendanceSummary(cohortId)
  return (
    <section>
      <SectionTitle title="출석 현황" hint="HRD-Net 라이브" />
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

            {/* 오늘 결석자 */}
            <div className="bg-surface-muted rounded-xl p-4">
              <p className="text-fg-muted mb-2 text-xs font-semibold">
                오늘 결석{' '}
                {data.todayTotal != null && data.todayPresent != null
                  ? `(출석 ${data.todayPresent}/${data.todayTotal})`
                  : ''}
              </p>
              {data.todayAbsentees.length === 0 ? (
                <p className="text-fg-subtle text-sm">결석자 없음</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.todayAbsentees.map((a) => (
                    <span
                      key={a.studentUuid}
                      className="bg-danger-bg text-danger rounded-md px-2 py-1 text-xs font-medium"
                      title={a.detail}
                    >
                      {a.name}
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

// ── 오늘 출석(일별) ──
function TodayAttendanceSection({ cohortId }: { cohortId: string }) {
  const { data, isPending, isError, refetch } =
    useInstructorAttendance(cohortId)
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
      <SectionTitle
        title="오늘 출석"
        hint={data ? data.date : undefined}
      />
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
              empty="오늘 출결 기록이 없어요"
            />
          </div>
        )}
      </DataBoundary>
    </section>
  )
}

// 수강생 탭 — 명단 + 출석 현황 + 오늘 출석(모두 조회 전용).
export function StudentsPane({ cohortId }: { cohortId: string }) {
  return (
    <div className="flex flex-col gap-8">
      <RosterSection cohortId={cohortId} />
      <AttendanceSummarySection cohortId={cohortId} />
      <TodayAttendanceSection cohortId={cohortId} />
    </div>
  )
}
