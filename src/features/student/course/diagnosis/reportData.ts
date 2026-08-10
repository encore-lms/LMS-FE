import type {
  DiagnosisConfidence,
  DiagnosisLevel,
  StudentDiagnosis,
  StudentMetrics,
  WeeklyDiagnosisReport,
} from './types'

// 진단 리포트 mock 데이터 — 24주(2026-02-25 ~ 2026-08-05, 수요일 기준).
// 20주차(2026-07-08)는 LLM 수준 진단 PoV v0.1 산출 원문을 그대로 싣고,
// 나머지 주차는 학생별 주간 지표 테이블(ROWS)에서 파생 지표·서술을 생성한다.
// 파생 규칙: error_per_run=에러/실행, hint_per_active_day=힌트/활동일,
// top_error_types=에러 총량 × 학생별 유형 비율(20주차 원문 수치와 일치하도록 역산한 비율).

export const TOTAL_WEEKS = 24

/** 1주차 분석 기준일 (UTC) — 20주차가 2026-07-08이 되는 기준 */
const WEEK1_UTC = Date.UTC(2026, 1, 25)

export function weekBaseDate(week: number): string {
  return new Date(WEEK1_UTC + (week - 1) * 7 * 86_400_000)
    .toISOString()
    .slice(0, 10)
}

/** [완료단계, 현재단계, 활동일, 정체일, 미접속일, 에러, 실행, 힌트, 재시도평균분, 재시도최대분] */
type Row = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

const KIM_ROWS: Row[] = [
  [0, 1, 12, 1, 0, 38, 52, 22, 44.0, 86.0],
  [0, 1, 13, 2, 1, 41, 55, 25, 46.5, 90.0],
  [1, 1, 12, 1, 0, 43, 56, 26, 45.2, 92.0],
  [1, 2, 13, 2, 1, 44, 57, 27, 48.0, 95.0],
  [1, 2, 12, 3, 2, 45, 58, 28, 51.4, 101.0],
  [2, 2, 13, 1, 0, 44, 56, 27, 49.8, 97.0],
  [2, 2, 12, 2, 1, 46, 58, 29, 53.1, 108.0],
  [2, 3, 12, 1, 0, 45, 57, 28, 52.6, 104.0],
  [2, 3, 11, 4, 2, 47, 59, 30, 56.9, 112.0],
  [3, 3, 12, 1, 0, 46, 58, 29, 54.2, 109.0],
  [3, 3, 12, 3, 1, 47, 59, 30, 58.4, 117.0],
  [3, 3, 11, 5, 2, 48, 60, 31, 61.7, 121.0],
  [3, 3, 11, 6, 3, 48, 60, 31, 63.2, 124.0],
  [3, 3, 11, 7, 4, 49, 61, 32, 64.8, 126.0],
  [3, 3, 10, 5, 3, 47, 58, 30, 62.1, 119.0],
  [3, 3, 10, 6, 4, 48, 59, 31, 64.5, 122.0],
  [3, 3, 10, 7, 5, 48, 59, 31, 66.0, 125.0],
  [3, 3, 11, 5, 3, 47, 58, 30, 63.3, 120.0],
  [3, 3, 11, 6, 5, 48, 59, 31, 65.4, 127.0],
  [3, 3, 11, 7, 7, 49, 60, 32, 67.9, 129.0],
  [3, 3, 9, 9, 9, 46, 56, 29, 69.2, 131.0],
  [3, 4, 8, 2, 1, 40, 52, 24, 58.6, 110.0],
  [4, 4, 9, 3, 1, 38, 50, 21, 52.3, 102.0],
  [4, 5, 10, 2, 0, 35, 48, 19, 47.8, 96.0],
]

