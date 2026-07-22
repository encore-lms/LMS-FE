// HRD API Key KPI 4종(활성 키·마지막 검증·만료 예정·최근 실패) — HrdApiKeyPage에서 분리.
import { KpiCard } from '@/components/data/KpiCard'
import type { HrdKeySummary, HrdKeyTestResult } from '@/shared/types'
import { fmtDateTime } from './hrdKeyMeta'

export function HrdKeyKpis({
  activeCount,
  lastTest,
  summary,
}: {
  activeCount: number
  lastTest: HrdKeyTestResult | null
  summary: HrdKeySummary | undefined
}) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="활성 키" value={activeCount} hint="active = true 기준" />
      <KpiCard
        label="마지막 검증"
        value={lastTest ? (lastTest.ok ? '성공' : '실패') : '없음'}
        tone={lastTest ? (lastTest.ok ? 'success' : 'danger') : 'default'}
        hint={
          lastTest
            ? `${fmtDateTime(lastTest.at)} · ${lastTest.latencyMs}ms`
            : '테스트 이력 없음'
        }
      />
      <KpiCard
        label="만료/교체 예정"
        value={summary?.expiring ?? 0}
        tone={(summary?.expiring ?? 0) > 0 ? 'warning' : 'default'}
        hint="만료 정책 연동 시 표시"
      />
      <KpiCard
        label="최근 실패"
        value={summary?.recentFail ?? 0}
        tone={(summary?.recentFail ?? 0) > 0 ? 'danger' : 'default'}
        hint="24시간 기준"
      />
    </div>
  )
}
