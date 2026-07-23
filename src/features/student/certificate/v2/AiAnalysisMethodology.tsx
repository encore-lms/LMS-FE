import { useMemo, useState } from 'react'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/shared/lib/cn'
import type { AiAnalysis, OntologyKind } from '../ai'

type AnalysisSectionId =
  | 'profile'
  | 'persona'
  | 'verdict'
  | 'project'
  | 'problem'
  | 'sentiment'
  | 'ontology'

interface MethodItem {
  id: string
  label: string
  data: string[]
  basis: string[]
  calculation: string[]
  result: string[]
}

interface MethodSection {
  id: AnalysisSectionId
  label: string
  policyVersion?: string
  items: MethodItem[]
}

const profileDataSource: Record<string, string[]> = {
  업무: [
    '프로젝트 참여 정보',
    '프로젝트 역할 입력',
    '본인 수행업무',
    '개인 활용기술',
    '프로젝트 상호평가 책임감 점수',
    '인증 트러블슈팅',
  ],
  리더십: [
    '프로젝트 역할 입력',
    '본인 수행업무',
    '프로젝트 상호평가 협업·소통 점수',
    '프로젝트 상호평가 코멘트',
    '최종 멘토평가',
  ],
  학습: [
    '성취도 평가 전체 평균',
    'CS 평가 전체 평균',
    '평가 시점별 점수 추이',
    '출석·블로그 제출',
    '과제·스터디·멘토링 가산점',
  ],
  소통: [
    '프로젝트 상호평가 소통·협업 점수',
    '최종 멘토평가 소통',
    '본인 수행업무',
    '프로젝트 상호평가 코멘트',
  ],
  기술: [
    '성취도 평가 전체 평균',
    'CS 평가 전체 평균',
    '외부 인증 코딩테스트',
    '본인 수행업무',
    '개인 활용기술',
    '인증 트러블슈팅',
  ],
}

const profileFormula: Record<string, string[]> = {
  업무: [
    '구조화 = 설계·정리 업무 + 프로젝트 역할·단계 정보',
    '실행·완결 = 완료 프로젝트 수행업무 + 상호평가 책임감',
    '검증·정리 = 인증 트러블슈팅 + 테스트·문서화·검토 업무',
  ],
  리더십: [
    '방향 설정 = 프로젝트 역할·수행업무 + 멘토평가',
    '조율·합의 = 상호평가 협업·소통 + 조율 표현',
    '지원·촉진 = 협업 점수 + 코드리뷰·지원·문서화 표현',
  ],
  학습: [
    '향상도 = 첫·마지막 완료 평가의 절대·상대 변화',
    '숙련유지도 = 같은 범주의 재평가 점수 변화 평균',
    '학습지속성 = 출석·블로그 기본점수 + 과제·스터디·멘토링 가산',
  ],
  소통: [
    '명료성 = 설명 표현 + 프로젝트 상호평가 소통 점수',
    '공유 적시성 = 진행 공유·문서화 표현 + 소통 점수',
    '피드백 = 리뷰·피드백 표현 + 소통 점수',
  ],
  기술: [
    '기초 역량 = 성취도·CS 평가 + 외부 인증 코딩테스트',
    '기술 적용 = 본인 수행업무·개인 활용기술 + 인증 트러블슈팅',
    '운영·배포 = 운영 업무 + 운영 문제 트러블슈팅',
  ],
}

const ontologyLabel: Record<OntologyKind, string> = {
  self: '본인',
  subject: '과목',
  project: '프로젝트',
  domain: '도메인',
  skill: '기술',
  method: '방법론',
}

const ontologySource: Record<OntologyKind, string[]> = {
  self: ['수강생 기본정보', '수강역량증명서 발급 대상자'],
  subject: ['성취도 평가', 'CS 평가'],
  project: ['인증 프로젝트', '프로젝트 참여 정보', '본인 수행업무'],
  domain: ['인증 프로젝트 도메인'],
  skill: ['개인 활용기술', '본인 수행업무', '인증 트러블슈팅 기술 태그'],
  method: ['인증 트러블슈팅 문제 유형', '인증 트러블슈팅 해결 과정'],
}

