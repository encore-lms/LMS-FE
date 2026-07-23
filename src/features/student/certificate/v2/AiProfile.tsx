import { cn } from '@/shared/lib/cn'
import type {
  AiPersona,
  AiProfile as AiProfileData,
  AiProfileConfidence,
  AiProfileLevel,
} from '../ai'
import { AnalysisEvidenceTooltip } from './AnalysisEvidenceTooltip'
import { AiAnalysisPanel } from './AiAnalysisPanel'

const LEVEL_LABEL: Record<AiProfileLevel, string> = {
  HIGH: '높음',
  MID: '보통',
  LOW: '낮음',
  NOT_READY: '산출 전',
}

const CONFIDENCE_LABEL: Record<AiProfileConfidence, string> = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
}

const LEVEL_STEPS: Record<AiProfileLevel, number> = {
  HIGH: 3,
  MID: 2,
  LOW: 1,
  NOT_READY: 0,
}

function DimensionLevel({
  label,
  level,
}: {
  label: string
  level: AiProfileLevel
}) {
  const activeSteps = LEVEL_STEPS[level]

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_42px] items-center gap-2">
      <span className="text-fg-subtle truncate text-[9px]" title={label}>
        {label}
      </span>
      <span
        className="grid grid-cols-3 gap-0.5"
        aria-label={`${label} ${LEVEL_LABEL[level]}`}
      >
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn(
              'h-1.5 rounded-full',
              step <= activeSteps ? 'bg-accent-strong' : 'bg-surface-muted',
            )}
          />
        ))}
      </span>
    </div>
  )
}

function formatPersonaScore(value: number | null | undefined) {
  if (value === null || value === undefined) return '산출 전'
  return Number.isInteger(value) ? `${value}점` : `${value.toFixed(1)}점`
}

function personaCalculation(persona: AiPersona) {
  const components = persona.components
  if (!components) {
    return [
      '직무 연관 성취·CS·코딩테스트 30%',
      '인증 트러블슈팅 30%',
      '본인 수행업무·개인 활용기술 20%',
      '인증 프로젝트 반복 근거 15%',
      '희망직무·관심기술 5%',
    ].join(' + ')
  }
  return [
    `직무 연관 성취·CS·코딩테스트 ${formatPersonaScore(components.roleAchievement)} × 30%`,
    `인증 트러블슈팅 ${formatPersonaScore(components.verifiedProblemSolving)} × 30%`,
    `본인 수행업무·개인 활용기술 ${formatPersonaScore(components.personalContribution)} × 20%`,
    `인증 프로젝트 반복 근거 ${formatPersonaScore(components.crossCheckedProject)} × 15%`,
    `희망직무·관심기술 ${formatPersonaScore(components.declaredInterest)} × 5%`,
  ].join(' + ')
}

function profileDataSourceFor(label: string) {
  if (label === '업무') {
    return '프로젝트 참여 정보, 프로젝트 역할 입력, 본인 수행업무, 프로젝트 상호평가 책임감 점수, 인증 트러블슈팅'
  }
  if (label === '리더십') {
    return '프로젝트 역할 입력, 본인 수행업무, 프로젝트 상호평가 협업·소통 점수, 최종 멘토평가'
  }
  if (label === '학습') {
    return '성취도 평가 전체 평균, CS 평가 전체 평균, 평가 시점별 점수 추이, 출석·블로그 제출, 가산점'
  }
  if (label === '소통') {
    return '프로젝트 상호평가 소통 점수, 프로젝트 상호평가 코멘트, 최종 멘토평가 소통'
  }
  if (label === '기술') {
    return '성취도 평가·CS 평가, 외부 인증 코딩테스트, 본인 수행업무·개인 활용기술, 인증 트러블슈팅'
  }
  return 'AI 역량 프로파일링 사용 데이터'
}

function dimensionStepReason(
  dimension: NonNullable<AiProfileData['rows'][number]['dimensions']>[number],
) {
  if (dimension.level === 'NOT_READY') return '산출할 데이터 없음 → 0칸'
  if (dimension.score == null) {
    return `조건 판정 ${LEVEL_LABEL[dimension.level]} → ${LEVEL_STEPS[dimension.level]}칸`
  }
  const score = formatPersonaScore(dimension.score)
  if (dimension.level === 'HIGH') return `합계 ${score} · 70점 이상 → 3칸`
  if (dimension.level === 'MID') return `합계 ${score} · 45~69점 → 2칸`
  return `합계 ${score} · 45점 미만 → 1칸`
}

