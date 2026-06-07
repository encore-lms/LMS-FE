import { Fragment } from 'react'
import { cn } from '@/shared/lib/cn'
import type { CertSummaryTab, Tone } from '../types'
import { SkillRadar } from '../components/SkillRadar'
import { CERT_V2 } from '../config'
import { DomainDonut } from '../v2/DomainDonut'
import { OntologyMap } from '../v2/OntologyMap'

// 증명서 탭1 종합 요약 — 종합 점수·KPI·6축 레이더·360°·퀴즈 카테고리·근거·대표 프로젝트·체크리스트.
const DELTA: Record<Tone, string> = {
  brand: 'text-brand',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent-strong',
  success: 'text-success',
}
const EV: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
function barColor(s: number) {
  if (s >= 85) return 'bg-brand'
  if (s >= 75) return 'bg-info'
  if (s >= 65) return 'bg-warning'
  return 'bg-danger'
}
const card =
  'border-border bg-surface rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

export function SummaryTab({ s }: { s: CertSummaryTab }) {
  return (
    <div className="flex flex-col gap-4">
      {/* 종합 요약 헤더 + KPI 한 줄 (Figma 2402:11293) */}
      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-fg text-[16px] font-bold">종합 요약</span>
            <span className="text-fg-subtle text-[11px]">
              출결·시험·과제·프로젝트·평판을 한 화면에서 요약 · 자동 산정 + 360°
              ({s.sourceLabel})
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="bg-surface-muted text-fg flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold">
              <span className="bg-success size-1.5 rounded-full" />
              종합 {s.overallScore} / {s.scoreMax}
            </span>
            <span className="bg-surface-muted text-fg flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold">
              <span className="bg-brand size-1.5 rounded-full" />
              Grade {s.grade}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {s.kpis.map((k) => (
            <div
              key={k.key}
              className="border-border bg-surface flex flex-col gap-1.5 rounded-[14px] border p-[18px]"
            >
              <span className="text-fg-muted text-[12px] font-medium">
                {k.label}
              </span>
              <span className="text-fg text-[28px] leading-none font-bold">
                {k.value}
                {k.unit && (
                  <span className="text-fg-muted ml-0.5 text-[14px]">
                    {k.unit}
                  </span>
                )}
              </span>
              {k.delta && (
                <span
                  className={cn(
                    'text-[11px] font-semibold',
                    DELTA[k.deltaTone ?? 'brand'],
                  )}
                >
                  {k.delta}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 레이더 + 360 비교 */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <section
          className={cn(card, 'flex flex-1 flex-col items-center gap-2')}
        >
          <div className="flex w-full flex-col gap-0.5">
            <span className="text-fg text-[15px] font-bold">
              6축 자동 산정 레이더
            </span>
            <span className="text-fg-muted text-[11px]">
              평균 {s.skillAvg} / 100 · confirmed
            </span>
          </div>
          <SkillRadar axes={s.skillAxes} />
          <div className="text-fg-muted flex gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="bg-brand size-2 rounded-full" />내 점수
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-fg-subtle size-2 rounded-full" />
              동료 평균
            </span>
          </div>
        </section>

        <section className={cn(card, 'flex flex-1 flex-col gap-2')}>
          <div className="flex flex-col gap-0.5">
            <span className="text-fg text-[15px] font-bold">360° 비교</span>
            <span className="text-fg-muted text-[11px]">
              자동 산정 · 동료 · 강사 검증
            </span>
          </div>
          <div className="mt-1 grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-5">
            <span className="text-fg-subtle pb-2 text-[11px] font-semibold">
              축
            </span>
            <span className="text-fg-subtle pb-2 text-right text-[11px] font-semibold">
              자동
            </span>
            <span className="text-fg-subtle pb-2 text-right text-[11px] font-semibold">
              동료
            </span>
            <span className="text-fg-subtle pb-2 text-right text-[11px] font-semibold">
              강사
            </span>
            {s.skillAxes.map((a) => (
              <Fragment key={a.key}>
                <span className="border-divider text-fg border-t py-2.5 text-[12px] font-bold">
                  {a.key}
                </span>
                <span className="border-divider text-brand border-t py-2.5 text-right text-[12px] font-bold">
                  {a.score}
                </span>
                <span className="border-divider text-fg-muted border-t py-2.5 text-right text-[12px]">
                  {(a.peer / 20).toFixed(1)}/5.0
                </span>
                <span className="border-divider border-t py-2.5 text-right">
                  {a.confirmed ? (
                    <span className="bg-success-bg text-success rounded px-1.5 py-0.5 text-[10px] font-bold">
                      confirmed
                    </span>
                  ) : (
                    <span className="text-fg-subtle text-[11px]">—</span>
                  )}
                </span>
              </Fragment>
            ))}
          </div>
        </section>
      </div>

      {/* 퀴즈 카테고리 + 근거 요약 */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-3.5')}>
          <span className="text-fg text-[15px] font-bold">
            퀴즈 카테고리 점수
          </span>
          {s.quizCategories.map((q) => (
            <div key={q.label} className="flex items-center gap-3">
              <span className="text-fg w-24 shrink-0 text-[12px] font-medium">
                {q.label}
              </span>
              <div className="bg-surface-muted h-2.5 flex-1 overflow-hidden rounded-full">
                <div
                  className={cn('h-full rounded-full', barColor(q.score))}
                  style={{ width: `${q.score}%` }}
                />
              </div>
              <span className="text-fg w-8 shrink-0 text-right text-[12px] font-bold">
                {q.score}
              </span>
            </div>
          ))}
        </section>

        <section className={cn(card, 'flex flex-1 flex-col gap-3')}>
          <span className="text-fg text-[15px] font-bold">
            근거 요약 · 강점
          </span>
          {s.evidence.map((e) => (
            <div key={e.id} className="flex gap-2.5">
              <span
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  EV[e.tone],
                )}
              />
              <div className="flex flex-col">
                <span className="text-fg text-[13px] font-semibold">
                  {e.label}
                </span>
                <span className="text-fg-muted text-[11px]">{e.detail}</span>
              </div>
            </div>
          ))}
        </section>

        {/* v2: 도메인 경험 도넛 — 분석 카드 행에 함께 배치 */}
        {CERT_V2 && s.domains && (
          <DomainDonut domains={s.domains} className="flex-1" />
        )}
      </div>

      {/* 대표 프로젝트 기록 */}
      <section className={cn(card, 'flex flex-col gap-3.5')}>
        <span className="text-fg text-[15px] font-bold">
          대표 프로젝트 · 기록
        </span>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {s.projects.map((p) => (
            <div
              key={p.id}
              className="border-border flex flex-col gap-1.5 rounded-[12px] border p-4"
            >
              <span className="text-brand text-[10px] font-bold tracking-wider">
                {p.kind}
              </span>
              <span className="text-fg text-[13px] font-semibold">
                {p.title}
              </span>
              <span className="text-fg-muted text-[11px]">{p.meta}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 요청 전 체크리스트 */}
      <section className={cn(card, 'flex flex-col gap-1')}>
        <div className="flex items-center justify-between pb-2">
          <span className="text-fg text-[15px] font-bold">
            요청 전 체크리스트
          </span>
          <span className="text-fg-muted text-[12px] font-semibold">
            {s.checkDoneLabel} 완료
          </span>
        </div>
        {s.checklist.map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 && <div className="bg-divider h-px w-full" />}
            <div className="flex items-center gap-3 py-3">
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                  c.done
                    ? 'bg-success text-white'
                    : 'border-border text-fg-subtle border',
                )}
              >
                {c.done ? '✓' : ''}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-fg text-[13px] font-semibold">
                  {c.label}
                </span>
                <span className="text-fg-muted text-[11px]">{c.sub}</span>
              </div>
              {c.actionLabel && (
                <span
                  className={cn(
                    'shrink-0 text-[12px] font-semibold',
                    c.done ? 'text-fg-subtle' : 'text-brand',
                  )}
                >
                  {c.actionLabel} →
                </span>
              )}
            </div>
          </Fragment>
        ))}
      </section>

      {/* ── v2 (CERT_V2): 온톨로지 역량 맵 (도메인 도넛은 위 분석 행으로 이동) ── */}
      {CERT_V2 && s.ontology && <OntologyMap ontology={s.ontology} />}
    </div>
  )
}
