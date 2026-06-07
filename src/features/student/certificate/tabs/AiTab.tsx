import { cn } from '@/shared/lib/cn'
import type { CertificateOverview, Tone } from '../types'
import { AiBanner } from './TechTab'
import { AiAnalysisPanel } from '../v2/AiAnalysisPanel'
import { AiProfile } from '../v2/AiProfile'
import { SentimentRecorder } from '../v2/SentimentRecorder'

// 증명서 v2 — AI 분석 통합 탭. 데이터 탭에서 분리한 모든 AI 해석을 한 곳에 모은다.
// 프로파일링·페르소나·온톨로지·기술/프로젝트/문제해결 판단·상담 감성.
const SOLID: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}

export function AiTab({ data }: { data: CertificateOverview }) {
  const { summary, tech, projects, problem, growth } = data
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
      {summary.aiProfile && (
        <AiProfile
          profile={summary.aiProfile}
          personas={summary.personas ?? []}
        />
      )}

      {/* 기술 종합 판단 + 프로젝트 분석 */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {tech.aiVerdict && (
          <AiAnalysisPanel title="AI 기술 역량 종합 판단" className="flex-1">
            <div className="flex flex-col gap-2 text-[12px] leading-5">
              <p>
                <b className="text-success">강점 </b>
                <span className="text-fg-muted">{tech.aiVerdict.strength}</span>
              </p>
              <p>
                <b className="text-warning">보완 </b>
                <span className="text-fg-muted">{tech.aiVerdict.gap}</span>
              </p>
              <p>
                <b className="text-accent-strong">특이형 </b>
                <span className="text-fg-muted">{tech.aiVerdict.unique}</span>
              </p>
            </div>
          </AiAnalysisPanel>
        )}
        {projects.ai && (
          <AiAnalysisPanel title="AI 프로젝트 분석" className="flex-1">
            <span className="text-fg-muted text-[12px] leading-5">
              {projects.ai.summary}
            </span>
          </AiAnalysisPanel>
        )}
      </div>

      {/* 문제해결·협업 종합 */}
      {problem.ai && (
        <AiAnalysisPanel title="AI 문제해결·협업 종합 분석">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-1 flex-col gap-3">
              <span className="text-fg text-[12px] font-bold">
                트러블슈팅 역량
              </span>
              {problem.ai.caps.map((c) => (
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
                  <span className="text-fg-subtle text-[10px]">
                    연결 {c.tag}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="bg-surface flex flex-col gap-1 rounded-xl p-3">
                <span className="text-accent-strong text-[11px] font-bold">
                  협업 스타일
                </span>
                <span className="text-fg-muted text-[11px] leading-4">
                  {problem.ai.style}
                </span>
              </div>
              <div className="bg-surface flex flex-col gap-1 rounded-xl p-3">
                <span className="text-accent-strong text-[11px] font-bold">
                  성장·확장
                </span>
                <span className="text-fg-muted text-[11px] leading-4">
                  {problem.ai.scaling}
                </span>
              </div>
            </div>
          </div>
        </AiAnalysisPanel>
      )}

      {/* 상담 감성 — 페이지 내 녹음 → 자동 분석 → 키워드 버블 */}
      <SentimentRecorder initial={growth.sentiment} />

      <AiBanner text="AI 분석은 승인된 confirmed 데이터에 기반한 해석이며, 검증된 사실과 구분됩니다. 외부 공개 payload에는 confirmed 인증 + 운영자 승인 시 포함됩니다." />
    </div>
  )
}