function compact(items: Array<string | undefined>, max = 5) {
  const values = [...new Set(items.filter((item): item is string => !!item))]
  if (values.length <= max) return values
  return [...values.slice(0, max), `외 ${values.length - max}개 근거`]
}

function profileItems(analysis: AiAnalysis): MethodItem[] {
  return [
    ...analysis.profile.rows.map((row) => ({
      id: row.label,
      label: row.label,
      data: profileDataSource[row.label] ?? ['AI 역량 프로파일링 사용 데이터'],
      basis: [
        `${row.label} 안의 3개 하위 항목을 각각 별도 판정`,
        '사용 데이터가 확인되는 경우에만 칸 수에 반영',
        '데이터가 부족하면 점수를 억지로 만들지 않음',
      ],
      calculation: [
        ...(profileFormula[row.label] ?? [
          '유효 사용 데이터를 하위 차원별로 계산',
        ]),
        '70점 이상 3칸, 45~69점 2칸, 1~44점 1칸, 산출 불가 0칸',
      ],
      result: [
        `${row.label}의 3칸 수준과 유형명을 산출`,
        '실제 점수·근거 문장은 해당 카드의 판단 근거에서 표시',
      ],
    })),
    {
      id: 'profile-summary',
      label: 'PROFILE SUMMARY',
      data: [
        'AI 역량 프로파일링 5개 카드',
        '본인 수행업무',
        '인증 트러블슈팅',
        '프로젝트 상호평가·최종 멘토평가',
      ],
      basis: [
        '산출 완료된 역량 카드 중 서로 다른 화면 데이터를 우선 선택',
        '직접 확인된 근거가 함께 있는 문구만 사용',
      ],
      calculation: ['강한 근거 2~3개 선택 → 같은 의미 중복 제거 → 한 줄 요약'],
      result: [
        'AI 역량 프로파일링 전체를 한 줄로 압축',
        '실제 요약은 PROFILE SUMMARY 판단 근거에서 표시',
      ],
    },
  ]
}

function personaItems(analysis: AiAnalysis): MethodItem[] {
  return analysis.personas.map((persona) => ({
    id: `persona-${persona.rank}`,
    label: `${persona.rank}순위`,
    data: [
      '성취도 평가·CS 평가',
      '외부 인증 코딩테스트',
      '인증 트러블슈팅',
      '본인 수행업무·개인 활용기술',
      '인증 프로젝트 반복 근거',
      '희망직무·관심기술',
    ],
    basis: compact([
      '추천 분야 후보별로 같은 항목을 같은 방식으로 비교',
      '개인 직접 근거와 보강 근거가 함께 있는 후보만 표시',
      ...(persona.limitations ?? []),
    ]),
    calculation: [
      '직무 연관 평가 30% + 트러블슈팅 30% + 수행업무·활용기술 20% + 프로젝트 반복 15% + 관심 정보 5%',
      '직접 근거가 부족한 후보 제외 → 점수순 정렬',
    ],
    result: [
      `${persona.rank}순위 후보와 적합도 점수를 산출`,
      '후보명·점수·설명은 페르소나 판단 근거에서 표시',
    ],
  }))
}

function verdictItems(analysis: AiAnalysis): MethodItem[] {
  return (
    [
      ['strength', '핵심 강점'],
      ['growth', '성장 포인트'],
      ['gap', '보완'],
      ['unique', '특이형'],
    ] as const
  ).map(([key, label]) => {
    return {
      id: key,
      label,
      data: [
        'AI 기술 역량 종합 판단 점수',
        '성취도 평가·CS 평가',
        '본인 수행업무·개인 활용기술',
        '인증 트러블슈팅',
      ],
      basis: compact([
        '기초·적용·운영·문제해결 점수를 함께 확인',
        ...analysis.verdict.limitations,
      ]),
      calculation: [
        key === 'growth'
          ? '완료 평가를 시간순 정렬 → 연속 상승·첫/마지막 차이·카테고리 격차 판정'
          : key === 'gap'
            ? '현재 강점 근거와 보강 가능한 유효 항목을 연결'
            : key === 'unique'
              ? '기술 적용·운영 점수와 과업 집중도·인증 문제 영역 비교'
              : '서로 다른 사용 데이터 2종 이상이 있는 후보를 점수순 선택',
      ],
      result: [
        `${label} 문장을 산출`,
        '실제 판단 문장과 점수는 기술 판단 카드의 판단 근거에서 표시',
      ],
    }
  })
}