function profileCalculationFor(row: AiProfileData['rows'][number]) {
  return row.dimensions?.map((dimension) => {
    const calculation = dimension.calculation?.length
      ? [...dimension.calculation]
      : ['세부 계산값 미제공']
    return {
      key: dimension.key,
      label: dimension.label,
      calculation,
      result: dimensionStepReason(dimension),
    }
  })
}

function compactEvidence(items: string[] | undefined, fallback: string) {
  if (!items?.length) return fallback
  const visible = items.slice(0, 2).join(' · ')
  return items.length > 2 ? `${visible} 외 ${items.length - 2}건` : visible
}

// 증명서 v2 — AI 역량 프로파일링(유형 분류 + 한줄 요약) + 페르소나 TOP 3.
export function AiProfile({
  profile,
  personas,
  className,
}: {
  profile: AiProfileData
  personas: AiPersona[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <AiAnalysisPanel title="AI 역량 프로파일링">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
          {profile.rows.map((r) => (
            <article
              key={r.label}
              data-profile-axis={r.label}
              className="border-border bg-surface relative flex min-w-0 flex-col rounded-xl border p-3.5 shadow-[0px_1px_3px_0px_rgba(18,23,38,0.03)]"
            >
              <div className="flex min-h-5 min-w-0 items-center justify-between gap-1.5">
                <span className="text-accent-strong min-w-0 shrink truncate text-[10px] font-bold tracking-[0.04em]">
                  {r.label}
                </span>
                <div className="flex min-w-0 items-center gap-1">
                  {r.confidence && (
                    <span className="bg-surface-muted text-fg-subtle max-w-[74px] truncate rounded px-1.5 py-0.5 text-[9px] font-semibold sm:max-w-[92px] xl:max-w-[74px]">
                      근거 충분도 {CONFIDENCE_LABEL[r.confidence]}
                    </span>
                  )}
                  {r.evidence && r.evidence.length > 0 && (
                    <AnalysisEvidenceTooltip
                      label={r.label}
                      triggerClassName="size-4"
                    >
                      <span>
                        <b className="text-fg">사용 데이터</b>
                        <br />
                        {profileDataSourceFor(r.label)}
                      </span>
                      <span>
                        <b className="text-fg">판단 근거</b>
                        <br />
                        {compactEvidence(
                          r.evidence,
                          r.description ?? '유효 근거만 반영',
                        )}
                      </span>
                      <span>
                        <b className="text-fg">계산 흐름</b>
                        <br />
                        <span className="mt-1 flex flex-col gap-2">
                          {profileCalculationFor(r)?.map((dimension) => (
                            <span
                              key={dimension.key}
                              className="border-border block border-l-2 pl-2"
                            >
                              <b className="text-fg">{dimension.label}</b>
                              <br />
                              {dimension.calculation.map((item) => (
                                <span key={item} className="block">
                                  {item}
                                </span>
                              ))}
                              <span className="text-fg mt-0.5 block font-semibold">
                                {dimension.result}
                              </span>
                            </span>
                          )) ?? '하위 항목 계산값 미제공'}
                        </span>
                      </span>
                      <span>
                        <b className="text-fg">결과</b>
                        <br />
                        {r.label} · {r.value}
                        {r.confidence
                          ? ` · 근거 충분도 ${CONFIDENCE_LABEL[r.confidence]}`
                          : ''}
                      </span>
                      {r.limitations?.map((item) => (
                        <span
                          key={item}
                          className="border-border border-t pt-2"
                        >
                          제한: {item}
                        </span>
                      ))}
                    </AnalysisEvidenceTooltip>
                  )}
                </div>
              </div>

              <strong className="text-fg mt-2 text-[16px] leading-5">
                {r.value}
              </strong>
              {r.description && (
                <p className="text-fg-muted mt-1.5 line-clamp-2 text-[10px] leading-4">
                  {r.description}
                </p>
              )}

              {r.dimensions && r.dimensions.length > 0 && (
                <div className="border-border mt-3 flex flex-col gap-2 border-t pt-3">
                  <span className="sr-only">
                    {r.dimensions
                      .map(
                        (dimension) =>
                          `${dimension.label} ${LEVEL_LABEL[dimension.level]}`,
                      )
                      .join(' · ')}
                  </span>
                  {r.dimensions.map((dimension) => (
                    <DimensionLevel
                      key={dimension.key}
                      label={dimension.label}
                      level={dimension.level}
                    />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="border-accent/20 bg-surface relative overflow-visible rounded-xl border px-4 py-3.5">
          <span className="bg-accent-strong absolute inset-y-3 left-0 w-0.5 rounded-full" />
          <div className="flex items-center gap-1.5">
            <span className="text-accent-strong text-[10px] font-bold">
              PROFILE SUMMARY
            </span>
            <AnalysisEvidenceTooltip
              label="PROFILE SUMMARY"
              triggerClassName="size-4"
            >
              <span>
                <b className="text-fg">사용 데이터</b>
                <br />
                AI 역량 프로파일링 5개 카드, 본인 수행업무, 인증 트러블슈팅,
                프로젝트 상호평가·최종 멘토평가
              </span>
              <span>
                <b className="text-fg">판단 근거</b>
                <br />
                강점이 반복 확인된 카드와 서로 다른 데이터의 공통 근거를 우선
                반영
              </span>
              <span>
                <b className="text-fg">계산 흐름</b>
                <br />
                강한 근거 2~3개 선택 → 의미 중복 제거 → 한 줄 요약으로 압축
              </span>
              <span>
                <b className="text-fg">결과</b>
                <br />
                {profile.summary}
              </span>
            </AnalysisEvidenceTooltip>
          </div>
          <p className="text-fg mt-1 text-[13px] leading-5 font-semibold">
            {profile.summary}
          </p>
        </div>
      </AiAnalysisPanel>

      {personas.length > 0 && (
        <AiAnalysisPanel title="AI 페르소나 TOP 3">
          <div className="flex flex-col gap-2">
            {personas.map((p) => (
              <div
                key={p.rank}
                className={cn(
                  'flex items-center gap-3 rounded-lg p-3',
                  p.rank === 1 ? 'bg-accent-strong text-white' : 'bg-surface',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-md text-[12px] font-bold',
                    p.rank === 1
                      ? 'bg-white/20 text-white'
                      : 'bg-accent-bg text-accent-strong',
                  )}
                >
                  #{p.rank}
                </span>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span
                    className={cn(
                      'min-w-0 text-[13px] leading-5 font-bold',
                      p.rank === 1 ? 'text-white' : 'text-fg',
                    )}
                  >
                    {p.title}
                  </span>
                  {p.confidence && (
                    <span
                      className={cn(
                        'shrink-0 text-[10px]',
                        p.rank === 1 ? 'text-white/75' : 'text-fg-subtle',
                      )}
                    >
                      근거 충분도 {CONFIDENCE_LABEL[p.confidence]}
                    </span>
                  )}
                </div>
                <AnalysisEvidenceTooltip
                  label={`${p.rank}순위 판단 근거`}
                  ariaLabel={`${p.rank}순위 페르소나 추천 근거 보기`}
                  className="ml-auto"
                  triggerClassName={
                    p.rank === 1 ? 'text-white/80' : 'text-fg-subtle'
                  }
                >
                  <span>
                    <b className="text-fg">사용 데이터</b>
                    <br />
                    성취도 평가·CS 평가, 외부 인증 코딩테스트, 인증 트러블슈팅,
                    본인 수행업무·개인 활용기술, 희망직무·관심기술
                  </span>
                  <span>
                    <b className="text-fg">판단 근거</b>
                    <br />
                    {p.subtitle}
                  </span>
                  <span>
                    <b className="text-fg">계산 흐름</b>
                    <br />
                    {personaCalculation(p)}
                  </span>
                  <span>
                    <b className="text-fg">결과</b>
                    <br />
                    {p.title} · 적합도 {formatPersonaScore(p.fitScore)}
                  </span>
                  {p.limitations?.map((item) => (
                    <span key={item} className="border-border border-t pt-2">
                      제한: {item}
                    </span>
                  ))}
                </AnalysisEvidenceTooltip>
              </div>
            ))}
          </div>
        </AiAnalysisPanel>
      )}
    </div>
  )
}
