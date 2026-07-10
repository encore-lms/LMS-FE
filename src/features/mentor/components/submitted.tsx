import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Check, FileText, Info } from 'lucide-react'

// 제출 완료 페이지 공통 골격 — Figma 2582:6400(평가) / 2582:6476(추천) 동일 문법.
// hero 그림자는 Figma raw(success 계열 rgba — bg 는 brand 토큰, 혼용 의도 여부 openQuestion 보존).

export function SuccessHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <section className="bg-brand text-on-color flex items-center gap-5 rounded-2xl px-8 py-7 shadow-[0_8px_22px_rgba(10,176,128,0.22)]">
      <span className="bg-surface flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full shadow-[0_4px_14px_rgba(10,176,128,0.3)]">
        <Check className="text-brand h-9 w-9" strokeWidth={3} />
      </span>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[1.98px]">
          {eyebrow}
        </span>
        <h2 className="text-2xl leading-[30px] font-bold">{title}</h2>
        <p className="text-on-color/90 text-[13px] leading-5 font-medium">
          {description}
        </p>
      </div>
    </section>
  )
}

export function SubmitSummaryCard({
  submittedAtLabel,
  rows,
}: {
  submittedAtLabel: string
  rows: { label: string; value: string }[]
}) {
  return (
    <section className="bg-surface rounded-2xl shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]">
      <header className="flex items-center justify-between gap-3 px-6 pt-5 pb-3.5">
        <div className="flex items-center gap-2">
          <FileText className="text-fg h-4 w-4" />
          <h3 className="text-fg text-sm font-bold">제출 요약</h3>
        </div>
        <span className="text-fg-subtle flex items-center gap-1.5 text-[11px] font-medium">
          <Calendar className="h-4 w-4" />
          제출 시각 {submittedAtLabel}
        </span>
      </header>
      <dl className="divide-divider flex flex-col divide-y">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 px-6 py-3"
          >
            <dt className="text-fg-subtle text-xs font-medium whitespace-nowrap">
              {row.label}
            </dt>
            <dd className="text-fg text-right text-[13px] font-bold">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function NextStepBar({
  secondary,
  primary,
}: {
  secondary: { label: string; to: string }
  primary: { label: string; to: string }
}) {
  return (
    <section className="bg-surface flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4 shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]">
      <div className="flex flex-col gap-0.5">
        <span className="text-fg text-sm font-bold">다음 단계</span>
        <span className="text-fg-muted text-[11px]">
          진행 흐름의 다음 화면으로 이동하거나 목록으로 돌아갈 수 있습니다
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <Link
          to={secondary.to}
          className="border-border text-fg-muted hover:bg-surface-muted rounded-[10px] border px-4 py-2.5 text-[13px] font-medium"
        >
          {secondary.label}
        </Link>
        <Link
          to={primary.to}
          className="bg-success text-on-color hover:bg-success/90 flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[13px] font-bold"
        >
          {primary.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}

/** info 틴트 안내 배너 — Figma raw #e0edfc → info-bg 토큰 conform. */
export function InfoNotice({ children }: { children: ReactNode }) {
  return (
    <section className="bg-info-bg border-info flex items-start gap-3 rounded-[14px] border p-4">
      <Info className="text-info mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-fg-muted text-xs leading-[18px]">{children}</p>
    </section>
  )
}