const LEE_ROWS: Row[] = [
  [0, 1, 14, 1, 1, 40, 52, 30, 38.0, 74.0],
  [1, 1, 15, 2, 0, 41, 53, 31, 36.4, 70.0],
  [1, 2, 15, 1, 1, 40, 52, 30, 35.1, 68.0],
  [2, 2, 16, 1, 0, 39, 52, 28, 33.8, 66.0],
  [2, 3, 16, 2, 1, 38, 51, 27, 32.5, 64.0],
  [3, 3, 16, 1, 0, 38, 51, 26, 31.9, 62.0],
  [3, 4, 17, 1, 1, 37, 51, 25, 30.6, 60.0],
  [3, 4, 17, 2, 0, 37, 50, 24, 29.8, 59.0],
  [4, 4, 17, 1, 0, 36, 50, 23, 28.9, 58.0],
  [4, 5, 18, 1, 1, 36, 51, 22, 28.1, 57.0],
  [4, 5, 18, 2, 0, 35, 51, 22, 27.4, 56.0],
  [5, 5, 18, 1, 0, 35, 51, 21, 26.6, 55.0],
  [5, 6, 18, 1, 1, 34, 51, 21, 25.9, 54.0],
  [5, 6, 17, 2, 0, 34, 51, 20, 25.2, 54.0],
  [6, 6, 17, 1, 0, 34, 51, 20, 24.6, 53.0],
  [6, 7, 18, 1, 1, 34, 51, 19, 24.1, 53.0],
  [6, 7, 18, 2, 0, 33, 51, 19, 23.7, 52.0],
  [6, 7, 18, 3, 1, 33, 51, 19, 23.4, 52.0],
  [6, 7, 18, 4, 0, 33, 51, 18, 23.1, 51.0],
  [6, 7, 18, 5, 0, 33, 51, 18, 22.8, 51.0],
  [6, 7, 18, 6, 1, 32, 50, 17, 22.4, 50.0],
  [7, 7, 19, 1, 0, 31, 50, 16, 21.8, 49.0],
  [7, 8, 19, 2, 0, 30, 49, 15, 21.2, 48.0],
  [8, 8, 19, 1, 0, 29, 49, 14, 20.6, 47.0],
]

const PARK_ROWS: Row[] = [
  [1, 2, 13, 1, 0, 12, 26, 14, 24.0, 44.0],
  [2, 2, 14, 1, 1, 11, 25, 13, 23.2, 42.0],
  [2, 3, 14, 1, 0, 11, 25, 13, 22.5, 40.0],
  [3, 4, 15, 1, 0, 10, 24, 12, 21.9, 38.0],
  [4, 4, 15, 1, 1, 10, 24, 12, 21.2, 37.0],
  [4, 5, 15, 1, 0, 9, 23, 11, 20.8, 36.0],
  [5, 6, 16, 1, 0, 9, 23, 11, 20.3, 35.0],
  [6, 6, 16, 1, 1, 8, 22, 10, 19.9, 34.0],
  [6, 7, 16, 1, 0, 8, 22, 10, 19.6, 33.0],
  [7, 8, 15, 1, 0, 8, 21, 10, 19.4, 32.0],
  [8, 8, 15, 1, 1, 7, 21, 9, 19.2, 31.0],
  [8, 9, 15, 1, 0, 7, 20, 9, 19.0, 30.0],
  [9, 10, 15, 1, 0, 6, 19, 9, 18.9, 29.0],
  [10, 10, 15, 0, 0, 6, 19, 8, 18.8, 29.0],
  [10, 10, 14, 3, 2, 6, 18, 8, 18.7, 28.0],
  [10, 10, 14, 5, 4, 5, 18, 8, 18.6, 28.0],
  [10, 10, 13, 7, 7, 5, 18, 8, 18.5, 28.0],
  [10, 10, 13, 9, 9, 5, 17, 8, 18.5, 27.0],
  [10, 10, 12, 11, 11, 5, 17, 8, 18.4, 27.0],
  [10, 10, 12, 14, 14, 5, 17, 8, 18.4, 27.0],
  [10, 10, 12, 16, 2, 5, 17, 8, 18.4, 27.0],
  [10, 10, 13, 0, 0, 6, 19, 8, 18.6, 28.0],
  [10, 10, 13, 0, 1, 6, 20, 9, 18.8, 29.0],
  [10, 10, 14, 0, 0, 7, 21, 9, 19.0, 30.0],
]

