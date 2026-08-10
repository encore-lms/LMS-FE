// 진단 리포트 — LLM 수준 진단 PoV v0.1 타입.
// 주간 단위로 그룹 요약 + 학생별 진단(지표·근거·조치·피드백 초안)을 담는다. BE 미연동(mock 전용).

/** 수준 등급 — 지표(정체·에러율·힌트 의존) 기반 LLM 분류 결과 */
export type DiagnosisLevel = '입문' | '초급' | '중급' | '해결사'

/** 등급 판정 확신도 — 지표와 대화 근거가 상반되면 낮아진다 */
export type DiagnosisConfidence = '높음' | '중간' | '낮음'

export interface ErrorTypeCount {
  type: string
  count: number
}

/** 학생별 정량 지표 — 리포트 지표 그리드 8칸에 대응 */
export interface StudentMetrics {
  stepsCompleted: number
  totalSteps: number
  currentStep: number
  /** 분석 구간 내 활동일 수 */
  activeDays: number
  /** 현 단계 정체 일수 (stalled_days_on_current_step) */
  stalledDays: number
  /** 최근 미접속 일수 (days_since_last_activity) */
  daysSinceLastActivity: number
  errorRuns: number
  totalRuns: number
  /** 실행당 에러 (error_per_run = errorRuns / totalRuns) */
  errorPerRun: number
  hintTotal: number
  /** 활동일당 힌트 요청 (hint_per_active_day) */
  hintPerActiveDay: number
  /** 에러 후 재시도 간격 평균(분) */
  retryGapAvgMin: number
  retryGapMaxMin: number
  topErrors: ErrorTypeCount[]
}

export interface StudentDiagnosis {
  name: string
  track: string
  level: DiagnosisLevel
  confidence: DiagnosisConfidence
  metrics: StudentMetrics
  /** 진단 근거 — 지표·발화 인용 서술 */
  basis: string
  weakPatterns: string[]
  /** 이탈·부진 위험 신호 (⚠ 항목) — 없으면 빈 배열 */
  riskSignals: string[]
  /** 강사 권장 조치 */
  actions: string[]
  /** 피드백 초안 — 강사 검토·승인 후 전달(AI가 직접 전달하지 않음) */
  feedbackDraft: string
}

export interface WeeklyDiagnosisReport {
  /** 1부터 시작하는 주차 번호 */
  week: number
  /** 분석 기준일 (YYYY-MM-DD) */
  baseDate: string
  group: string
  trackLabel: string
  /** 생성 주체 표기 (예: LLM 수준 진단 PoV v0.1) */
  generator: string
  groupSummary: string
  students: StudentDiagnosis[]
}
