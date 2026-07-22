// HRD API Key 히어로 배너 — 최근 연결 테스트 상태 요약. HrdApiKeyPage에서 분리.
import { CheckCircle2, Clock } from 'lucide-react'
import type { HrdKeyTestResult } from '@/shared/types'
import { fmtDateTime } from './hrdKeyMeta'

export function HrdKeyHero({
  lastTest,
}: {
  lastTest: HrdKeyTestResult | null
}) {
  return (
    <div className="bg-brand text-on-color mt-4 flex flex-wrap items-start justify-between gap-4 rounded-xl px-6 py-5">
      <div>
        <p className="text-on-color/60 text-[11px] font-semibold tracking-wider">
          HRD API KEY · HRD-Net 연동
        </p>
        <p className="mt-1 text-xl font-bold">HRD API Key 관리</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="bg-surface/15 flex items-center gap-1.5 rounded-full px-2.5 py-1">
            <CheckCircle2 className="h-3 w-3" />
            {lastTest
              ? lastTest.ok
                ? '최근 연결 정상'
                : '최근 연결 실패'
              : '연결 테스트 이력 없음'}
          </span>
          {lastTest && (
            <span className="bg-surface/15 flex items-center gap-1.5 rounded-full px-2.5 py-1">
              <Clock className="h-3 w-3" /> 마지막 연결 테스트{' '}
              {fmtDateTime(lastTest.at)} · {lastTest.latencyMs}ms
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
