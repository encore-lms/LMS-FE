import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { cn } from '@/shared/lib/cn'
import { CERTIFICATE_MOCK_STUDENT_ID, fetchAiAnalysis } from '../ai'
import { AiAnalysisMethodology } from '../v2/AiAnalysisMethodology'
import { AiJobFit } from '../v2/AiJobFit'
import { AiProjectAnalysis } from '../v2/AiProjectAnalysis'
import { AiTroubleshootingAnalysis } from '../v2/AiTroubleshootingAnalysis'
import { SentimentBubbles } from '../v2/SentimentBubbles'

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
      errorTitle="AI 분석을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요."
    >
      {query.data && (
        <div className="flex flex-col gap-5">
          <header className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-accent-strong text-on-color flex size-8 items-center justify-center rounded-lg text-[15px] font-bold">
                ✦
              </span>
              <div>
                <h1 className="text-fg text-[20px] leading-7 font-bold">
                  AI 분석
                </h1>
                <p className="text-fg-muted mt-0.5 text-[13px] leading-5">
                  채용 담당자가 먼저 확인할 직무 적합도, 프로젝트 수행, 문제해결
                  강점을 요약했습니다.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-expanded={isMethodologyOpen}
              aria-controls="ai-analysis-methodology"
              onClick={() => setIsMethodologyOpen((open) => !open)}
              className="border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:ring-brand flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-bold transition-colors outline-none focus-visible:ring-2"
            >
              산출 기준
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

          <AiJobFit jobFit={query.data.jobFit} />
          <AiProjectAnalysis projects={query.data.projects} />
          <AiTroubleshootingAnalysis
            troubleshooting={query.data.troubleshooting}
          />
          <SentimentBubbles sentiment={query.data.sentiment} />
        </div>
      )}
    </DataBoundary>
  )
}
