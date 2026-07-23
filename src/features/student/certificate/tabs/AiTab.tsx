import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { cn } from '@/shared/lib/cn'
import { AiBanner } from './TechTab'
import { AiProfile } from '../v2/AiProfile'
import { AiProjectAnalysis } from '../v2/AiProjectAnalysis'
import { AiProblemAnalysis } from '../v2/AiProblemAnalysis'
import { AiTechnicalVerdict } from '../v2/AiTechnicalVerdict'
import { SentimentBubbles } from '../v2/SentimentBubbles'
import { AiAnalysisMethodology } from '../v2/AiAnalysisMethodology'
import { CERTIFICATE_MOCK_STUDENT_ID, fetchAiAnalysis } from '../ai'

// 증명서 v2 — AI 분석 통합 탭. AI 해석은 ai 모듈(getAiAnalysis)에서 단일 소스로 가져온다.
// 지금은 mock. 나중에 getAiAnalysis 내부만 서버 API로 교체하면 됨(호출부 불변).

// TODO(BE 연동): 인증 사용자 식별자로 교체. 지금은 증명서 대표 mock 학생을 사용한다.
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
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="bg-accent-strong flex size-6 items-center justify-center rounded-md text-[13px] font-bold text-white">
                ✦
              </span>
              <div className="flex flex-col">
                <h2 className="text-fg text-[18px] font-bold">AI 분석</h2>
                <span className="text-fg-subtle text-[11px]">
                  데이터·인증 결과를 바탕으로 AI가 해석한 종합 분석 · 검증
                  사실과 분리해 제공
                </span>
              </div>
            </div>

            <button
              type="button"
              aria-expanded={isMethodologyOpen}
              aria-controls="ai-analysis-methodology"
              onClick={() => setIsMethodologyOpen((open) => !open)}
              className="border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:ring-brand flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors outline-none focus-visible:ring-2"
            >
              산출 근거
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'size-3.5 transition-transform',
                  isMethodologyOpen && 'rotate-180',
                )}
              />
            </button>
          </div>

          <div id="ai-analysis-methodology" hidden={!isMethodologyOpen}>
            <AiAnalysisMethodology analysis={query.data} />
          </div>

          {/* 프로파일링/페르소나 (온톨로지 역량맵은 종합 요약 탭으로 이동) */}
          <AiProfile
            profile={query.data.profile}
            personas={query.data.personas}
          />

          {/* 기술 판단과 프로젝트 궤적은 정보 밀도가 달라 각각 독립된 전체 폭으로 표시 */}
          <AiTechnicalVerdict verdict={query.data.verdict} />
          <AiProjectAnalysis projects={query.data.projects} />

          <AiProblemAnalysis problem={query.data.problem} />

          {/* 상담 감성 — 과정 기간을 초기·중기·후기로 나눈 실제 상담 흐름 */}
          <SentimentBubbles sentiment={query.data.sentiment} />

          <AiBanner text="AI 분석은 강사가 인증한 활동을 근거로 한 해석이며, 검증된 사실과 구분됩니다. 외부에 공개되는 항목에는 인증 완료 + 운영자 승인을 거친 내용만 포함됩니다." />
        </div>
      )}
    </DataBoundary>
  )
}
