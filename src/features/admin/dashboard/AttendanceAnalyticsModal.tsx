import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { cn } from '@/shared/lib/cn'
import { Empty } from '@/components/ui/Empty'
import { Checkbox } from '@/components/ui/Checkbox'
import { useAttendanceAnalytics } from '../api/dashboard'
import type { AnalyticsStats } from './analyticsTypes'

Chart.register(
  ArcElement,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
)

const C = {
  normal: '#0ab080',
  late: '#f59f00',
  absent: '#f04545',
  excused: '#3b82f5',
  purple: '#5c4fd9',
  grid: 'rgba(18,23,38,0.06)',
  muted: '#9ca3b0',
}

type Tab = 'summary' | 'time' | 'people'
const TABS: { key: Tab; label: string }[] = [
  { key: 'summary', label: '요약' },
  { key: 'time', label: '시간' },
  { key: 'people', label: '사람' },
]

export function AttendanceAnalyticsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [includeDropouts, setIncludeDropouts] = useState(false)
  const [cohortSel, setCohortSel] = useState('all')
  const [tab, setTab] = useState<Tab>('summary')
  const { data, isPending, isError } = useAttendanceAnalytics(
    open,
    includeDropouts,
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const stats: AnalyticsStats | undefined =
    cohortSel === 'all'
      ? data?.aggregate
      : data?.perCohort.find((c) => c.cohortId === cohortSel)?.stats

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="출석률 분석"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface flex max-h-[90vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl shadow-2xl"
      >
        {/* 헤더 */}
        <div className="border-border flex items-center justify-between gap-3 border-b px-6 py-4">
          <div>
            <h2 className="text-fg text-[18px] font-bold">출석률 분석</h2>
            <p className="text-fg-subtle mt-0.5 text-[12px]">
              담당 기수 개강일부터 오늘까지의 출결 흐름
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-fg-subtle hover:bg-surface-muted hover:text-fg rounded-md p-1.5"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 기수 선택 + 옵션 */}
        {data && data.cohorts.length > 0 && (
          <div className="border-border flex flex-wrap items-center gap-2 border-b px-6 py-3">
            <Chip
              active={cohortSel === 'all'}
              onClick={() => setCohortSel('all')}
            >
              전체
            </Chip>
            {data.cohorts.map((c) => (
              <Chip
                key={c.cohortId}
                active={cohortSel === c.cohortId}
                onClick={() => setCohortSel(c.cohortId)}
              >
                {c.name}
              </Chip>
            ))}
            <div className="ml-auto">
              <Checkbox
                checked={includeDropouts}
                onChange={setIncludeDropouts}
                label={
                  <span className="text-fg-muted text-[12px]">
                    중도탈락 포함
                  </span>
                }
              />
            </div>
          </div>
        )}

        {/* 탭 */}
        <div className="border-border flex gap-1 border-b px-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                '-mb-px border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors',
                tab === t.key
                  ? 'border-brand text-brand'
                  : 'text-fg-muted hover:text-fg border-transparent',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-auto p-6">
          {isPending ? (
            <Centered>분석 데이터를 불러오는 중…</Centered>
          ) : isError ? (
            <Empty
              title="분석 데이터를 불러오지 못했어요"
              description="잠시 후 다시 시도해 주세요."
            />
          ) : !data?.hrdAvailable ? (
            <Empty
              title="HRD-Net 인증키가 등록되어 있지 않습니다"
              description="설정 > API 설정에서 키를 등록하면 출결 분석이 표시됩니다."
            />
          ) : !stats || stats.heatmap.students.length === 0 ? (
            <Empty title="표시할 출결 데이터가 없습니다" />
          ) : tab === 'summary' ? (
            <SummaryTab stats={stats} />
          ) : tab === 'time' ? (
            <TimeTab stats={stats} />
          ) : (
            <PeopleTab stats={stats} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ── 탭: 요약 (도넛 + 일별 라인) ── */
function SummaryTab({ stats }: { stats: AnalyticsStats }) {
  const s = stats.statusCounts
  const donut = {
    labels: ['정상', '지각', '결석', '인정결석'],
    datasets: [
      {
        data: [s.normal, s.late, s.absent, s.excused],
        backgroundColor: [C.normal, C.late, C.absent, C.excused],
        borderWidth: 0,
      },
    ],
  }
  const line = {
    labels: stats.dailyRates.map((d) => d.label),
    datasets: [
      {
        label: '출석률',
        data: stats.dailyRates.map((d) => d.rate),
        borderColor: C.purple,
        backgroundColor: 'rgba(92,79,217,0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  }
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <ChartBox title="상태 분포" height={260}>
        <Doughnut
          data={donut}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 12, font: { size: 11 } },
              },
            },
          }}
        />
      </ChartBox>
      <ChartBox title="일별 출석률" height={260}>
        <Line data={line} options={rateLineOptions} />
      </ChartBox>
    </div>
  )
}

/* ── 탭: 시간 (요일별 + 도착 히스토그램) ── */
function TimeTab({ stats }: { stats: AnalyticsStats }) {
  const weekday = {
    labels: stats.weekdayRates.map((w) => w.label),
    datasets: [
      {
        label: '평균 출석률',
        data: stats.weekdayRates.map((w) => w.rate),
        backgroundColor: C.purple,
        borderRadius: 6,
      },
    ],
  }
  const arrival = {
    labels: stats.arrivalBuckets.map((a) => a.label),
    datasets: [
      {
        label: '인원',
        data: stats.arrivalBuckets.map((a) => a.count),
        backgroundColor: stats.arrivalBuckets.map((a) =>
          a.late ? C.late : C.purple,
        ),
        borderRadius: 6,
      },
    ],
  }
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartBox title="요일별 평균 출석률" height={260}>
        <Bar data={weekday} options={rateBarOptions} />
      </ChartBox>
      <ChartBox title="입실 시간 분포" height={260}>
        <Bar
          data={arrival}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 10 } } },
              y: { beginAtZero: true, grid: { color: C.grid } },
            },
          }}
        />
      </ChartBox>
    </div>
  )
}

