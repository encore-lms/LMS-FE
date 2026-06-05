import { Fragment } from 'react'
import { cn } from '@/shared/lib/cn'
import type { CertTechTab, Tone } from '../types'
import { CERT_V2 } from '../config'

// 증명서 탭2 기술·검증 — 카테고리 점수·시험 추세·자격증 인증·과제 검증.
const card =
  'border-border bg-surface rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
function bar(s: number) {
  if (s >= 85) return 'bg-brand'
  if (s >= 75) return 'bg-info'
  if (s >= 65) return 'bg-warning'
  return 'bg-danger'
}

export function TechTab({ t }: { t: CertTechTab }) {
  const maxTrend = Math.max(...t.examTrend, 100)
  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={2}
        title="기술·검증"
        sub="퀴즈·자격증·과제/실습 인증과 코드 활동 검증 · 자동 산정 기반"
      >
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 기술 평균 {t.avgScore}
        </span>
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 검정 자격증 {t.certCount}건
        </span>
      </TabHead>

      <section className={cn(card, 'flex flex-col gap-4')}>
        <span className="text-fg text-[15px] font-bold">
          카테고리별 기술 점수
        </span>
        {t.categories.map((c) => (
          <div key={c.label} className="flex flex-col gap-1.5">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-fg text-[13px] font-semibold">
                  {c.label}
                </span>
                <span className="text-fg-subtle text-[11px]">{c.sub}</span>
              </div>
              <div className="flex items-center gap-2">
                {CERT_V2 && c.percentile && (
                  <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-bold">
                    {c.percentile}
                  </span>
                )}
                <span className="text-fg text-[16px] font-bold">
                  {c.score}점
                </span>
              </div>
            </div>
            <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn('h-full rounded-full', bar(c.score))}
                style={{ width: `${c.score}%` }}
              />
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-3')}>
          <span className="text-fg text-[15px] font-bold">시험 추세</span>
          <span className="text-fg-subtle text-[11px]">
            {t.examTrend.length}회 정기 퀴즈 · 평균 {t.avgScore}
          </span>
          <div className="flex h-[140px] items-end gap-1.5 pt-2">
            {t.examTrend.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-fg-subtle text-[9px]">{v}</span>
                <div
                  className="bg-brand w-full rounded-t"
                  style={{ height: `${(v / maxTrend) * 100}%` }}
                />
                <span className="text-fg-subtle text-[8px]">Q{i + 1}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={cn(card, 'flex flex-1 flex-col gap-3')}>
          <span className="text-fg text-[15px] font-bold">
            자격증 · 외부 인증
          </span>
          {t.certs.map((c) => (
            <div key={c.name} className="flex items-start gap-3">
              <span
                className={cn(
                  'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold',
                  CHIP[c.statusTone],
                )}
              >
                {c.statusLabel}
              </span>
              <div className="flex flex-col">
                <span className="text-fg text-[13px] font-semibold">
                  {c.name}
                </span>
                <span className="text-fg-subtle text-[11px]">{c.detail}</span>
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className={cn(card, 'flex flex-col gap-0')}>
        <span className="text-fg pb-3 text-[15px] font-bold">
          과제 / 실습 검증
        </span>
        <div className="text-fg-muted grid grid-cols-[64px_1fr_80px_80px] gap-3 pb-2 text-[11px] font-bold">
          <span>주차</span>
          <span>과제명</span>
          <span>유형</span>
          <span>상태</span>
        </div>
        {t.assignments.map((a, i) => (
          <Fragment key={a.week}>
            {i > 0 && <div className="bg-divider h-px w-full" />}
            <div className="text-fg grid grid-cols-[64px_1fr_80px_80px] items-center gap-3 py-3 text-[12px]">
              <span className="font-bold">{a.week}</span>
              <span className="font-semibold">{a.title}</span>
              <span className="text-fg-muted">{a.type}</span>
              <span className="text-fg-muted">{a.status}</span>
            </div>
          </Fragment>
        ))}
      </section>

      <AiBanner text="MVP 단계에서는 승인·데이터 기반 자동 산정만 노출하며, AI 분석은 confirmed 인증 + 운영자 승인 시 외부 공개 payload에 포함됩니다." />
    </div>
  )
}

export function TabHead({
  no,
  title,
  sub,
  children,
}: {
  no: number
  title: string
  sub: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="bg-brand-deep flex size-6 items-center justify-center rounded-md text-[12px] font-bold text-white">
          {no}
        </span>
        <div className="flex flex-col">
          <h2 className="text-fg text-[18px] font-bold">{title}</h2>
          <span className="text-fg-subtle text-[11px]">{sub}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  )
}

export function AiBanner({ text }: { text: string }) {
  return (
    <div className="bg-warning-bg/50 border-warning flex flex-col gap-1 rounded-[14px] border p-4">
      <span className="text-warning w-fit rounded bg-white px-1.5 py-0.5 text-[10px] font-bold">
        AI · 종합 분석
      </span>
      <span className="text-fg-muted text-[12px] leading-5">{text}</span>
    </div>
  )
}
