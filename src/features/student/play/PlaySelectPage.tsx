import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { usePageHeader } from '@/shared/store'
import { usePlayOverview } from '../api/play'

// PLAY 게임 선택 (/student/play) — Figma 418:2172.
const card =
  'bg-surface rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

// 게임 key → 입장 라우트. 미정의 key는 게임 선택에 머문다(준비 중 가드).
const GAME_ROUTE: Record<string, string> = {
  typing: '/student/play/typing',
  'coding-speed': '/student/play/coding',
  'cs-quiz': '/student/play/quiz',
}

export default function PlaySelectPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = usePlayOverview()
  usePageHeader('PLAY', '참여한 게임을 선택하고 최근 기록과 랭킹을 확인합니다.')

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      loadingText="PLAY를 불러오는 중…"
      errorTitle="PLAY를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="flex flex-col gap-5 p-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.stats.map((s) => (
              <div key={s.label} className={cn(card, 'flex flex-col gap-2')}>
                <span className="text-fg-muted text-[12px]">{s.label}</span>
                <span className="text-brand text-[24px] leading-none font-bold">
                  {s.value}
                </span>
                <span className="text-fg-subtle text-[11px]">{s.sub}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 pt-1">
            <h2 className="text-fg text-[16px] font-bold">게임 선택</h2>
            <span className="text-fg-subtle text-[12px]">
              과정에서 활성화된 PLAY 게임을 선택할 수 있습니다.
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {data.games.map((g) => {
              const on = g.status === 'available'
              return (
                <section
                  key={g.key}
                  className={cn(card, 'flex flex-col gap-3')}
                >
                  <span
                    className={cn(
                      'w-fit rounded-full px-2.5 py-1 text-[11px] font-bold',
                      on
                        ? 'bg-brand/10 text-brand'
                        : 'bg-surface-muted text-fg-subtle',
                    )}
                  >
                    {on ? '사용 가능' : '준비 중'}
                  </span>
                  <span className="text-fg text-[16px] font-bold">
                    {g.name}
                  </span>
                  <span className="text-fg-muted min-h-[40px] text-[12px] leading-5">
                    {g.desc}
                  </span>
                  {on && g.progress && (
                    <div className="flex flex-col gap-1.5">
                      <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-brand h-full rounded-full"
                          style={{ width: `${g.progressPct ?? 60}%` }}
                        />
                      </div>
                      <span className="text-fg-subtle text-[11px]">
                        {g.progress}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-end pt-1">
                    {on ? (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(GAME_ROUTE[g.key] ?? '/student/play')
                        }
                        className={buttonClass({ size: 'md' })}
                      >
                        게임 입장
                      </button>
                    ) : (
                      <span className="bg-surface-muted text-fg-subtle cursor-not-allowed rounded-lg px-4 py-2.5 text-[13px] font-semibold">
                        준비 중
                      </span>
                    )}
                  </div>
                </section>
              )
            })}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <section className={cn(card, 'flex flex-1 flex-col gap-3')}>
              <span className="text-fg text-[15px] font-bold">
                최근 게임 기록
              </span>
              {data.records.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 py-2.5',
                    i > 0 && 'border-divider border-t',
                  )}
                >
                  <span className="text-fg-subtle w-20 shrink-0 text-[11px]">
                    {r.when}
                  </span>
                  <span className="text-fg w-20 shrink-0 text-[12px] font-semibold">
                    {r.game}
                  </span>
                  <span className="text-fg-muted flex-1 text-[12px]">
                    {r.detail}
                  </span>
                  <span className="text-brand text-[13px] font-bold">
                    {r.score}
                  </span>
                </div>
              ))}
            </section>
            <section className={cn(card, 'flex flex-col gap-3 lg:w-[320px]')}>
              <span className="text-fg text-[15px] font-bold">
                기수 랭킹 Top 5
              </span>
              {data.ranking.map((r) => (
                <div key={r.rank} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'w-5 text-[13px] font-bold',
                      r.me ? 'text-brand' : 'text-fg-subtle',
                    )}
                  >
                    {r.rank}
                  </span>
                  <span
                    className={cn(
                      'flex-1 text-[13px]',
                      r.me ? 'text-brand font-bold' : 'text-fg font-medium',
                    )}
                  >
                    {r.name}
                  </span>
                  <span
                    className={cn(
                      'text-[13px] font-bold',
                      r.me ? 'text-brand' : 'text-fg',
                    )}
                  >
                    {r.score}
                  </span>
                </div>
              ))}
            </section>
          </div>
        </div>
      )}
    </DataBoundary>
  )
}
