import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useCertChanges } from '../api/certificate'
import { useCertFlow } from './useCertFlow'
import type { Tone } from './types'

// 보완 요청 상세 (/student/certificate/changes-requested) — Figma 248:27.
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
const SOLID: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const card =
  'border-border bg-surface rounded-[14px] border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

// 보완 영역 라벨/액션 → 해당 기능 화면 라우트(라벨 키워드 기준)
function areaRoute(label: string): string {
  if (label.includes('프로필') || label.includes('개인정보'))
    return '/student/profile'
  if (label.includes('기록')) return '/student/records'
  if (label.includes('프로젝트')) return '/student/projects'
  if (label.includes('퀴즈')) return '/student/quizzes'
  return '/student/certificate' // 점수·역량 리포트 등은 증명서로
}

export default function ChangesRequestedPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const setStatus = useCertFlow((s) => s.setStatus)
  const { data, isPending, isError, refetch } = useCertChanges()
  // 재요청 체크리스트 — 로컬 토글(완료 시 재요청 활성). BE 연동 시 서버 상태로 대체.
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  usePageHeader(
    '보완 요청',
    '정식 인증 검토 후 보완 사항을 확인하고 재요청하세요',
  )
  if (isPending)
    return <div className="text-fg-muted p-8">보완 요청을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="보완 요청을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const isDone = (id: string, def: boolean) => checked[id] ?? def
  const doneCount = data.checklist.filter((c) => isDone(c.id, c.done)).length
  const allDone = doneCount === data.checklist.length
  const doneLabel = `${doneCount} / ${data.checklist.length}`

  const reRequest = () => {
    if (!allDone) return
    setStatus('under_review')
    toast.success('정식 인증을 재요청했어요 · 매니저 재검토 대기')
    navigate('/student/certificate')
  }

  return (
    <div className="flex flex-col gap-5 p-8 pb-24">
      {/* 요약 배너 */}
      <section className="border-border bg-surface flex items-center justify-between gap-4 rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
        <div className="flex items-center gap-4">
          <span className="bg-danger-bg text-danger flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl">
            ⚠
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-danger-bg text-danger rounded px-2 py-0.5 text-[11px] font-bold">
                보완 요청
              </span>
              <span className="text-fg-subtle text-[12px]">
                {data.roundLabel}
              </span>
            </div>
            <span className="text-fg text-[18px] font-bold">
              {data.summaryTitle}
            </span>
            <span className="text-fg-muted text-[12px]">{data.summarySub}</span>
          </div>
        </div>
        <div className="hidden shrink-0 flex-col gap-1.5 sm:flex">
          {[
            { l: '요청일', v: data.requestedAt },
            { l: '검토자', v: data.reviewer },
            { l: '회신 후', v: data.replyWithin },
          ].map((m) => (
            <div key={m.l} className="flex items-center gap-3 text-[12px]">
              <span className="text-fg-subtle w-12">{m.l}</span>
              <span className="text-fg font-semibold">{m.v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 보완 요청 사유 */}
      <div className="flex items-center gap-2">
        <h2 className="text-fg text-[15px] font-bold">보완 요청 사유</h2>
        <span className="bg-surface-muted text-fg-muted rounded px-2 py-0.5 text-[11px] font-bold">
          {data.reasons.length}건
        </span>
        <span className="text-fg-subtle text-[11px]">
          각 항목의 코멘트를 확인하고 관련 화면에서 수정 후 돌아오세요
        </span>
      </div>
      {data.reasons.map((r) => (
        <section key={r.id} className={cn(card, 'flex items-center gap-4')}>
          <span className="bg-brand-deep flex size-7 shrink-0 items-center justify-center rounded-md text-[13px] font-bold text-white">
            {r.no}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {r.tags.map((tg, i) => (
                <span
                  key={i}
                  className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-bold',
                    CHIP[tg.tone],
                  )}
                >
                  {tg.label}
                </span>
              ))}
            </div>
            <span className="text-fg text-[14px] font-bold">{r.title}</span>
            <span className="text-fg-muted text-[12px] leading-5">
              {r.detail}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate(areaRoute(r.actionLabel))}
            className="bg-brand shrink-0 rounded-lg px-4 py-2.5 text-[12px] font-bold text-white"
          >
            {r.actionLabel} →
          </button>
        </section>
      ))}

      {/* 관련 영역 바로가기 */}
      <div className="flex flex-col gap-1 pt-1">
        <h2 className="text-fg text-[15px] font-bold">관련 영역 바로가기</h2>
        <span className="text-fg-subtle text-[11px]">
          보완 사항이 있는 5개 영역으로 바로 이동할 수 있습니다
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {data.relatedAreas.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => navigate(areaRoute(a.label))}
            className="border-border bg-surface hover:border-brand/50 flex flex-col gap-2 rounded-[12px] border p-4 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-lg text-[12px] font-bold text-white',
                  SOLID[a.letterTone],
                )}
              >
                {a.letter}
              </span>
              <span
                className={cn(
                  'size-2 rounded-full',
                  a.done ? 'bg-success' : 'bg-danger',
                )}
              />
            </div>
            <span className="text-fg text-[13px] font-bold">{a.label}</span>
            <span className="text-fg-subtle text-[11px]">{a.status}</span>
            <span className="text-brand text-[11px] font-semibold">이동 →</span>
          </button>
        ))}
      </div>

      {/* 재요청 체크리스트 */}
      <section className={cn(card, 'flex flex-col gap-0 p-0')}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex flex-col">
            <span className="text-fg text-[15px] font-bold">
              정식 인증 재요청 체크리스트
            </span>
            <span className="text-fg-subtle text-[11px]">
              모든 항목이 완료되어야 재요청 버튼이 활성화됩니다 · 체크박스를
              눌러 완료 처리
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setChecked(
                  allDone
                    ? {}
                    : Object.fromEntries(
                        data.checklist.map((c) => [c.id, true]),
                      ),
                )
              }
              className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
            >
              {allDone ? '초기화' : '전체 완료(데모)'}
            </button>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-[12px] font-bold',
                allDone
                  ? 'bg-success-bg text-success'
                  : 'bg-danger-bg text-danger',
              )}
            >
              {doneLabel} 완료
            </span>
          </div>
        </div>
        {data.checklist.map((c, i) => {
          const done = isDone(c.id, c.done)
          return (
            <Fragment key={c.id}>
              {i > 0 && <div className="bg-divider h-px w-full" />}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => setChecked((p) => ({ ...p, [c.id]: !done }))}
                  aria-pressed={done}
                  aria-label={`${c.label} 완료 토글`}
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                    done
                      ? 'bg-success text-white'
                      : 'border-border text-fg-subtle hover:border-brand border',
                  )}
                >
                  {done ? '✓' : ''}
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-fg text-[13px] font-semibold">
                    {c.label}
                  </span>
                  <span className="text-fg-muted text-[11px]">{c.sub}</span>
                </div>
                {!done && (
                  <span className="bg-danger-bg text-danger shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold">
                    미완료
                  </span>
                )}
                {c.actionLabel && (
                  <button
                    type="button"
                    onClick={() => navigate(areaRoute(c.actionLabel as string))}
                    className="text-brand shrink-0 text-[12px] font-semibold"
                  >
                    {c.actionLabel} →
                  </button>
                )}
              </div>
            </Fragment>
          )
        })}
      </section>

      {/* 하단 액션바 */}
      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <div className="flex flex-col">
          <span className="text-[13px] font-bold">
            재요청 전 체크 {doneLabel} 완료 — 모든 보완 사유 처리 후 재요청 가능
          </span>
          <span className="text-[11px] text-white/70">
            정식 인증 재요청 시 매니저가 1영업일 이내 검토합니다
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/student/certificate')}
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            증명서 미리보기
          </button>
          <button
            type="button"
            onClick={reRequest}
            disabled={!allDone}
            className={cn(
              'rounded-lg px-5 py-2.5 text-[13px] font-bold',
              allDone
                ? 'bg-brand text-white'
                : 'bg-surface-muted text-fg-subtle cursor-not-allowed',
            )}
          >
            {allDone
              ? '정식 인증 재요청'
              : `🔒 정식 인증 재요청 (${data.reasons.length}건 보완 필요)`}
          </button>
        </div>
      </div>
    </div>
  )
}
