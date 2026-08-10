import { cn } from '@/shared/lib/cn'
import type { CertHeader, CertStage } from '../types'

// 증명서 컴팩트 히어로 — Figma 탭 상세 'compact-hero'.
// 슬림한 틸 바: ENCORE DATA 씰 + status 칩 + 이름/과정 + 교육 기간.
const STATUS_CHIP: Record<CertStage, { dot: string; label: string }> = {
  before: { dot: 'bg-warning', label: 'PREVIEW · 정식 인증 전' },
  reviewing: { dot: 'bg-info', label: '검토 중 · 매니저 확인' },
  changes_requested: { dot: 'bg-danger', label: '보완 요청 · 수정 필요' },
  certified: { dot: 'bg-success', label: '정식 인증 완료' },
}

export function CertHero({
  header,
  status,
}: {
  header: CertHeader
  status: CertStage
}) {
  const chip = STATUS_CHIP[status]
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
          <span className={cn('size-1.5 rounded-full', chip.dot)} />
          {chip.label}
          {status === 'certified' && (
            <span className="ml-1 font-mono text-white/85">
              검증 ID {header.certId}
            </span>
          )}
        </span>
        <div className="flex items-baseline gap-2.5">
          <span className="text-[26px] leading-none font-bold">
            {header.studentName}
          </span>
          {/* 과정·기수는 별도 요청이라 늦게 온다 — 오는 동안 구분점만 남지 않게 통째로 감춘다. */}
          {(header.courseName || header.cohortName) && (
            <span className="text-[13px] font-medium text-white/85">
              {[header.courseName, header.cohortName]
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}
        </div>
        <span className="text-[12px] text-white/75">
          교육 기간 {header.periodLabel}
        </span>
      </div>
    </section>
  )
}
