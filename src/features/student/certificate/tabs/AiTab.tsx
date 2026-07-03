import { cn } from '@/shared/lib/cn'
import type { Tone } from '../types'
import { AiBanner } from './TechTab'
import { AiAnalysisPanel } from '../v2/AiAnalysisPanel'
import { AiProfile } from '../v2/AiProfile'
import { SentimentBubbles } from '../v2/SentimentBubbles'
import { getAiAnalysis } from '../ai'

// 증명서 v2 — AI 분석 통합 탭. AI 해석은 ai 모듈(getAiAnalysis)에서 단일 소스로 가져온다.
// 지금은 mock. 나중에 getAiAnalysis 내부만 서버 API로 교체하면 됨(호출부 불변).
const SOLID: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}

// TODO(BE 연동): studentId를 실제 학생 식별자로 연결. 지금은 mock 고정.
export function AiTab({ studentId = 'stu-001' }: { studentId?: string }) {
  const { verdict, profile, personas, projects, problem, sentiment } =
    getAiAnalysis(studentId)
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
        <AiAnalysisPanel title="AI 기술 역량 종합 판단" className="flex-1">
          <div className="flex flex-col gap-2.5">
            {verdict.recommendBadge?.recommended && (
              <div
                className="border-accent/30 bg-accent-bg/60 text-accent-strong flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                title={verdict.recommendBadge.summary}
              >
                <span aria-hidden>★</span> 멘토 추천 수강생
              </div>
            )}
            <div className="flex flex-col gap-2 text-[12px] leading-5">
              <p>
                <b className="text-success">강점 </b>
                <span className="text-fg-muted">{verdict.strength}</span>
              </p>
              <p>
                <b className="text-warning">보완 </b>
                <span className="text-fg-muted">{verdict.gap}</span>
              </p>
              <p>
                <b className="text-accent-strong">특이형 </b>
                <span className="text-fg-muted">{verdict.unique}</span>
              </p>
            </div>
          </div>
        </AiAnalysisPanel>
        <AiAnalysisPanel title="AI 프로젝트 분석" className="flex-1">
          <span className="text-fg-muted text-[12px] leading-5">
            {projects.summary}
          </span>
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
                    className={cn('h-full rounded-full', SOLID[c.tone])}
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

      <AiBanner text="AI 분석은 승인된 confirmed 데이터에 기반한 해석이며, 검증된 사실과 구분됩니다. 외부 공개 payload에는 confirmed 인증 + 운영자 승인 시 포함됩니다." />
    </div>
  )
}
