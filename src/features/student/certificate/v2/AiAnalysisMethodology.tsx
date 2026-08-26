import { useState, type KeyboardEvent } from 'react'
import { ArrowRight, Database, GitBranch, Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { CertificateAiAnalysis } from '../analysis'

type MethodTone = 'accent' | 'info' | 'brown'
type MethodKey = 'job-fit' | 'project' | 'troubleshooting'

interface DataGroup {
  source: string
  items: string[]
}

interface MethodStep {
  label: string
  description: string
}

interface OutputDefinition {
  label: string
  description: string
}

const TONE_STYLE: Record<
  MethodTone,
  { border: string; background: string; text: string; badge: string }
> = {
  accent: {
    border: 'border-accent/25',
    background: 'bg-accent-bg/25',
    text: 'text-accent-strong',
    badge: 'bg-accent-strong text-on-color',
  },
  info: {
    border: 'border-info/25',
    background: 'bg-info-bg/25',
    text: 'text-info',
    badge: 'bg-info text-on-color',
  },
  brown: {
    border: 'border-brown/25',
    background: 'bg-surface',
    text: 'text-brown',
    badge: 'bg-brown text-on-color',
  },
}

function MethodCard({
  tabKey,
  active,
  index,
  title,
  summary,
  tone,
  dataGroups,
  steps,
  outputs,
  ruleNote,
}: {
  tabKey: MethodKey
  active: boolean
  index: string
  title: string
  summary: string
  tone: MethodTone
  dataGroups: DataGroup[]
  steps: MethodStep[]
  outputs: OutputDefinition[]
  ruleNote: string
}) {
  const toneStyle = TONE_STYLE[tone]

  return (
    <article
      id={`analysis-method-panel-${tabKey}`}
      role="tabpanel"
      aria-labelledby={`analysis-method-tab-${tabKey}`}
      hidden={!active}
      data-analysis-method={title}
      className={cn(
        'bg-surface overflow-hidden rounded-2xl border',
        toneStyle.border,
      )}
    >
      <header
        className={cn(
          'flex items-start gap-3 border-b px-4 py-4 sm:px-5',
          toneStyle.border,
          toneStyle.background,
        )}
      >
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold',
            toneStyle.badge,
          )}
        >
          {index}
        </span>
        <div>
          <h3 className="text-fg text-[16px] leading-6 font-bold">{title}</h3>
          <p className="text-fg-muted mt-0.5 text-[13px] leading-5">
            {summary}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <section>
          <div className="flex items-center gap-2">
            <Database
              className={cn('size-4', toneStyle.text)}
              aria-hidden="true"
            />
            <h4 className="text-fg text-[13px] font-bold">사용 데이터</h4>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {dataGroups.map((group) => (
              <div
                key={group.source}
                className="border-border bg-surface-muted rounded-xl border px-3.5 py-3"
              >
                <span className={cn('text-[12px] font-bold', toneStyle.text)}>
                  {group.source}
                </span>
                <ul className="text-fg-muted mt-1.5 flex flex-col gap-1 text-[12px] leading-5">
                  {group.items.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <GitBranch
              className={cn('size-4', toneStyle.text)}
              aria-hidden="true"
            />
            <h4 className="text-fg text-[13px] font-bold">분석 방식</h4>
          </div>
          <ol className="mt-3 grid gap-2 lg:grid-cols-4">
            {steps.map((step, stepIndex) => (
              <li key={step.label} className="relative flex min-w-0 gap-2">
                <div className="border-border bg-surface-muted min-w-0 flex-1 rounded-xl border px-3.5 py-3">
                  <span className={cn('text-[11px] font-bold', toneStyle.text)}>
                    STEP {stepIndex + 1}
                  </span>
                  <strong className="text-fg mt-0.5 block text-[13px] font-bold">
                    {step.label}
                  </strong>
                  <p className="text-fg-muted mt-1 text-[12px] leading-5">
                    {step.description}
                  </p>
                </div>
                {stepIndex < steps.length - 1 && (
                  <ArrowRight
                    className={cn(
                      'mt-10 hidden size-4 shrink-0 lg:block',
                      toneStyle.text,
                    )}
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <Sparkles
              className={cn('size-4', toneStyle.text)}
              aria-hidden="true"
            />
            <h4 className="text-fg text-[13px] font-bold">산출 결과</h4>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {outputs.map((output) => (
              <div
                key={output.label}
                className={cn(
                  'rounded-xl border px-3.5 py-3',
                  toneStyle.border,
                  toneStyle.background,
                )}
              >
                <strong className="text-fg text-[13px] font-bold">
                  {output.label}
                </strong>
                <p className="text-fg-muted mt-1 text-[12px] leading-5">
                  {output.description}
                </p>
              </div>
            ))}
          </div>
          <p className="border-border text-fg-muted mt-3 border-t pt-3 text-[11px] leading-5">
            {ruleNote}
          </p>
        </section>
      </div>
    </article>
  )
}

export function AiAnalysisMethodology({
  analysis,
}: {
  analysis: CertificateAiAnalysis
}) {
  void analysis
  const [selectedKey, setSelectedKey] = useState<MethodKey>('job-fit')
  const tabs: Array<{ key: MethodKey; label: string; tone: MethodTone }> = [
    { key: 'job-fit', label: '직무 적합도', tone: 'accent' },
    { key: 'project', label: '프로젝트 분석', tone: 'info' },
    { key: 'troubleshooting', label: '문제해결 역량 분석', tone: 'brown' },
  ]

  const selectByKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | undefined
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % tabs.length
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    }
    if (nextIndex === undefined) return

    event.preventDefault()
    const nextKey = tabs[nextIndex].key
    setSelectedKey(nextKey)
    document.getElementById(`analysis-method-tab-${nextKey}`)?.focus()
  }

  return (
    <section className="border-accent/20 bg-accent-bg/20 rounded-2xl border p-4 sm:p-5">
      <h2 className="text-fg text-[17px] font-bold">AI 분석 기준</h2>
      <p className="text-fg-muted mt-1 max-w-4xl text-[13px] leading-5">
        현재 결과값이 아니라, 각 분석이 어떤 데이터를 어떤 흐름으로 처리해
        라벨·순위·요약을 만드는지 설명합니다. 실제 판단 근거는 분석 결과 옆
        <strong className="text-fg mx-1">!</strong>에서 확인할 수 있습니다.
      </p>

      <div
        role="tablist"
        aria-label="AI 분석 기준 항목"
        className="border-border bg-surface-muted mt-4 grid gap-2 rounded-xl border p-2 sm:grid-cols-3"
      >
        {tabs.map((tab, index) => {
          const active = tab.key === selectedKey
          const toneStyle = TONE_STYLE[tab.tone]

          return (
            <button
              key={tab.key}
              id={`analysis-method-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`analysis-method-panel-${tab.key}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelectedKey(tab.key)}
              onKeyDown={(event) => selectByKeyboard(event, index)}
              className={cn(
                'focus-visible:ring-brand rounded-lg border px-3 py-2.5 text-[13px] font-bold transition-colors outline-none focus-visible:ring-2',
                active
                  ? cn(toneStyle.border, toneStyle.background, toneStyle.text)
                  : 'bg-surface text-fg-muted hover:bg-surface-muted border-transparent',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <MethodCard
          tabKey="job-fit"
          active={selectedKey === 'job-fit'}
          index="01"
          title="직무 적합도"
          summary="프로필·프로젝트·평가·자격증 신호를 고정 직무군에 연결해 후보와 점수를 산정합니다."
          tone="accent"
          dataGroups={[
            {
              source: '프로필',
              items: ['관심 직무', '기술 태그'],
            },
            {
              source: '프로젝트',
              items: [
                '인증 프로젝트 도메인',
                '담당 역할·업무',
                '개인 수행이 확인된 결과',
              ],
            },
            {
              source: '퀴즈·평가',
              items: ['성취도 평가 카테고리·점수', 'CS 평가 카테고리·점수'],
            },
            {
              source: '자격증',
              items: ['승인 완료 자격증만 사용'],
            },
            {
              source: '인증 문제해결 기록',
              items: [
                '반복 해결 영역·기술',
                '독립·협업 해결 경향',
                '검증 결과',
              ],
            },
          ]}
          steps={[
            {
              label: '직무군 매핑',
              description:
                '모든 신호를 백엔드·프론트엔드·풀스택·데이터 엔지니어·데이터 분석·ML/AI·DevOps/인프라 7개 직무군에 연결합니다.',
            },
            {
              label: '근거별 연관도 계산',
              description:
                '프로필·평가·자격증·프로젝트 수행·문제해결 신호를 직무별로 비교하고, 같은 방향이 서로 다른 출처에서 반복되는지 확인합니다.',
            },
            {
              label: '점수·신뢰도 분리',
              description:
                '직무 관련성과 수행 검증의 일치 정도를 0~100점으로 보정하고, 출처 수와 검증 수준은 별도의 근거 충분도·신뢰도로 관리합니다.',
            },
            {
              label: 'TOP3 선정',
              description:
                '서로 다른 출처 2종 이상과 평가·자격증 중 검증 근거 1종 이상이 있는 후보를 점수순으로 정렬합니다.',
            },
          ]}
          outputs={[
            {
              label: '직무 후보 TOP3',
              description:
                '직무 점수 내림차순으로 최대 3개를 표시합니다. 동점이면 검증 근거 연관도 → 출처 다양성 → 관심 직무 일치 순으로 정렬합니다.',
            },
            {
              label: '직무 적합도 점수',
              description:
                '기술·이론·자격·프로젝트·문제해결 신호의 직무 관련도를 종합한 뒤, 여러 출처에서 반복되고 수행 결과로 검증된 신호를 높게 보정합니다.',
            },
            {
              label: '개발자 유형',
              description:
                '가장 강하게 겹친 기술 태그·평가 카테고리·자격증 조합을 유형 라벨로 만듭니다.',
            },
            {
              label: '핵심 강점',
              description:
                '서로 다른 출처에서 두 번 이상 반복된 직무 관련 신호를 강점 문장으로 요약합니다.',
            },
            {
              label: '관련 이론 이해도',
              description:
                '선택 직무와 연결된 성취도·CS 평가 카테고리 점수를 카테고리별 반영 비중으로 가중 평균합니다.',
            },
          ]}
          ruleNote="관심 직무는 보조 지표이며 미선택해도 불이익이 없습니다. 프로젝트 도메인과 기존 AI 요약은 맥락·교차 검증에만 사용하고 같은 원천 신호를 점수에 중복 반영하지 않습니다."
        />

        <MethodCard
          tabKey="project"
          active={selectedKey === 'project'}
          index="02"
          title="프로젝트 분석"
          summary="전체 프로젝트에서 반복된 역할·업무·기여와 동료평가를 묶어 수행 스타일과 성장 범위를 분석합니다."
          tone="info"
          dataGroups={[
            {
              source: '프로젝트 보드',
              items: ['전체 업무 수', '본인 담당 업무', '담당 업무 완료 상태'],
            },
            {
              source: '본인 작성 상호평가',
              items: ['맡은 업무', '본인이 설명한 기여 내용'],
            },
            {
              source: '프로젝트 역할',
              items: ['프로젝트별 담당 역할', '담당 기술·업무·산출물'],
            },
            {
              source: '동료평가',
              items: [
                '기술/기술기여',
                '소통·협업·팀워크',
                '문제해결',
                '책임감',
              ],
            },
            {
              source: '기존 프로젝트 기록',
              items: [
                '도메인·범위·기술 스택',
                '인증 결과·문제해결 사례',
                '기존 역할·문제·판단·결과 해석',
              ],
            },
          ]}
          steps={[
            {
              label: '유효 프로젝트 확정',
              description:
                '완료·인증된 프로젝트만 포함하고 보드 담당자, 본인 작성 내용, 역할, 기존 프로젝트 기록을 프로젝트 ID로 연결합니다.',
            },
            {
              label: '역할·업무 반복 집계',
              description:
                '프로젝트 수와 담당 업무 수를 함께 비교해 주 역할과 반복해서 맡은 업무를 찾습니다.',
            },
            {
              label: '기여·4축 집계',
              description:
                '담당 업무/전체 업무와 담당 완료율을 계산하고, 동료 4축은 프로젝트별 유효 평가자 평균을 다시 동일 가중 평균합니다.',
            },
            {
              label: '성장·확장 비교',
              description:
                '프로젝트 순서에 따라 역할 범위와 담당 업무 종류가 새롭게 늘거나 깊어진 부분을 비교합니다.',
            },
          ]}
          outputs={[
            {
              label: 'AI 전체 요약',
              description:
                '전체 프로젝트에서 반복된 역할·업무·기여·동료평가 신호를 2~3문장으로 요약합니다.',
            },
            {
              label: '주로 맡은 역할·업무',
              description:
                '가장 많은 프로젝트에서 반복된 역할과 담당 업무를 우선 표시합니다.',
            },
            {
              label: '프로젝트 기여',
              description:
                '전체 보드 중 담당 업무 수와 담당 업무 완료율을 함께 보여주고 본인 작성 기여 내용으로 맥락을 보완합니다.',
            },
            {
              label: '동료평가 4축 유형',
              description:
                '각 축 평균과 본인 기여 내용을 함께 읽어 기술 주도형·조율형·검증형·완결형처럼 축별 수행 스타일을 라벨링합니다.',
            },
            {
              label: '프로젝트별 성장·확장',
              description:
                '이전 프로젝트보다 역할 범위·업무 종류·책임 범위가 새롭게 늘어난 부분을 프로젝트별로 설명합니다.',
            },
            {
              label: '핵심 강점',
              description:
                '보드·본인 작성 내용·동료평가 중 두 출처 이상에서 함께 확인된 신호만 강점으로 요약합니다.',
            },
          ]}
          ruleNote="동료평가만 사용합니다. 멘토·강사·운영 평가는 프로젝트 스타일 계산과 근거에서 모두 제외합니다. 기존 AI 해석은 원천 수행 기록과 일치하는지 확인하는 용도로만 사용하며 임의의 프로젝트 종합점수는 만들지 않습니다."
        />

        <MethodCard
          tabKey="troubleshooting"
          active={selectedKey === 'troubleshooting'}
          index="03"
          title="문제해결 역량 분석"
          summary="인증 문제해결 기록의 내용·기간·해결 방식을 연결해 반복 패턴과 확장 방향을 분석합니다."
          tone="brown"
          dataGroups={[
            {
              source: '문제해결 분류',
              items: ['문제해결 카테고리'],
            },
            {
              source: '본문 내용',
              items: ['문제 상황 요약', '해결 과정 요약', '결과 및 검증 요약'],
            },
            {
              source: '해결 기간',
              items: ['사례별 소요일'],
            },
            {
              source: '해결 방식',
              items: ['독립 해결 여부', '협업·지원 활용 여부'],
            },
            {
              source: '기존 인증 분석 기록',
              items: [
                '인증 사례 수·분석 기간',
                '문제 영역·기술 태그',
                '검증 수치·성장 영역',
              ],
            },
          ]}
          steps={[
            {
              label: '유효 사례 확정',
              description:
                '인증되고 상황·해결·결과가 모두 있는 사례만 포함하며, 기존 인증 분석 기록과 연결해 개인·보안 정보를 제외한 핵심 내용을 분석합니다.',
            },
            {
              label: '행동 패턴 추출',
              description:
                '상황에서 문제 구조화, 해결에서 적용 행동, 결과에서 검증 행동을 각각 추출합니다.',
            },
            {
              label: '빈도·기간·방식 집계',
              description:
                '카테고리 빈도, 중앙·평균 소요일, 독립 해결 비율과 협업 활용 분포를 계산합니다.',
            },
            {
              label: '성향·확장 라벨링',
              description:
                '반복 패턴과 시점별 새 카테고리·기술을 비교해 해결 성향, 강점 영역, 확장 범위를 라벨링합니다.',
            },
          ]}
          outputs={[
            {
              label: 'AI가 읽은 문제해결 성향',
              description:
                '독립 해결 70% 이상은 독립 주도형, 40~69%는 균형형, 40% 미만은 협업 해결형으로 분류하고 내용 패턴으로 설명합니다.',
            },
            {
              label: '문제 구조화·해결 적용·결과 검증',
              description:
                '상황·해결·결과에서 반복된 행동을 세 단계의 해결 패턴으로 각각 요약합니다.',
            },
            {
              label: '가장 선명한 해결 영역',
              description:
                '인증 사례가 가장 많이 반복된 카테고리를 선택하고, 동률이면 확인 가능한 결과가 다양한 영역을 우선합니다.',
            },
            {
              label: '해결 소요일 특성',
              description:
                '평균은 전체 부담을, 중앙값은 보통 걸리는 기간을 설명하며 둘의 차이가 크면 장기 사례 영향을 함께 표시합니다.',
            },
            {
              label: '확장되는 문제해결 범위',
              description:
                '최근 사례에서 처음 등장한 카테고리·도메인·기술을 기존 반복 영역과 구분해 확장으로 설명합니다.',
            },
          ]}
          ruleNote="문제해결 기록 개수만으로 역량 점수를 만들지 않습니다. 사례 내용과 검증 결과가 없는 기록은 패턴 근거에서 제외합니다. 기존 분류·요약은 원천 사례와 교차 검증하고, 화면에는 문제 상황·해결 과정·결과를 이해할 수 있는 핵심 요약을 근거로 제공합니다."
        />
      </div>
    </section>
  )
}
