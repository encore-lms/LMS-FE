import { useQuery } from '@tanstack/react-query'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { cn } from '@/shared/lib/cn'
import { AiBanner } from './TechTab'
import { AiAnalysisPanel } from '../v2/AiAnalysisPanel'
import { AiProfile } from '../v2/AiProfile'
import { SentimentBubbles } from '../v2/SentimentBubbles'
import { TechnicalVerdict } from '../v2/TechnicalVerdict'
import {
  CERTIFICATE_MOCK_STUDENT_ID,
  fetchAiAnalysis,
  type AiAnalysis,
} from '../ai'
import { certKeys } from '../queryKeys'
import { TONE_SOLID } from '@/shared/lib/tone'

function AiTabContent({ data }: { data: AiAnalysis }) {
  const { verdict, profile, personas, projects, problem, sentiment } = data
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <span className="bg-accent-strong flex size-6 items-center justify-center rounded-md text-[13px] font-bold text-white">
          ✦
        </span>
        <div className="flex flex-col">
          <h2 className="text-fg text-[18px] font-bold">AI 분석</h2>
          <span className="text-fg-subtle text-[11px]">
            데이터·인증 결과를 바탕으로 AI가 해석한 종합 분석 · 검증 사실과
            분리해 제공
          </span>
        </div>
      </div>

      {/* 프로파일링/페르소나 (온톨로지 역량맵은 종합 요약 탭으로 이동) */}
      <AiProfile profile={profile} personas={personas} />

      {/* 기술 종합 판단 + 프로젝트 분석 */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <TechnicalVerdict verdict={verdict} />
        <AiAnalysisPanel title="AI 프로젝트 분석" className="flex-1">
          <div className="flex flex-col gap-3">
            <span className="text-fg-muted text-[12px] leading-5">
              {projects.summary}
            </span>
            {projects.groups.length > 0 && (
              <div className="flex flex-col gap-2">
                {projects.groups.map((g) => (
                  <div
                    key={g.label}
                    className="bg-surface flex flex-col gap-1 rounded-xl p-3"
                  >
                    <span className="text-accent-strong text-[11px] font-bold">
                      {g.label}
                    </span>
                    <span className="text-fg-muted text-[11px] leading-4">
                      {g.summary}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AiAnalysisPanel>
      </div>

      {/* 문제해결·협업 종합 */}
      <AiAnalysisPanel title="AI 문제해결·협업 종합 분석">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex flex-1 flex-col gap-3">
            <span className="text-fg text-[12px] font-bold">
              트러블슈팅 역량
            </span>
            {problem.caps.map((c) => (
              <div key={c.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-fg font-medium">{c.label}</span>
                  <span className="text-fg font-bold">{c.score}</span>
                </div>
                <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={cn('h-full rounded-full', TONE_SOLID[c.tone])}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
                <span className="text-fg-subtle text-[10px]">연결 {c.tag}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="bg-surface flex flex-col gap-1 rounded-xl p-3">
              <span className="text-accent-strong text-[11px] font-bold">
                협업 스타일
              </span>
              <span className="text-fg-muted text-[11px] leading-4">
                {problem.style}
              </span>
            </div>
            <div className="bg-surface flex flex-col gap-1 rounded-xl p-3">
              <span className="text-accent-strong text-[11px] font-bold">
                성장·확장
              </span>
              <span className="text-fg-muted text-[11px] leading-4">
                {problem.scaling}
              </span>
            </div>
          </div>
        </div>
      </AiAnalysisPanel>

      {/* 상담 감성 — 키워드 버블(초기 불안 → 중기 탐색 → 후기 성장) */}
      <SentimentBubbles sentiment={sentiment} />

      <AiBanner text="AI 분석은 강사가 인증한 활동을 근거로 한 해석이며, 검증된 사실과 구분됩니다. 외부에 공개되는 항목에는 인증 완료 + 운영자 승인을 거친 내용만 포함됩니다." />
    </div>
  )
}

export function AiTab({
  studentId = CERTIFICATE_MOCK_STUDENT_ID,
}: {
  studentId?: string
}) {
  const query = useQuery({
    queryKey: certKeys.analysis(studentId),
    queryFn: () => fetchAiAnalysis(studentId),
  })

  return (
    <DataBoundary
      isPending={query.isPending}
      isError={query.isError || !query.data}
      onRetry={query.refetch}
      errorTitle="AI 분석 데이터를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요."
    >
      {query.data && <AiTabContent data={query.data} />}
    </DataBoundary>
  )
}
