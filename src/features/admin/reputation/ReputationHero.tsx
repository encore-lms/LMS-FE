// 평판 수집 히어로 배너 — 현황 요약 + 누락 일괄 요청 푸시. ReputationPage에서 분리.
import { Info, Send } from 'lucide-react'
import { type ReputationPushAction } from './reputationMeta'
import type { ReputationSummary } from './types'

export function ReputationHero({
  summary,
  onPushAction,
}: {
  summary: ReputationSummary
  onPushAction: (action: ReputationPushAction) => void
}) {
  return (
    <div className="bg-brand text-on-color flex flex-col gap-4 rounded-xl p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[17px] font-bold">
          수강생별 평판 수집 현황과 요청 푸시 추적
        </p>
        <p className="text-on-color/75 mt-2 text-[13px]">
          {summary.cohortLabel} · {summary.students}명
          <span className="ml-2 inline-flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            누락 수강생 {summary.missingStudents}명
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={() =>
          onPushAction({
            spec: {
              title: '누락 일괄 요청 푸시',
              subtitle: `누락 수강생 ${summary.missingStudents}명에게 평판 입력을 일괄 요청합니다.`,
              rows: [
                {
                  label: '대상',
                  value: `누락 ${summary.missingStudents}명`,
                },
                { label: '기수', value: summary.cohortLabel },
                { label: '채널', value: 'LMS 알림' },
                {
                  label: '처리',
                  value: '강사·멘토·동료 누락 항목별 발송',
                },
              ],
              confirmLabel: '일괄 푸시',
            },
            result: `누락 ${summary.missingStudents}명에게 요청 푸시를 보냈습니다.`,
            payload: { kind: 'bulk' },
          })
        }
        className="bg-surface text-brand hover:bg-surface/90 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-4 text-[13px] font-semibold transition-colors"
      >
        <Send className="h-4 w-4" />
        일괄 요청 푸시 — 누락 {summary.missingStudents}명
      </button>
    </div>
  )
}
