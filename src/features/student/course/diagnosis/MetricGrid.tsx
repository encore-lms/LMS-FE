import type { StudentMetrics } from './types'

// 정량 지표 그리드 8칸 — 그룹 리포트(학생 카드)와 개인 리포트가 같은 그리드를 쓴다.

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-fg-subtle text-[11px] font-medium">{label}</dt>
      <dd className="text-fg text-[13px] font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  )
}

export function MetricGrid({ m }: { m: StudentMetrics }) {
  return (
    <dl className="border-border bg-surface-muted/50 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-4 sm:grid-cols-4">
      <MetricCell
        label="진행 단계"
        value={`${m.stepsCompleted}/${m.totalSteps} 완료 (현재 ${m.currentStep}단계)`}
      />
      <MetricCell label="활동일" value={`${m.activeDays}일`} />
      <MetricCell label="현 단계 정체" value={`${m.stalledDays}일`} />
      <MetricCell label="최근 미접속" value={`${m.daysSinceLastActivity}일`} />
      <MetricCell
        label="실행당 에러"
        value={`${m.errorPerRun.toFixed(2)} (${m.errorRuns}회/${m.totalRuns}회)`}
      />
      <MetricCell
        label="힌트 요청"
        value={`${m.hintTotal}회 (일 ${m.hintPerActiveDay.toFixed(2)}회)`}
      />
      <MetricCell
        label="에러 후 재시도 간격"
        value={`${m.retryGapAvgMin.toFixed(1)}분 (최대 ${m.retryGapMaxMin.toFixed(1)}분)`}
      />
      <MetricCell
        label="주요 에러"
        value={m.topErrors.map((e) => `${e.type}×${e.count}`).join(', ')}
      />
    </dl>
  )
}