function projectItems(analysis: AiAnalysis): MethodItem[] {
  const projects = analysis.projects.projects.map((project) => ({
    id: project.projectId,
    label: `${project.order}차 프로젝트`,
    data: [
      '인증 프로젝트',
      '프로젝트 참여 정보',
      '본인 수행업무',
      '개인 활용기술',
      '프로젝트 상호평가',
      '인증 트러블슈팅',
    ],
    basis: [
      '완료·인증되고 본인 참여가 확인된 프로젝트만 사용',
      '본인 수행업무와 개인 활용기술이 있을 때 개인 기여로 연결',
    ],
    calculation: [
      '본인 수행업무·개인 활용기술 분류 → 상호평가·트러블슈팅을 프로젝트 ID로 교차 확인',
      '프로젝트별 점수나 기여율은 만들지 않음',
    ],
    result: [
      `${project.name}의 개인 기여 요약을 산출`,
      '프로젝트명·기여 문장은 프로젝트 카드 판단 근거에서 표시',
    ],
  }))
  const aggregate: MethodItem[] = [
    {
      id: 'project-summary',
      label: '전체 궤적',
      data: [
        '인증 프로젝트 전체 목록',
        '프로젝트 참여 정보',
        '본인 수행업무',
        '개인 활용기술',
        '프로젝트 상호평가',
        '인증 트러블슈팅',
      ],
      basis: ['프로젝트별 근거에서 공통 수행축·확장·검증 근거를 종합'],
      calculation: [
        '프로젝트별 표시 내용 → 공통·확장·검증 선택 → 서로 다른 프로젝트 근거 교차 확인',
      ],
      result: [
        '프로젝트 전체 궤적 요약을 산출',
        '실제 궤적 문장은 전체 궤적 판단 근거에서 표시',
      ],
    },
    ...analysis.projects.groups.map((group, index) => ({
      id: `project-group-${index}`,
      label: group.label,
      data: [
        '인증 프로젝트',
        '본인 수행업무',
        '개인 활용기술',
        '프로젝트 상호평가',
        '인증 트러블슈팅',
      ],
      basis: [
        '같은 기준으로 연결 가능한 프로젝트만 묶음',
        ...analysis.projects.limitations,
      ],
      calculation: [
        index === 0
          ? '2개 이상 프로젝트에서 반복된 개인 수행업무·활용기술 집계'
          : index === 1
            ? '첫 프로젝트 이후 새로 등장한 수행업무·활용기술 비교'
            : '개인 수행업무·상호평가·트러블슈팅을 프로젝트 ID로 교차 확인',
      ],
      result: [
        `${group.label} 문장을 산출`,
        '실제 프로젝트 묶음과 설명은 판단 근거에서 표시',
      ],
    })),
  ]
  return [...projects, ...aggregate]
}

