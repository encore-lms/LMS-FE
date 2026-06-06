import { cn } from '@/shared/lib/cn'
import type { CertGrowthTab } from '../types'
import { TabHead, AiBanner } from './TechTab'

// 증명서 탭5 성장·평판 — 성장 곡선·Peer Reputation·ShortComment·강사/멘토 추천서.
const card =
  'border-border bg-surface rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

export function GrowthTab({ g }: { g: CertGrowthTab }) {
  const max = Math.max(...g.timeline, 100)
  const delta = g.currentScore - g.startScore
  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={5}
        title="성장·평판"
        sub="성장 곡선·동료 평판·ShortComment·강사 추천서 · 공개/비공개 토글"
      >
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 최근 8주 +{delta > 17 ? 17 : delta}점
        </span>
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 동료 5축 평균 4.6
        </span>
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 추천서 {g.recommendations.length}건
        </span>
      </TabHead>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">
          성장 곡선 (Growth Timeline)
        </span>
        <span className="text-fg-subtle text-[11px]">
          주차별 종합 점수 · 최근 {g.timeline.length}주
        </span>
        <div className="flex h-[180px] items-end gap-1.5 pt-2">
          {g.timeline.map((v, i) => (
            <div
              key={i}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <span className="text-fg-subtle text-[9px]">{v}</span>
              <div
                className="from-brand to-accent-strong w-full shrink-0 rounded-t bg-gradient-to-t"
                style={{ height: `${(v / max) * 100}%` }}
              />
              <span className="text-fg-subtle text-[8px]">W{i + 1}</span>
            </div>
          ))}
        </div>
        <span className="text-fg-muted text-[12px]">
          출발점 {g.startScore}점 → 현재 {g.currentScore}점{' '}
          <span className="bg-success-bg text-success rounded px-1.5 py-0.5 text-[11px] font-bold">
            ▲ +{delta}점 / {g.timeline.length}주
          </span>
        </span>
      </section>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-3.5')}>
          <span className="text-fg text-[15px] font-bold">
            Peer Reputation · 동료 5축 평가
          </span>
          {g.reputation.map((r) => (
            <div key={r.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-fg font-medium">{r.key}</span>
                <span className="text-fg font-bold">
                  {r.score.toFixed(1)}{' '}
                  <span className="text-fg-subtle text-[11px]">/ 5.0</span>
                </span>
              </div>
              <span className="text-fg-subtle text-[11px]">{r.detail}</span>
              <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-brand h-full rounded-full"
                  style={{ width: `${(r.score / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </section>

        <section className={cn(card, 'flex flex-1 flex-col gap-3')}>
          <span className="text-fg text-[15px] font-bold">
            ShortComment · 공개 후보
          </span>
          <span className="text-fg-subtle text-[11px]">
            최대 5개 공개 가능 · 기본 OFF · 동료 평가에서 수집
          </span>
          {g.shortComments.map((c, i) => (
            <div
              key={i}
              className="bg-surface-muted flex flex-col gap-1.5 rounded-[10px] p-3.5"
            >
              <span className="text-fg text-[13px] leading-5">{c.quote}</span>
              <span className="text-fg-subtle flex items-center gap-2 text-[11px]">
                {c.by}
                <span className="bg-info-bg text-info rounded px-1.5 py-0.5 text-[10px] font-bold">
                  {c.tag}
                </span>
              </span>
            </div>
          ))}
        </section>
      </div>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">강사·멘토 추천서</span>
        <span className="text-fg-subtle text-[11px]">
          개별 공개 토글 없음 · 인증 완료 + 화산화 이후 공개 스냅샷에 포함
        </span>
        {g.recommendations.map((r, i) => (
          <div
            key={i}
            className="border-border flex flex-col gap-2 rounded-[10px] border p-4"
          >
            <div className="flex items-center gap-2">
              <span className="bg-accent-bg text-accent-strong rounded px-1.5 py-0.5 text-[10px] font-bold">
                {r.role}
              </span>
              <span className="text-fg text-[13px] font-bold">{r.name}</span>
              <span className="text-fg-subtle text-[11px]">{r.meta}</span>
            </div>
            <span className="text-fg-muted text-[12px] leading-5">
              {r.quote}
            </span>
            <span className="text-fg-subtle text-[10px]">{r.date}</span>
          </div>
        ))}
      </section>

      <AiBanner text="MVP 단계에서는 승인·동료 평판·추천서·성장 곡선 데이터만 노출하며, AI 감성 분석은 confirmed 인증 + 운영자 승인 시 외부 공개 payload에 포함됩니다." />
    </div>
  )
}