interface StudentDef {
  name: string
  rows: Row[]
  /** 에러 총량 대비 유형별 비율 — 20주차 원문 top_error_types를 재현하는 값 */
  errorMix: { type: string; ratio: number }[]
  levelAt: (week: number) => DiagnosisLevel
  confidenceAt: (week: number) => DiagnosisConfidence
}

const STUDENTS: StudentDef[] = [
  {
    name: '김민준',
    rows: KIM_ROWS,
    errorMix: [
      { type: 'IndentationError', ratio: 0.33 },
      { type: 'TypeError', ratio: 0.22 },
      { type: 'NameError', ratio: 0.22 },
    ],
    levelAt: (w) => (w <= 4 ? '입문' : '초급'),
    confidenceAt: (w) => (w <= 8 ? '중간' : '높음'),
  },
  {
    name: '이서연',
    rows: LEE_ROWS,
    errorMix: [
      { type: 'TypeError', ratio: 0.4 },
      { type: 'ValueError', ratio: 0.36 },
      { type: 'IndexError', ratio: 0.24 },
    ],
    levelAt: (w) => (w <= 7 ? '초급' : '중급'),
    confidenceAt: (w) => (w <= 21 ? '중간' : '높음'),
  },
  {
    name: '박지훈',
    rows: PARK_ROWS,
    errorMix: [
      { type: 'KeyError', ratio: 0.6 },
      { type: 'ValueError', ratio: 0.4 },
    ],
    levelAt: (w) => (w <= 5 ? '중급' : '해결사'),
    confidenceAt: (w) => (w <= 13 ? '높음' : '중간'),
  },
]

const round2 = (n: number) => Math.round(n * 100) / 100

function metricsOf(def: StudentDef, week: number): StudentMetrics {
  const [
    stepsCompleted,
    currentStep,
    activeDays,
    stalledDays,
    daysSinceLastActivity,
    errorRuns,
    totalRuns,
    hintTotal,
    retryGapAvgMin,
    retryGapMaxMin,
  ] = def.rows[week - 1]
  return {
    stepsCompleted,
    totalSteps: 10,
    currentStep,
    activeDays,
    stalledDays,
    daysSinceLastActivity,
    errorRuns,
    totalRuns,
    errorPerRun: round2(errorRuns / totalRuns),
    hintTotal,
    hintPerActiveDay: round2(hintTotal / activeDays),
    retryGapAvgMin,
    retryGapMaxMin,
    topErrors: def.errorMix.map(({ type, ratio }) => ({
      type,
      count: Math.round(errorRuns * ratio),
    })),
  }
}

// --- 생성 주차(20주차 외) 서술 템플릿 -------------------------------------

function riskSignalsOf(m: StudentMetrics): string[] {
  const signals: string[] = []
  if (m.daysSinceLastActivity >= 5) {
    signals.push(
      `days_since_last_activity=${m.daysSinceLastActivity}일로 5일 이상 미접속 기준 충족`,
    )
  }
  if (m.stalledDays >= 7) {
    signals.push(
      m.stepsCompleted === m.totalSteps
        ? `stalled_days_on_current_step=${m.stalledDays}일이지만 최종 단계 완주 상태라 신규 단계 미배정으로 인한 정체 가능성 — 원인 확인 필요`
        : `stalled_days_on_current_step=${m.stalledDays}일로 1주 이상 정체 상태`,
    )
  }
  return signals
}

