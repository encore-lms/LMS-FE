// 일지 작성 — 시간 차감 자동 산정 배너(인정·초과·잔여 프리뷰, LogComposeForm 분리).
import { Clock } from 'lucide-react'
import { round1 } from './logComposeConstants'
import { CalcDivider, CalcStat } from './logComposeAtoms'

export function LogCalcSection({
  actualMinutes,
  recognizedPreview,
  excessPreview,
  remainingHours,
  afterRemaining,
}: {
  actualMinutes: number
  recognizedPreview: number
  excessPreview: number
  remainingHours: number
  afterRemaining: number
}) {
  return (
    <section className="bg-brand/10 border-brand flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <span className="bg-surface text-brand flex h-11 w-11 items-center justify-center rounded-xl">
          <Clock className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-sm font-bold">시간 차감 자동 산정</span>
          <span className="text-fg-muted text-[11px]">
            실제 진행 시간 기준으로 인정·초과 시간을 자동 계산합니다
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <CalcStat
          label="실제 진행"
          value={actualMinutes > 0 ? `${round1(actualMinutes / 60)}h` : '-'}
        />
        <CalcDivider />
        <CalcStat
          label="인정 시간"
          value={actualMinutes > 0 ? `${recognizedPreview}h` : '-'}
          valueClass="text-success"
        />
        <CalcDivider />
        <CalcStat
          label="초과"
          value={excessPreview > 0 ? `${excessPreview}h` : '-'}
          valueClass={
            excessPreview > 0 ? 'text-accent-strong' : 'text-fg-subtle'
          }
        />
        <CalcDivider />
        <CalcStat
          label="배정 잔여"
          value={
            actualMinutes > 0
              ? `${remainingHours}h → ${afterRemaining}h`
              : `${remainingHours}h`
          }
          valueClass="text-warning"
        />
      </div>
    </section>
  )
}
