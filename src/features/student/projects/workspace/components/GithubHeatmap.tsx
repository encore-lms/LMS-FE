import { cn } from '@/shared/lib/cn'
import type { ProjectGithubDailyActivity } from '../../githubTypes'

// 잔디 색 농도 — 커밋 수 임계(GitHub 스타일 5단계). 0은 빈 셀.
function levelClass(count: number): string {
  if (count <= 0) return 'bg-surface-muted'
  if (count <= 2) return 'bg-brand/30'
  if (count <= 5) return 'bg-brand/50'
  if (count <= 9) return 'bg-brand/70'
  return 'bg-brand'
}

const WEEKS = 26 // 최근 약 6개월(화면 폭 고려)
const DAY_MS = 86400000

function toKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`
}

/**
 * GitHub 잔디 — 레포 일별 커밋 히트맵(요일×주 그리드).
 * 마지막 활동일이 속한 주까지 최근 26주를 그린다(활동 없으면 렌더 안 함).
 */
export function GithubHeatmap({
  daily,
}: {
  daily: ProjectGithubDailyActivity[]
}) {
  if (daily.length === 0) return null

  const counts = new Map(daily.map((d) => [d.date, d.commits]))
  // 끝 기준일 = 마지막 활동일(부트캠프 프로젝트는 오늘보다 과거일 수 있음).
  const last = daily.reduce((a, b) => (a.date > b.date ? a : b))
  const [ly, lm, ld] = last.date.split('-').map(Number)
  const end = new Date(Date.UTC(ly, lm - 1, ld))
  // 끝주 토요일까지 채운 뒤 26주 전 일요일부터 시작.
  const endSat = new Date(end.getTime() + (6 - end.getUTCDay()) * DAY_MS)
  const startSun = new Date(endSat.getTime() - (WEEKS * 7 - 1) * DAY_MS)

  const columns: { key: string; count: number; inRange: boolean }[][] = []
  for (let w = 0; w < WEEKS; w++) {
    const col: { key: string; count: number; inRange: boolean }[] = []
    for (let dow = 0; dow < 7; dow++) {
      const cell = new Date(startSun.getTime() + (w * 7 + dow) * DAY_MS)
      const key = toKey(cell)
      col.push({ key, count: counts.get(key) ?? 0, inRange: cell <= endSat })
    }
    columns.push(col)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {columns.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {col.map((cell) =>
              cell.inRange ? (
                <span
                  key={cell.key}
                  title={`${cell.key} · 커밋 ${cell.count}`}
                  className={cn(
                    'size-[11px] rounded-[2px]',
                    levelClass(cell.count),
                  )}
                />
              ) : (
                <span key={cell.key} className="size-[11px]" />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="text-fg-subtle flex items-center gap-1.5 text-[10px]">
        <span>적음</span>
        <span className="bg-surface-muted size-[10px] rounded-[2px]" />
        <span className="bg-brand/30 size-[10px] rounded-[2px]" />
        <span className="bg-brand/50 size-[10px] rounded-[2px]" />
        <span className="bg-brand/70 size-[10px] rounded-[2px]" />
        <span className="bg-brand size-[10px] rounded-[2px]" />
        <span>많음</span>
      </div>
    </div>
  )
}
