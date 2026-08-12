import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { AiTabSkeleton } from './TabSkeletons'
import { cn } from '@/shared/lib/cn'
import { CERTIFICATE_MOCK_STUDENT_ID, fetchAiAnalysis } from '../ai'
import { AiAnalysisOverview } from '../v2/AiAnalysisOverview'
import { AiAnalysisMethodology } from '../v2/AiAnalysisMethodology'

export function AiTab({
  studentId = CERTIFICATE_MOCK_STUDENT_ID,
}: {
  studentId?: string
}) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false)
  const query = useQuery({
    queryKey: ['aiAnalysis', studentId],
    queryFn: () => fetchAiAnalysis(studentId),
  })

  return (
    <DataBoundary
      isPending={query.isPending}
      isError={query.isError || !query.data}
      onRetry={query.refetch}
      skeleton={<AiTabSkeleton />}
      errorTitle="AI 분석을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요."
    >
      {query.data && (
        <div className="flex flex-col gap-8">
          <header className="border-accent/25 bg-accent-bg/40 flex flex-col justify-between gap-4 rounded-2xl border px-5 py-5 sm:flex-row sm:items-start sm:px-6">
            <div className="flex items-start gap-3">
              <span className="bg-accent-strong text-on-color flex size-9 shrink-0 items-center justify-center rounded-xl text-[16px] font-bold">
                ✦
              </span>
              <div>
                <h1 className="text-fg text-[20px] leading-7 font-bold">
                  AI 분석
                </h1>
                <p className="text-fg-muted mt-1 max-w-3xl text-[14px] leading-6">
                  수강생의 직무 방향, 프로젝트 수행 방식, 문제해결 역량을 AI가
                  세 관점에서 종합적으로 분석했습니다.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-expanded={isMethodologyOpen}
              aria-controls="ai-analysis-methodology"
              onClick={() => setIsMethodologyOpen((open) => !open)}
              className="border-accent/25 bg-surface text-fg-muted hover:bg-accent-bg hover:text-accent-strong focus-visible:ring-brand flex w-fit shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-bold transition-colors outline-none focus-visible:ring-2"
            >
              분석 기준
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'size-4 transition-transform',
                  isMethodologyOpen && 'rotate-180',
                )}
              />
            </button>
          </header>

          <div id="ai-analysis-methodology" hidden={!isMethodologyOpen}>
            <AiAnalysisMethodology analysis={query.data} />
          </div>

          <AiAnalysisOverview key={studentId} analysis={query.data} />
        </div>
      )}
    </DataBoundary>
  )
}