function problemItems(analysis: AiAnalysis): MethodItem[] {
  return [
    {
      id: 'problem-solving',
      label: '핵심 문제해결 능력',
      data: ['인증 트러블슈팅 본문', '문제 유형', '해결 과정', '해결 결과'],
      basis: [
        '강사 인증이 완료된 트러블슈팅의 상황·해결·결과만 사용',
        ...analysis.problem.limitations,
      ],
      calculation: [
        '반복 해결 행동 추출 → 문제 파악·해결 적용·결과 검증으로 정리 → 원문 밖 내용 차단',
      ],
      result: [
        '핵심 문제해결 능력 유형과 요약 문장을 산출',
        '실제 사례 수·문장 근거는 문제해결 판단 근거에서 표시',
      ],
    },
    {
      id: 'problem-groups',
      label: '많이 다룬 문제·근거 태그',
      data: ['인증 트러블슈팅 문제 유형', '인증 트러블슈팅 기술 태그'],
      basis: [
        '저장된 문제 카테고리와 인증 사례의 기술 태그를 그대로 집계',
        '동률이면 모두 최다 문제로 유지',
      ],
      calculation: [
        '카테고리 건수 = 해당 카테고리 인증 사례 수',
        '태그 건수 = 해당 태그가 연결된 인증 사례 수',
      ],
      result: [
        '많이 다룬 문제 유형과 연결 태그를 산출',
        '실제 문제 유형·태그는 문제해결 판단 근거에서 표시',
      ],
    },
    {
      id: 'collaboration',
      label: '협업 스타일',
      data: [
        '프로젝트 상호평가 태그',
        '프로젝트 상호평가 코멘트',
        '프로젝트 상호평가 협업 점수',
      ],
      basis: [
        '완료 프로젝트의 유효 상호평가만 사용',
        '태그와 코멘트가 같은 협업 행동을 가리킬 때 우선 반영',
        ...analysis.problem.collaboration.limitations,
      ],
      calculation: [
        '동료평가 태그·코멘트 반복 확인 → 관찰 행동만 해석',
        '고정 성격이나 모든 상황의 행동으로 확대하지 않음',
      ],
      result: [
        '협업 스타일 유형과 요약 문장을 산출',
        '실제 태그·코멘트 근거는 협업 판단 근거에서 표시',
      ],
    },
  ]
}

function sentimentItems(analysis: AiAnalysis): MethodItem[] {
  const dates = [
    ...new Set(
      analysis.sentiment.bubbles.flatMap(
        (bubble) => bubble.evidence?.map((item) => item.at) ?? [],
      ),
    ),
  ].sort()
  return dates.map((date, index) => ({
    id: `counsel-${date}`,
    label: `${index + 1}차 상담`,
    data: ['상담 기록', '상담 감성 키워드', '상담 일자', '신호 강도'],
    basis: [
      '상담 날짜와 감성 키워드가 모두 있는 상담만 사용',
      '같은 키워드가 반복되면 신호 강도를 높임',
    ],
    calculation: [
      '상담일 정렬 → 초기·중기·후기 배정 → 근거 문장과 일치하는 키워드 선택',
      '신호 강도를 버블 크기·배치로 변환',
    ],
    result: [
      `${index + 1}차 상담 감성 키워드 버블을 산출`,
      '실제 상담일·키워드·문장은 상담 감성 판단 근거에서 표시',
    ],
  }))
}

function ontologyItems(): MethodItem[] {
  return (Object.keys(ontologyLabel) as OntologyKind[]).map((kind) => ({
    id: `ontology-${kind}`,
    label: ontologyLabel[kind],
    data: ontologySource[kind],
    basis: [
      '근거가 확인된 항목만 표시',
      '중복되거나 직접 연결이 약한 항목은 생략',
    ],
    calculation: [
      '사용 데이터 중복 제거 → 과목·프로젝트·기술·방법론·도메인 관계 묶음',
      '같은 프로젝트에서 확인된 관계만 연결',
    ],
    result: [
      `${ontologyLabel[kind]} 노드와 연결 관계를 산출`,
      '실제 노드명·연결 수는 온톨로지 판단 근거에서 표시',
    ],
  }))
}

function buildSections(analysis: AiAnalysis): MethodSection[] {
  return [
    { id: 'profile', label: '역량 프로파일링', items: profileItems(analysis) },
    { id: 'persona', label: '페르소나 TOP3', items: personaItems(analysis) },
    {
      id: 'verdict',
      label: '기술 판단',
      policyVersion: analysis.verdict.policyVersion,
      items: verdictItems(analysis),
    },
    {
      id: 'project',
      label: '프로젝트',
      policyVersion: analysis.projects.policyVersion,
      items: projectItems(analysis),
    },
    {
      id: 'problem',
      label: '문제해결·협업',
      policyVersion: analysis.problem.policyVersion,
      items: problemItems(analysis),
    },
    {
      id: 'sentiment',
      label: '상담 감성',
      policyVersion: analysis.sentiment.policyVersion,
      items: sentimentItems(analysis),
    },
    {
      id: 'ontology',
      label: '온톨로지',
      policyVersion: analysis.ontology.policyVersion,
      items: ontologyItems(),
    },
  ]
}

