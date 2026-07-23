import { cn } from '@/shared/lib/cn'
import type { ProjectGithubDailyActivity } from '../../githubTypes'

// 잔디 색 농도 — 커밋 수 임계(GitHub 스타일 5단계). 0은 빈 셀.
function levelClass(count: number): string {
  if (count <= 0) return 'bg-surface-muted'
  if (count <= 2) return 'bg-brand/25'
  if (count <= 5) return 'bg-brand/50'
  if (count <= 9) return 'bg-brand/75'
  return 'bg-brand'
}

const WEEKS = 26 // 최근 약 6개월(화면 폭 고려)
const DAY_MS = 86400000
const MONTHS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
]
const DOW_LABEL = ['', '월', '', '수', '', '금', ''] // 일~토 중 월·수·금만

function toKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`
}

/**
 * GitHub 잔디 — 레포 일별 커밋 히트맵(요일×주 그리드 + 월·요일 라벨).
 * 마지막 활동일이 속한 주까지 최근 26주를 그린다(활동 없으면 렌더 안 함).
 */
export function GithubHeatmap({
  daily,
}: {
  daily: ProjectGithubDailyActivity[]
}) {
  if (daily.length === 0) return null

  const counts = new Map(daily.map((d) => [d.date, d.commits]))
  const last = daily.reduce((a, b) => (a.date > b.date ? a : b))
  const [ly, lm, ld] = last.date.split('-').map(Number)
  const end = new Date(Date.UTC(ly, lm - 1, ld))
  const endSat = new Date(end.getTime() + (6 - end.getUTCDay()) * DAY_MS)
  const startSun = new Date(endSat.getTime() - (WEEKS * 7 - 1) * DAY_MS)

  const columns: {
    weekStart: Date
    cells: { key: string; count: number; inRange: boolean }[]
  }[] = []
  for (let w = 0; w < WEEKS; w++) {
    const weekStart = new Date(startSun.getTime() + w * 7 * DAY_MS)
    const cells: { key: string; count: number; inRange: boolean }[] = []
    for (let dow = 0; dow < 7; dow++) {
      const cell = new Date(weekStart.getTime() + dow * DAY_MS)
      const key = toKey(cell)
      cells.push({ key, count: counts.get(key) ?? 0, inRange: cell <= endSat })
    }
    columns.push({ weekStart, cells })
  }

  // 월 라벨 — 각 주 시작월이 이전 주와 다르면 그 열 위에 월 표시.
  const monthLabels = columns.map((col, i) => {
    const m = col.weekStart.getUTCMonth()
    const prev = i > 0 ? columns[i - 1].weekStart.getUTCMonth() : -1
    return m !== prev ? MONTHS[m] : ''
  })

  return (
    <div className="flex flex-col gap-2">
      {/* 월 라벨 행 (요일 라벨 폭만큼 들여쓰기) */}
      <div className="text-fg-subtle flex gap-[3px] pl-[22px] text-[9px] leading-none">
        {monthLabels.map((label, i) => (
          <span key={i} className="w-[13px] shrink-0">
            {label}
          </span>
        ))}
      </div>
      <div className="flex gap-[3px]">
        {/* 요일 라벨 */}
        <div className="text-fg-subtle mr-1 flex w-[16px] shrink-0 flex-col gap-[3px] text-[9px] leading-none">
          {DOW_LABEL.map((d, i) => (
            <span key={i} className="flex h-[13px] items-center">
              {d}
            </span>
          ))}
        </div>
        {/* 셀 그리드 */}
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {columns.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {col.cells.map((cell) =>
                cell.inRange ? (
                  <span
                    key={cell.key}
                    title={`${cell.key} · 커밋 ${cell.count}`}
                    className={cn(
                      'size-[13px] rounded-[3px] transition-transform hover:scale-125',
                      levelClass(cell.count),
                    )}
                  />
                ) : (
                  <span key={cell.key} className="size-[13px]" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="text-fg-subtle flex items-center gap-1.5 pl-[22px] text-[10px]">
        <span>적음</span>
        <span className="bg-surface-muted size-[11px] rounded-[3px]" />
        <span className="bg-brand/25 size-[11px] rounded-[3px]" />
        <span className="bg-brand/50 size-[11px] rounded-[3px]" />
        <span className="bg-brand/75 size-[11px] rounded-[3px]" />
        <span className="bg-brand size-[11px] rounded-[3px]" />
        <span>많음</span>
      </div>
    </div>
  )
}
