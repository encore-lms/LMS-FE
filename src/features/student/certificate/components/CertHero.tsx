import type { CertHeader } from '../types'

// 증명서 컴팩트 히어로 — Figma 탭 상세 'compact-hero'.
// 슬림한 틸 바: ENCORE DATA 씰 + PREVIEW 칩 + 이름/과정 + 교육 기간.
export function CertHero({ header }: { header: CertHeader }) {
  return (
    <section className="bg-brand flex items-center gap-5 rounded-2xl px-7 py-6 text-white shadow-[0px_8px_22px_0px_rgba(26,140,133,0.18)]">
      {/* ENCORE DATA 씰 */}
      <div className="bg-surface flex size-14 shrink-0 flex-col items-center justify-center rounded-xl leading-none">
        <span className="text-brand text-[11px] font-extrabold tracking-tight">
          ENCORE
        </span>
        <span className="text-brand text-[11px] font-extrabold tracking-tight">
          DATA
        </span>
      </div>

      {/* 정보 */}
      <div className="flex flex-col gap-1.5">
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
          <span className="bg-warning size-1.5 rounded-full" />
          PREVIEW · 정식 인증 전
        </span>
        <div className="flex items-baseline gap-2.5">
          <span className="text-[26px] leading-none font-bold">
            {header.studentName}
          </span>
          <span className="text-[13px] font-medium text-white/85">
            {header.courseName} · {header.cohortName}
          </span>
        </div>
        <span className="text-[12px] text-white/75">
          교육 기간 {header.periodLabel}
        </span>
      </div>
    </section>
  )
}