function DetailBlock({
  index,
  title,
  items,
}: {
  index: number
  title: string
  items: string[]
}) {
  return (
    <div className="border-divider bg-surface flex min-w-0 flex-col gap-2 rounded-xl border p-3.5">
      <span className="text-brand text-[11px] font-bold">
        {index}. {title}
      </span>
      <ul className="flex flex-col gap-1.5">
        {(items.length > 0 ? items : ['해당 근거 없음']).map((item) => (
          <li
            key={item}
            className="text-fg-muted flex min-w-0 gap-2 text-[11px] leading-5"
          >
            <span
              aria-hidden="true"
              className="bg-brand mt-2 size-1 shrink-0 rounded-full"
            />
            <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AiAnalysisMethodology({ analysis }: { analysis: AiAnalysis }) {
  const sections = useMemo(() => buildSections(analysis), [analysis])
  const [selectedId, setSelectedId] = useState<AnalysisSectionId>('profile')
  const [selectedItemBySection, setSelectedItemBySection] = useState<
    Partial<Record<AnalysisSectionId, string>>
  >({})
  const selectedSection =
    sections.find((section) => section.id === selectedId) ?? sections[0]
  const selectedItemId =
    selectedItemBySection[selectedSection.id] ?? selectedSection.items[0]?.id
  const selectedItem =
    selectedSection.items.find((item) => item.id === selectedItemId) ??
    selectedSection.items[0]

  return (
    <section className="border-brand/20 bg-surface flex flex-col gap-4 rounded-2xl border p-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-fg text-[15px] font-bold">AI 분석 산출 근거</h3>
          <span className="bg-brand/10 text-brand rounded-md px-2 py-0.5 text-[10px] font-bold">
            항목별 추적
          </span>
          {selectedSection.policyVersion && (
            <span className="text-fg-subtle text-[10px]">
              정책 {selectedSection.policyVersion}
            </span>
          )}
        </div>
        <p className="text-fg-muted text-[11px] leading-5">
          항목을 선택하면 공통 사용 데이터부터 결과 산출 방식까지 핵심 흐름만
          표시합니다.
        </p>
      </div>

      <div className="max-w-full overflow-x-auto pb-1">
        <Tabs
          aria-label="AI 분석 산출 근거 영역"
          items={sections.map((section) => ({
            value: section.id,
            label: section.label,
          }))}
          value={selectedSection.id}
          onChange={(value) => setSelectedId(value as AnalysisSectionId)}
        />
      </div>

      <div
        className="flex flex-wrap gap-2"
        aria-label={`${selectedSection.label} 세부 항목`}
      >
        {selectedSection.items.map((item) => {
          const selected = item.id === selectedItem?.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                setSelectedItemBySection((current) => ({
                  ...current,
                  [selectedSection.id]: item.id,
                }))
              }
              className={cn(
                'focus-visible:ring-brand rounded-lg border px-3 py-2 text-[11px] font-bold outline-none focus-visible:ring-2',
                selected
                  ? 'border-brand bg-brand text-white'
                  : 'border-divider bg-surface-muted text-fg-muted hover:text-fg',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {selectedItem ? (
        <div role="tabpanel" className="grid gap-3 lg:grid-cols-2">
          <DetailBlock
            index={1}
            title="사용 데이터"
            items={selectedItem.data}
          />
          <DetailBlock index={2} title="판단 근거" items={selectedItem.basis} />
          <DetailBlock
            index={3}
            title="계산 흐름"
            items={selectedItem.calculation}
          />
          <DetailBlock index={4} title="결과" items={selectedItem.result} />
        </div>
      ) : (
        <p className="text-fg-muted py-4 text-center text-[12px]">
          산출 가능한 항목이 없습니다.
        </p>
      )}
    </section>
  )
}