/* ── 탭: 사람 (하위 학생 바 + 히트맵) ── */
function PeopleTab({ stats }: { stats: AnalyticsStats }) {
  const bottom = useMemo(
    () => [...stats.studentStats].sort((a, b) => a.rate - b.rate).slice(0, 10),
    [stats.studentStats],
  )
  const barData = {
    labels: bottom.map((s) => s.name),
    datasets: [
      {
        label: '출석률',
        data: bottom.map((s) => s.rate),
        backgroundColor: bottom.map((s) =>
          s.rate < 70 ? C.absent : s.rate < 85 ? C.late : C.normal,
        ),
        borderRadius: 5,
      },
    ],
  }
  return (
    <div className="flex flex-col gap-6">
      <ChartBox
        title="출석률 하위 학생"
        height={Math.max(200, bottom.length * 26 + 40)}
      >
        <Bar
          data={barData}
          options={{
            indexAxis: 'y' as const,
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, max: 100, grid: { color: C.grid } },
              y: { grid: { display: false }, ticks: { font: { size: 11 } } },
            },
          }}
        />
      </ChartBox>
      <Heatmap stats={stats} />
    </div>
  )
}

const HEAT = ['#eef1f4', C.normal, C.late, C.absent, C.excused]
function Heatmap({ stats }: { stats: AnalyticsStats }) {
  const { students, days, points } = stats.heatmap
  const grid = useMemo(() => {
    const m = students.map(() => days.map(() => 0))
    for (const p of points) if (m[p.y]) m[p.y][p.x] = p.v
    return m
  }, [students, days, points])
  return (
    <div className="flex flex-col gap-2">
      <span className="text-fg text-[13px] font-bold">학생별 출결 히트맵</span>
      <div className="overflow-auto">
        <div
          className="flex flex-col gap-[2px]"
          style={{ minWidth: days.length * 14 }}
        >
          {students.map((name, y) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-fg-muted w-16 shrink-0 truncate text-right text-[11px]">
                {name}
              </span>
              <div className="flex gap-[2px]">
                {days.map((d, x) => (
                  <span
                    key={x}
                    title={`${name} · ${d.slice(4, 6)}.${d.slice(6, 8)}`}
                    className="size-3 rounded-[2px]"
                    style={{ background: HEAT[grid[y][x]] }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-fg-subtle flex flex-wrap items-center gap-3 pt-1 text-[11px]">
        {[
          ['정상', C.normal],
          ['지각', C.late],
          ['결석', C.absent],
          ['인정결석', C.excused],
        ].map(([label, color]) => (
          <span key={label} className="flex items-center gap-1">
            <span
              className="size-2.5 rounded-[2px]"
              style={{ background: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── 공통 ── */
const rateLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 }, maxRotation: 0 },
    },
    y: { min: 0, max: 100, grid: { color: C.grid } },
  },
} as const
const rateBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { min: 0, max: 100, grid: { color: C.grid } },
  },
} as const

function ChartBox({
  title,
  height,
  children,
}: {
  title: string
  height: number
  children: React.ReactNode
}) {
  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4">
      <span className="text-fg text-[13px] font-bold">{title}</span>
      <div style={{ height }}>{children}</div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
        active
          ? 'bg-brand text-on-color'
          : 'border-border text-fg-muted hover:bg-surface-muted border',
      )}
    >
      {children}
    </button>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-fg-muted flex h-60 items-center justify-center text-sm">
      {children}
    </div>
  )
}