function basisOf(level: DiagnosisLevel, m: StudentMetrics): string {
  const epr = m.errorPerRun.toFixed(2)
  const hpd = m.hintPerActiveDay.toFixed(2)
  switch (level) {
    case '입문':
      return `과정 초반으로 누적 데이터가 적어(실행 ${m.totalRuns}회·활동일 ${m.activeDays}일) 판정 근거가 제한적이며, 기초 문법 단계(현재 ${m.currentStep}단계)를 진행 중입니다. error_per_run=${epr}·hint_per_active_day=${hpd}로 초기 적응 구간의 전형적 분포입니다.`
    case '초급':
      return `steps_completed=${m.stepsCompleted}, current_step=${m.currentStep}, stalled_days_on_current_step=${m.stalledDays}일이며, hint_per_active_day=${hpd}(활동일당 2회 이상 기준)과 error_per_run=${epr}(0.5 이상)로 힌트 의존도와 에러 빈도가 초급 기준에 부합합니다. avg_retry_gap_min=${m.retryGapAvgMin.toFixed(1)}분으로 재시도 간격이 기준(30분)을 초과합니다.`
    case '중급':
      return `error_per_run=${epr}·hint_per_active_day=${hpd}로 초급 기준을 벗어났고, 에러 후 재시도 간격 평균 ${m.retryGapAvgMin.toFixed(1)}분으로 원인을 스스로 좁혀가는 재시도 패턴이 확인되어 중급으로 판정합니다. 다만 동일 유형 에러 반복이 남아 있어 상위 등급 판정은 보류합니다.`
    case '해결사':
      return `steps_completed=${m.stepsCompleted}/${m.totalSteps}과 error_per_run=${epr}(<0.5 기준)로 해결사의 정량 기준을 충족하며, 문법 확인을 넘어선 설계 지향 질문이 대화에서 관찰됩니다.`
  }
}

function weakPatternsOf(level: DiagnosisLevel, m: StudentMetrics): string[] {
  if (level === '해결사') return []
  const [first, ...rest] = m.topErrors
  const patterns = [
    `${first.type} 반복 (top_error_types에서 ${first.count}회로 최다)`,
  ]
  if (rest.length > 0) {
    patterns.push(
      `${rest.map((e) => `${e.type}(${e.count}회)`).join(', ')} 등 동일 유형 에러가 반복적으로 발생`,
    )
  }
  if (m.stalledDays >= 5 && m.stepsCompleted < m.totalSteps) {
    patterns.push(
      `현재 단계(step ${m.currentStep})에서 ${m.stalledDays}일간 정체 중`,
    )
  }
  if (level === '초급' && m.hintPerActiveDay >= 2) {
    patterns.push(
      '힌트 없이 스스로 원인 분석하기보다 정답을 바로 요구하는 경향',
    )
  } else if (m.hintPerActiveDay >= 1) {
    patterns.push(
      `hint_per_active_day가 ${m.hintPerActiveDay.toFixed(1)}로 힌트 의존도가 다소 높은 편`,
    )
  }
  return patterns
}

function actionsOf(level: DiagnosisLevel, m: StudentMetrics): string[] {
  const actions: string[] = []
  if (m.daysSinceLastActivity >= 5) {
    actions.push(
      `최근 ${m.daysSinceLastActivity}일 미접속 상태이므로 안부 확인 메시지를 통해 이탈 방지 및 재접속 유도`,
    )
  }
  if (m.stalledDays >= 5 && m.stepsCompleted < m.totalSteps) {
    actions.push(
      `${m.currentStep}단계 정체 원인이 개념 이해 문제인지 단순 실수 반복인지 1:1로 확인`,
    )
  }
  if (level === '입문' || level === '초급') {
    actions.push(
      `${m.topErrors[0].type} 반복 해소를 위한 기초 개념 복습과 에디터 설정(공백 표시, 자동 들여쓰기) 점검 세션 진행`,
    )
  } else if (level === '중급') {
    actions.push(
      `${m.topErrors[0].type} 반복 패턴에 대해 타입 체크 습관을 점검하는 미니 과제 제시`,
      '개념 연결 능력을 살려 심화 질문을 유도해 성장 곡선 재확인',
    )
  } else {
    actions.push(
      m.stepsCompleted === m.totalSteps
        ? '전 단계 완주 상태 — 심화 과제(설계 실습·오픈소스 사례 분석) 제공으로 학습 지속 유도'
        : '설계 수준 질문에 대한 관심을 살려 심화 과제를 병행 제시',
    )
  }
  return actions
}

