import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { usePeerReputation } from '../api/peer'
import { RECOMMEND_OPTIONS, type Tone } from './types'

// PeerReputation 5축 평가 (/student/peer-reputation) — Figma 404:1719.
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const AVA: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
// 축별 색 (Figma: 기술/책임감 green, 소통 blue, 성장 purple, 팀워크 orange)
const AXIS_TONE: Tone[] = ['success', 'success', 'info', 'accent', 'warning']

export default function PeerReputationPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = usePeerReputation()
  const [scores, setScores] = useState<number[]>([])
  const [recommend, setRecommend] = useState('')
  const [comment, setComment] = useState('')
  usePageHeader(
    'PeerReputation 5축 평가',
    '평가할 동료의 기술·책임감·소통·성장·팀워크를 평가하고 추천도를 남깁니다.',
  )

  if (isPending) return <div className="text-fg-muted p-8">불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const t = data.target
  // 초기 점수/추천/코멘트는 mock 프리필 (useState 기본값 비어 있으면 target 값 사용)
  const axisScores = scores.length ? scores : t.axes.map((a) => a.score)
  const rec = recommend || t.recommend
  const cmt = comment || t.comment
  const avg = (
    axisScores.reduce((s, n) => s + n, 0) / axisScores.length
  ).toFixed(1)
  const setAxis = (i: number, v: number) =>
    setScores(axisScores.map((s, j) => (j === i ? v : s)))

  return (
    <div className="flex flex-col gap-5 p-8 pb-28">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-fg text-[15px] font-bold">평가할 동료</span>
          <span className="bg-brand/10 text-brand rounded-full px-2.5 py-1 text-[11px] font-bold">
            진행률 {data.progress.done}/{data.progress.total}명
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold">
            ← 이전
          </span>
          <span className="bg-brand-deep rounded-lg px-3 py-1.5 text-[12px] font-bold text-white">
            다음 동료 →
          </span>
        </div>
      </div>

      {/* 평가 대상 */}
      <section
        className={cn(card, 'border-accent/30 flex items-center gap-3 border')}
      >
        <span
          className={cn(
            'flex size-11 items-center justify-center rounded-full text-[16px] font-bold text-white',
            AVA[t.avatarTone],
          )}
        >
          {t.name.slice(0, 1)}
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-fg text-[15px] font-bold">
            {t.name} 님 평가 작성
          </span>
          <span className="text-fg-subtle text-[11px]">
            {t.role} · {t.meta}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {t.badges.map((b, i) => (
              <span
                key={i}
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-bold',
                  CHIP[b.tone],
                )}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 5축 점수 */}
      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex flex-col">
          <span className="text-fg text-[15px] font-bold">5축 점수 입력</span>
          <span className="text-fg-subtle text-[11px]">
            각 축 0~5점 · 가중 평균으로 동료의 360° 비교에 반영
          </span>
        </div>
        {t.axes.map((a, i) => (
          <div key={a.key} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className={cn('size-2 rounded-full', AVA[AXIS_TONE[i]])} />
              <span className="text-fg text-[13px] font-bold">{a.key}</span>
              <span className="text-fg-subtle text-[11px]">{a.desc}</span>
              <span className="text-fg ml-auto text-[13px] font-bold">
                {axisScores[i]}{' '}
                <span className="text-fg-subtle text-[11px] font-normal">
                  / 5
                </span>
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAxis(i, n)}
                  className={cn(
                    'flex h-7 flex-1 items-center justify-center rounded-md text-[12px] text-white transition-colors',
                    n <= axisScores[i]
                      ? AVA[AXIS_TONE[i]]
                      : 'bg-surface-muted text-fg-subtle',
                  )}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-col gap-2.5 lg:w-[320px]')}>
          <span className="text-fg text-[14px] font-bold">추천도</span>
          <span className="text-fg-subtle text-[11px]">
            이 동료와 다시 협업하고 싶은 정도
          </span>
          <div className="flex flex-wrap gap-2">
            {RECOMMEND_OPTIONS.map((o) => {
              const on = o === rec
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => setRecommend(o)}
                  className={cn(
                    'rounded-lg border px-3.5 py-2 text-[12px] font-semibold',
                    on
                      ? 'border-brand bg-brand text-white'
                      : 'border-border text-fg-muted hover:border-brand/50',
                  )}
                >
                  {o}
                </button>
              )
            })}
          </div>
        </section>
        <section className={cn(card, 'flex flex-1 flex-col gap-2.5')}>
          <div className="flex items-center gap-2">
            <span className="text-fg text-[14px] font-bold">자유 코멘트</span>
            <span className="text-fg-subtle text-[11px]">(선택)</span>
          </div>
          <span className="text-fg-subtle text-[11px]">
            동료에게 강점·성장 갈만한 점을 적어주세요 (최대 200자)
          </span>
          <textarea
            value={cmt}
            onChange={(e) => setComment(e.target.value.slice(0, 200))}
            className="border-border bg-surface text-fg focus:border-brand min-h-[80px] w-full resize-none rounded-[10px] border px-4 py-3 text-[13px] leading-6 focus:outline-none"
          />
        </section>
      </div>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[14px] font-bold">
          기수 동료 평가 진행{' '}
          <span className="text-fg-subtle text-[12px] font-normal">
            {data.progress.total}명
          </span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {data.roster.map((r, i) => (
            <span
              key={i}
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-[12px] font-bold',
                r.done
                  ? cn(AVA[r.tone], 'text-white')
                  : 'bg-surface-muted text-fg-subtle',
              )}
            >
              {r.initial}
            </span>
          ))}
        </div>
      </section>

      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <div className="flex flex-col">
          <span className="text-[13px] font-bold">
            {t.name} 님 5축 평균 {avg} · 추천도 {rec}
          </span>
          <span className="text-[11px] text-white/70">
            저장 후에도 수료 직전까지 수정 가능 · 익명 처리됨
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/student/peer-evaluations')}
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/peer-evaluations')}
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold"
          >
            평가 저장 후 다음 동료 →
          </button>
        </div>
      </div>
    </div>
  )
}
