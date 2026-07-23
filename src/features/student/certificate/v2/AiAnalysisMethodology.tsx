import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { AiAnalysis } from '../ai'

interface MethodSection {
  id: string
  label: string
  source: string
  basis: string
  flow: string
  result: string
}

function compact(items: string[], fallback: string) {
  if (items.length === 0) return fallback
  const visible = items.slice(0, 3).join(' · ')
  return items.length > 3 ? `${visible} 외 ${items.length - 3}건` : visible
}

function sectionsFor(analysis: AiAnalysis): MethodSection[] {
  const projectEvidence = analysis.projects.projects.flatMap(
    (project) => project.evidenceCodes,
  )
  const problemEvidence = [
    ...analysis.problem.caps.flatMap((cap) => cap.evidenceCodes),
    ...analysis.problem.collaboration.evidenceCodes,
    ...analysis.problem.growth.evidenceCodes,
  ]
  const sentimentEvidence = analysis.sentiment.bubbles.flatMap(
    (bubble) => bubble.evidence?.map((item) => item.code) ?? [],
  )
  const ontologyEvidence = analysis.ontology.nodes.flatMap(
    (node) => node.evidence,
  )

  return [
    {
      id: 'profile',
      label: '5축 역량 프로파일',
      source: '프로젝트 역할·수행업무, 동료평가, 평가 이력, 활동 기록',
      basis: compact(
        analysis.profile.rows.flatMap((row) => row.evidence ?? []),
        '연결된 프로파일 근거 코드 없음',
      ),
      flow: '축별 하위 신호 계산 → 수준 판정 → 5축 유형과 요약 생성',
      result: analysis.profile.summary,
    },
    {
      id: 'persona',
      label: '페르소나 TOP 3',
      source: '5축 프로파일과 개인 프로젝트·학습 활동',
      basis: compact(
        analysis.personas.flatMap((persona) => persona.evidenceCodes ?? []),
        '프로파일·활동 근거 교차 확인',
      ),
      flow: '고정 직무 범주별 근거 점수화 → 중복 제거 → 상위 3개 선정',
      result: analysis.personas.map((persona) => persona.title).join(' · '),
    },
    {
      id: 'verdict',
      label: '기술 역량 종합 판단',
      source: '평가·외부 인증·개인 기술 적용·인증 트러블슈팅',
      basis: compact(
        Object.values(analysis.verdict.details).flatMap(
          (detail) => detail.evidenceCodes,
        ),
        '직접 기술 근거 확인',
      ),
      flow: '절대 성취와 직접 적용 근거 분리 → 강점·보완·특이 패턴 선택',
      result: `${analysis.verdict.strength} / ${analysis.verdict.gap}`,
    },
    {
      id: 'project',
      label: '프로젝트 분석',
      source: '완료·인증 프로젝트와 본인 수행업무·개인 활용기술',
      basis: compact(projectEvidence, '프로젝트별 직접 근거 확인'),
      flow: '팀 문맥과 개인 근거 분리 → 프로젝트별 스냅샷 → 전체 궤적 종합',
      result: analysis.projects.summary,
    },
    {
      id: 'problem',
      label: '문제해결·협업',
      source: '인증 트러블슈팅과 완료 프로젝트 동료평가',
      basis: compact(problemEvidence, '문제해결·협업 직접 근거 확인'),
      flow: '문제 유형 매핑 → 협업 평가 집계 → 시간순 성장 범위 비교',
      result: `${analysis.problem.collaboration.summary} / ${analysis.problem.growth.summary}`,
    },
    {
      id: 'sentiment',
      label: '상담 감성·키워드',
      source: '민감정보를 마스킹한 상담 기록',
      basis: compact(sentimentEvidence, '상담 시기별 키워드 근거 확인'),
      flow: '과정 기간을 초기·중기·후기로 분할 → 감성 신호 분류 → 키워드 배치',
      result: analysis.sentiment.trend,
    },
    {
      id: 'ontology',
      label: '온톨로지 역량 맵',
      source: '과목·프로젝트·개인 기술·문제해결 방법·도메인',
      basis: compact(ontologyEvidence, '확인된 노드 관계만 표시'),
      flow: '원천 중복 제거 → 근거 노드 생성 → 직접 관계와 프로젝트 문맥 연결',
      result: analysis.ontology.summary,
    },
  ]
}

export function AiAnalysisMethodology({ analysis }: { analysis: AiAnalysis }) {
  const sections = sectionsFor(analysis)
  const [openId, setOpenId] = useState(sections[0].id)

  return (
    <section
      aria-label="AI 분석 산출 근거"
      className="border-border bg-surface rounded-2xl border p-4"
    >
      <div className="mb-3">
        <h3 className="text-fg text-[14px] font-bold">AI 분석 산출 근거</h3>
        <p className="text-fg-subtle mt-1 text-[10px] leading-4">
          표시 문장과 점수는 아래 데이터·판단 근거·계산 흐름을 따라 산출합니다.
          근거가 부족한 항목은 임의 점수로 대체하지 않습니다.
        </p>
      </div>

      <div className="grid gap-2">
        {sections.map((section) => {
          const open = openId === section.id
          return (
            <article
              key={section.id}
              className="border-border overflow-hidden rounded-xl border"
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() =>
                  setOpenId((current) =>
                    current === section.id ? '' : section.id,
                  )
                }
                className="bg-surface-muted/50 flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="text-fg text-[11px] font-bold">
                  {section.label}
                </span>
                <ChevronDown
                  className={cn(
                    'text-fg-subtle size-3.5 transition-transform',
                    open && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>
              {open && (
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  {[
                    ['1. 사용 데이터', section.source],
                    ['2. 판단 근거', section.basis],
                    ['3. 계산 흐름', section.flow],
                    ['4. 결과', section.result],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <b className="text-brand text-[10px]">{label}</b>
                      <p className="text-fg-muted mt-1 text-[10px] leading-4 [overflow-wrap:anywhere]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