function feedbackDraftOf(
  name: string,
  level: DiagnosisLevel,
  m: StudentMetrics,
): string {
  const first = name.slice(1)
  const absent =
    m.daysSinceLastActivity >= 5
      ? ` 요즘 접속이 뜸하셨는데, 편하실 때 다시 이어가 봐요.`
      : ''
  switch (level) {
    case '입문':
      return `${first}님, 과정에 잘 적응하고 계신 모습이 보기 좋습니다. 처음에는 에러가 많이 나는 게 당연하니 조급해하지 않으셔도 돼요. 막히는 부분은 편하게 질문해 주세요!`
    case '초급':
      return `${first}님, 이번 주도 꾸준히 도전해 주셔서 좋았습니다. ${m.topErrors[0].type}는 많은 분들이 겪는 자연스러운 과정이니 너무 걱정하지 않으셔도 됩니다. 막히는 부분을 함께 짚어보면 훨씬 수월해질 거예요.${absent} 응원하고 있습니다!`
    case '중급':
      return `${first}님, 에러 원인을 스스로 분석하고 해결해 나가는 모습이 인상적이에요! ${m.topErrors[0].type}가 반복되는 부분만 같이 짚어보면 더 수월하게 넘어갈 수 있을 것 같아요. 지금처럼 원인을 스스로 짚어내는 습관을 계속 이어가시면 좋겠습니다!${absent}`
    case '해결사':
      return `${first}님, 스스로 문제를 해결해 나가는 힘이 확실히 보입니다. 지금 수준이면 심화 과제도 충분히 즐겁게 해내실 수 있을 것 같아요.${absent} 궁금한 점 있으시면 편하게 말씀해주세요!`
  }
}

function groupSummaryOf(week: number, students: StudentDiagnosis[]): string {
  const levelLine = students.map((s) => `${s.name}(${s.level})`).join(' · ')
  const attention = students.filter((s) => s.riskSignals.length > 0)
  const attentionLine =
    attention.length > 0
      ? `이번 주에는 ${attention
          .map(
            (s) =>
              `${s.name}(${
                s.metrics.daysSinceLastActivity >= 5
                  ? `${s.metrics.daysSinceLastActivity}일 미접속`
                  : `${s.metrics.stalledDays}일 정체`
              })`,
          )
          .join('과 ')}에 대한 우선 확인이 필요합니다.`
      : '이번 주 우선 개입이 필요한 학생은 없으며, 전반적으로 안정적인 학습 흐름을 유지하고 있습니다.'
  const errorTypes = [
    ...new Set(students.flatMap((s) => s.metrics.topErrors[0].type)),
  ].join('·')
  const intro =
    week <= 4
      ? `${week}주차 기준 A그룹은 과정 초반 적응 구간으로, 현재 수준 분포는 ${levelLine}입니다.`
      : `현재 A그룹의 수준 분포는 ${levelLine}로, 등급 간 편차가 관찰됩니다.`
  return `${intro} ${attentionLine} 그룹 수업 운영 시에는 반복 상위 에러 유형(${errorTypes})을 공통 미니 세션으로 다루고, 앞서가는 학생에게는 심화 과제를 별도 제공하는 수준별 병행 운영을 제안합니다.`
}

function generatedStudent(def: StudentDef, week: number): StudentDiagnosis {
  const metrics = metricsOf(def, week)
  const level = def.levelAt(week)
  return {
    name: def.name,
    track: 'python',
    level,
    confidence: def.confidenceAt(week),
    metrics,
    basis: basisOf(level, metrics),
    weakPatterns: weakPatternsOf(level, metrics),
    riskSignals: riskSignalsOf(metrics),
    actions: actionsOf(level, metrics),
    feedbackDraft: feedbackDraftOf(def.name, level, metrics),
  }
}

// --- 20주차(2026-07-08) — LLM 수준 진단 PoV v0.1 산출 원문 ------------------

