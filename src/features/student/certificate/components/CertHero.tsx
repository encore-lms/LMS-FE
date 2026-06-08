import type { CertHeader } from '../types'

// 증명서 히어로 — PLAYDATA 역량 증명서. 이름·과정·기간 + 공개 여부 + 인증 신청 요청.
export function CertHero({
  header,
  onRequest,
}: {
  header: CertHeader
  onRequest: () => void
}) {
  return (
    <section className="bg-brand relative flex items-center justify-between gap-6 overflow-hidden rounded-2xl px-8 py-7 text-white shadow-[0px_8px_22px_0px_rgba(26,140,133,0.18)]">
      {/* 장식 씰 링 */}
      <span className="pointer-events-none absolute -top-10 -right-10 size-44 rounded-full border-[18px] border-white/10" />
      <span className="pointer-events-none absolute top-6 right-16 size-24 rounded-full border-8 border-white/10" />

      <div className="relative flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.22em] text-white/85">
          PLAYDATA · DATA COMPETENCY CERTIFICATE
        </span>
        <h1 className="text-[32px] leading-tight font-bold">
          {header.studentName}
        </h1>
        <span className="text-[13px] font-medium text-white/90">
          {header.courseName} · {header.cohortName}
        </span>
        <span className="text-[12px] text-white/80">{header.periodLabel}</span>
      </div>

      <div className="relative flex shrink-0 flex-col items-end gap-2.5">
        <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
          공개 여부 · {header.isPublic ? '공개' : '비공개'}
        </span>
        <button
          type="button"
          onClick={onRequest}
          className="bg-surface text-brand rounded-[10px] px-5 py-2.5 text-[13px] font-bold"
        >
          ◎ 인증 신청 요청
        </button>
        <span className="text-[11px] text-white/75">
          증명서 ID {header.certId}
        </span>
      </div>
    </section>
  )
}