const WEEK20_GROUP_SUMMARY =
  '현재 A그룹은 초급부터 해결사 등급까지 수준 편차가 뚜렷하며, 김민준은 개념 정체와 힌트 의존이, 박지훈은 장기 미접속이 확인되어 전반적으로는 안정적이나 개별 관리가 필요한 상황입니다. 이번 주에는 김민준(7일 정체 및 반복적 IndentationError, 정답 요구 발화)과 박지훈(14일 미접속, 다음 단계 미배정 가능성)에 대한 우선 확인이 필요하며, 이서연은 지표상 정체는 있으나 개념 이해도가 높아 급한 개입보다는 모니터링이 적절합니다. 그룹 수업 운영 시에는 for/while 선택 기준과 반복되는 TypeError·ValueError·IndentationError 유형을 공통 미니 세션으로 다루되, 박지훈처럼 앞서가는 학생에게는 심화 설계 과제를 별도로 제공하는 수준별 병행 운영을 제안합니다.'

type Week20Text = Pick<
  StudentDiagnosis,
  'basis' | 'weakPatterns' | 'riskSignals' | 'actions' | 'feedbackDraft'
>

const WEEK20_TEXT: Record<string, Week20Text> = {
  김민준: {
    basis:
      "steps_completed=3, current_step=3, stalled_days_on_current_step=7일로 1주 이상 정체 상태이며, hint_per_active_day=2.91(활동일당 2회 이상 기준 초과)과 error_per_run=0.82(0.5 이상)로 힌트 의존도와 에러 빈도가 초급 기준에 부합합니다. 또한 avg_retry_gap_min=67.9분으로 재시도 간격이 30분을 크게 초과하고, 6/24 대화에서 '그냥 답을 알려주시면 안 돼요?'라는 정답 요구 발화가 명확히 나타났습니다.",
    weakPatterns: [
      "IndentationError 반복 (top_error_types에서 16회로 최다, 6/24 대화에서도 '어제도 이거였는데'라며 동일 유형 재발 언급)",
      'TypeError/NameError도 각각 11회로 높은 빈도 발생',
      "for문/while문 사용 시점에 대한 개념 혼동 (6/30 발화: 'while문이랑 for문 중에 뭘 써야 하는지 아직도 헷갈려요')",
      '힌트 없이 스스로 원인 분석하기보다 정답을 바로 요구하는 경향',
    ],
    riskSignals: [
      'days_since_last_activity=7일로 5일 이상 미접속 기준 충족',
      "stalled_days_on_current_step=7일과 부정적 발화('4단계 너무 어려운 것 같아요…')가 결합되어 이탈 위험 신호 조합에 해당",
    ],
    actions: [
      '4단계(for/while 선택 기준)에 대한 1:1 개념 설명 또는 비교 예제 제공으로 정체 해소',
      '들여쓰기(공백/탭 혼용) 문제 해결을 위한 에디터 설정(공백 표시, 자동 들여쓰기) 점검 세션 진행',
      '최근 7일 미접속 상태이므로 안부 확인 메시지를 통해 이탈 방지 및 재접속 유도',
    ],
    feedbackDraft:
      '민준님, 지난번 IndentationError를 어제보다 더 빠르게 스스로 찾아내신 점 정말 잘하셨어요! 4단계에서 for문과 while문 선택이 헷갈리신다고 하셨는데, 이건 많은 학생들이 겪는 자연스러운 과정이니 너무 걱정하지 않으셔도 됩니다. 잠깐 시간 내서 두 반복문의 차이를 예제와 함께 다시 살펴보면 훨씬 수월해질 거예요. 요즘 접속이 뜸하셨는데, 편하실 때 다시 이어가 봐요. 응원하고 있습니다!',
  },
  이서연: {
    basis:
      "정량 지표만 보면 stalled_days_on_current_step=5, error_per_run=0.65, hint_per_active_day=1.0으로 초급 기준(정체 1주 이상 근접, 힌트 의존 높음)에 가깝지만, 최근 대화에서는 에러 메시지만 보고 'range(len(list))로 고치는' 원인을 스스로 짚어내고 '인덱스 없이 순회'와 'enumerate' 같은 대안적 방법을 스스로 연결하는 모습을 보여 중급~그 이상의 개념 연결 능력을 시사합니다. 지표와 대화 내용이 다소 상반되어 등급을 단정하기 어렵습니다.",
    weakPatterns: [
      'TypeError(13회), ValueError(12회) 등 동일 유형 에러가 반복적으로 발생',
      '현재 단계(step 7)에서 5일간 정체 중',
      'hint_per_active_day가 1.0으로 힌트 의존도가 다소 높은 편',
    ],
    riskSignals: [],
    actions: [
      '현재 7단계에서 5일간 정체된 원인이 개념 이해 문제인지 단순 문법 실수 반복인지 1:1로 확인',
      'TypeError/ValueError 반복 패턴에 대해 타입 체크 습관을 점검하는 미니 과제 제시',
      '대화에서 보인 개념 연결 능력(enumerate 등)을 살려 심화 질문을 유도해 성장 곡선 재확인',
    ],
    feedbackDraft:
      '서연님, 최근 인덱스 에러의 원인을 스스로 분석하고 enumerate 같은 대안까지 떠올리신 점이 정말 인상적이었어요! 다만 7단계에서 며칠 정체가 있었는데, 어떤 부분이 막히는지 편하게 이야기해주시면 함께 풀어볼게요. TypeError나 ValueError가 반복되는 부분도 같이 짚어보면 더 수월하게 넘어갈 수 있을 것 같아요. 지금처럼 원인을 스스로 짚어내는 습관을 계속 이어가시면 좋겠습니다!',
  },
  박지훈: {
    basis:
      "steps_completed 10(10단계 완주)과 error_per_run 0.29(<0.5 기준)로 해결사의 정량 기준을 충족하며, 대화에서도 '커스텀 예외 계층 설계'처럼 문법 확인을 넘어선 설계 심화 질문이 나타납니다. 다만 hint_per_active_day가 0.67로 낮은 편이지만 8회의 힌트 요청 자체는 존재해 확인이 필요합니다.",
    weakPatterns: [],
    riskSignals: [
      'days_since_last_activity 14일로 최근 5일 이상 미접속 기준을 초과함',
      'stalled_days_on_current_step 14일이지만 current_step(10)이 steps_completed(10)와 동일해 신규 단계 미배정으로 인한 정체일 가능성도 있어 원인 확인 필요',
    ],
    actions: [
      '14일 미접속 원인이 다음 단계 부재 때문인지, 개인 사정 때문인지 짧게 안부 확인 겸 다음 단계(11단계) 안내',
      '설계 수준 질문에 대한 관심을 살려 심화 과제(예: 커스텀 예외 계층 실습, 오픈소스 예외 설계 사례 분석)를 추가로 제시',
      '부정적 발화는 없으므로 긴급 개입보다는 학습 지속을 위한 가벼운 체크인 권장',
    ],
    feedbackDraft:
      '지훈님, 10단계까지 완주하시느라 고생 많으셨습니다! 특히 커스텀 예외 계층 설계까지 스스로 고민하고 requests 라이브러리 사례까지 연결하신 점이 인상 깊었어요. 최근 2주 정도 활동이 뜸했는데, 다음 단계 안내가 필요하시거나 궁금한 점 있으시면 편하게 말씀해주세요. 지훈님의 설계 감각이면 다음 심화 과제도 충분히 즐겁게 해내실 수 있을 것 같습니다.',
  },
}

// ---------------------------------------------------------------------------

function buildWeek(week: number): WeeklyDiagnosisReport {
  const students = STUDENTS.map((def) => {
    const generated = generatedStudent(def, week)
    // 20주차는 지표만 테이블에서 파생하고 서술은 PoV 산출 원문으로 대체한다.
    return week === 20 ? { ...generated, ...WEEK20_TEXT[def.name] } : generated
  })
  return {
    week,
    baseDate: weekBaseDate(week),
    group: 'A그룹',
    trackLabel: 'Python 트랙',
    generator: 'LLM 수준 진단 PoV v0.1',
    groupSummary:
      week === 20 ? WEEK20_GROUP_SUMMARY : groupSummaryOf(week, students),
    students,
  }
}

export function buildDiagnosisReports(): WeeklyDiagnosisReport[] {
  return Array.from({ length: TOTAL_WEEKS }, (_, i) => buildWeek(i + 1))
}
