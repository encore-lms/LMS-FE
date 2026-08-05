// LMS-AI Python 응답 계약의 FE 소비 타입.
// 원본(SSOT): LMS-AI/API.md와 src/lms_ai 응답 구현.

// 증명서 AI 엔진 ↔ FE 공유 계약(SSOT). 순수 데이터 타입, 프레임워크·엔진 내부 의존 0.
//
// 이 파일이 FE↔LMS-AI 사이 "wire 계약"의 단일 출처(SSOT)다.
// FE는 이 파일을 그대로 복사해(`contract.gen.ts`) 렌더 타입으로 쓴다.
//   - 재생성(FE): pnpm sync:ai-contract
//   - 자족적으로 유지할 것: 다른 파일을 import 하지 않는다(복사 대상이므로).
//   - 서버 전용 입력 타입(StudentRaw 등)은 여기 두지 않는다 → `types.ts`.

// ── 파생 산출 (결정 함수 계산 결과) ──
export type SixAxisKey =
  | "기술"
  | "성장"
  | "팀워크"
  | "책임감"
  | "소통"
  | "문제해결";
export type SixAxis = Record<SixAxisKey, number>; // 0~100

export interface StudentDerived {
  studentId: string;
  sixAxis: SixAxis;
  /** 표본 부족(N<30)이면 해당 축 생략 */
  percentile: Partial<SixAxis>;
  grade: string;
  /** 상호평가 5축 집계 */
  peerAgg: Record<string, number>;
  /** 성취도/CS 카테고리 분포 */
  achieveDist: Record<string, number>;
  growthTrend: { slope: number; normalized: number };
  problem3: { 데이터처리: number; 모델튜닝: number; 인프라배포: number };
  /** 프로젝트 도메인 비중 */
  domainWeight: Record<string, number>;
  /** 교차 신호(파생) — 여러 소스가 가리키는 방향 잇기용 */
  cross: {
    tsCategoryDist: Record<string, number>;
    projectStackFreq: Record<string, number>;
    achieveBySubjectTime: { subject: string; score: number; at: string }[];
    tsDiversity: number;
    tsDaysTrend: number;
  };
}

// ── 수강역량증명서 종합점수·6축 + 상대 위치 ──
export const CERTIFICATE_AXIS_KEYS = [
  "기술·기술기여",
  "소통·협업·팀워크",
  "문제해결",
  "책임감",
  "학습지속성",
  "성취도 평가",
] as const;
export type CertificateAxisKey = (typeof CERTIFICATE_AXIS_KEYS)[number];

/** 종합요약 동료평가 비교에 노출하는 축과 고정 순서. */
export const CERTIFICATE_360_AXIS_KEYS = [
  "기술·기술기여",
  "소통·협업·팀워크",
  "문제해결",
  "책임감",
] as const satisfies readonly CertificateAxisKey[];
export type Certificate360AxisKey = (typeof CERTIFICATE_360_AXIS_KEYS)[number];

export type CertificateScoreStatus = "READY" | "NOT_READY" | "ERROR";
export type CertificateComponentStatus =
  | CertificateScoreStatus
  | "NOT_APPLICABLE";
export type CertificateRelativeStatus = "READY" | "NOT_READY";
export type CertificateRelativeScope = "COHORT" | "ALL_STUDENTS";

export interface CertificateRelativePosition {
  status: CertificateRelativeStatus;
  /** 축은 동일 기수, 종합점수는 전체 산출 가능 수강생을 모집단으로 사용한다. */
  scope: CertificateRelativeScope;
  /** 레이더 표시용 백분위. 0~100이며 클수록 상대 위치가 높다. */
  percentile: number | null;
  /** 수강생 표시용 상위 비율. 0~100이며 작을수록 상대 위치가 높다. */
  topPercent: number | null;
  populationSize: number;
  detail: string;
}

export interface CertificateScoreComparison {
  /** 프로젝트 상호평가를 1~5점에서 0~100점으로 환산한 값. 비교 원천이 없으면 null. */
  peerScore: number | null;
  /** 최종 멘토평가를 1~5점에서 0~100점으로 환산한 값. 비교 원천이 없으면 null. */
  mentorScore: number | null;
  /** 강사 평가자 그룹의 1~5점 평균을 0~100점으로 환산한 값. 비평가축은 생략한다. */
  instructorScore?: number | null;
  /** 운영 평가자 그룹의 1~5점 평균을 0~100점으로 환산한 값. 비평가축은 생략한다. */
  managerScore?: number | null;
}

export interface CertificateAxisEvidenceItem {
  /** 화면에서 안정적으로 구분하는 축 내부 입력 키. */
  key: string;
  /** 사용자에게 표시하는 평가·활동명. */
  label: string;
  /** 원천에서 집계한 실제 값. */
  value: number | null;
  unit: "점" | "%" | "건" | "회";
  /** 비율의 분자. 건수 근거가 없으면 null. */
  numerator: number | null;
  /** 비율의 분모. 건수 근거가 없으면 null. */
  denominator: number | null;
  /** 축 점수에 반영하는 비중. 가산점이면 null. */
  weightPercent: number | null;
  /** 가중치·환산·가산점을 적용해 축 점수에 기여한 점수. */
  appliedScore: number | null;
  /** 사용자에게 보여줄 짧은 실제 근거. */
  detail: string;
}

export interface CertificateAxisScore {
  key: CertificateAxisKey;
  score: number | null;
  status: CertificateScoreStatus;
  source: string;
  detail: string;
  relative: CertificateRelativePosition;
  comparison: CertificateScoreComparison;
  evidence: CertificateAxisEvidenceItem[];
}

export type CertificateMetricKey =
  | "attendance"
  | "assessment"
  | "blog"
  | "certifiedProject"
  | "certifiedTroubleshooting"
  | "certifiedCertificate"
  | "evaluatorAverage";

export interface CertificateScoreMetric {
  key: CertificateMetricKey;
  label: string;
  value: number | null;
  /** 진행률 표현용 분모. 단순 건수처럼 분모가 없으면 null. */
  maximum: number | null;
  unit: "%" | "점" | "건";
  status: CertificateComponentStatus;
  detail: string;
}

export const CERTIFICATE_PEER_AXIS_KEYS = [
  "협업",
  "소통",
  "책임감",
  "문제해결",
  "기술기여",
] as const;
export type CertificatePeerAxisKey =
  (typeof CERTIFICATE_PEER_AXIS_KEYS)[number];

export interface CertificatePeerEvaluationAxis {
  key: CertificatePeerAxisKey;
  /** 완료 프로젝트별 유효 평가자 평균을 다시 동일 가중 평균한 1~5점 값. */
  score: number | null;
  status: CertificateScoreStatus;
  detail: string;
}

export interface CertificateDomainExperience {
  /** 인증 완료 프로젝트에 설정된 도메인명. */
  label: string;
  /** 해당 도메인의 인증 완료 프로젝트 수. */
  projectCount: number;
  /** 도메인이 설정된 인증 완료 프로젝트 중 비중(0~100). */
  percentage: number;
}

export interface CertificateProjectNavigation {
  /** 인증 트러블슈팅을 확인할 프로젝트 워크스페이스. 원천이 없으면 null. */
  issuesProjectId: string | null;
  /** 누적 상호평가 결과를 확인할 최근 완료 프로젝트 워크스페이스. */
  peerEvaluationProjectId: string | null;
}

export interface CertificateScoreResult {
  policyVersion: "2026.08.05-six-axis-four-rater-v1";
  calculatedAt: string;
  student: {
    studentId: string;
    studentName: string;
    courseName: string;
    cohortName: string;
    cohortStartedAt: string;
    cohortEndedAt: string;
  };
  status: CertificateScoreStatus;
  overallScore: number | null;
  grade: string | null;
  overallRelative: CertificateRelativePosition;
  axes: CertificateAxisScore[];
  metrics: CertificateScoreMetric[];
  peerEvaluation: CertificatePeerEvaluationAxis[];
  projectNavigation: CertificateProjectNavigation;
  domainExperience: CertificateDomainExperience[];
  warnings: string[];
}

// ── 수강역량증명서 데이터 탭 상세(기술·검증 / 문제해결·협업 / 성장·평판) ──
export type CertificateDetailStatus = "READY" | "PARTIAL" | "NOT_READY";
export type CertificateAssessmentType = "ACHIEVEMENT" | "CS";

export interface CertificateTechCategory {
  assessmentType: CertificateAssessmentType;
  label: string;
  score: number;
  attemptCount: number;
  topPercent: number | null;
  populationSize: number;
}

export interface CertificateAssessmentPoint {
  id: string;
  title: string;
  assessmentType: CertificateAssessmentType;
  category: string;
  /** 수강생의 최신 유효 성취도·CS 평가 점수(0~100). */
  score: number;
  /** 같은 시험을 치른 기수 수강생의 최신 유효 점수 평균(0~100). */
  cohortAverageScore: number | null;
  /** 같은 시험 기수 모집단 내 평균 순위를 0~100으로 환산한 백분위. */
  relativeScore: number | null;
  /** 시험 비교에 포함된 동일 기수 유효 수강생 수. */
  comparisonCount: number;
  submittedAt: string;
}

export interface CertificateExternalCertification {
  name: string;
  /** 수강생이 취득한 공식 인증시험 원점수(0~1,000). */
  score: number | null;
  /** 공식 원점수 구간에서 계산한 등급. */
  grade: string | null;
  status: string;
  scheduledAt: string | null;
  submittedAt: string | null;
  issuedAt: string | null;
  registrationSource: string;
}

export interface CertificateAssignmentEvidence {
  id: string;
  week: string;
  subjectName: string;
  type: string;
  reviewStatus: string;
  submissionStatus: string;
}

export interface CertificateTechDetail {
  status: CertificateDetailStatus;
  averageScore: number | null;
  /** 전체 수강생별 전체 유효 시험 평균을 비교한 상위 비율. */
  assessmentAverageTopPercent: number | null;
  /** 전체 시험 평균 순위 산정에 포함된 전체 유효 수강생 수. */
  assessmentAveragePopulationSize: number;
  categories: CertificateTechCategory[];
  assessments: CertificateAssessmentPoint[];
  certifications: CertificateExternalCertification[];
  assignments: CertificateAssignmentEvidence[];
  limitations: string[];
}

export interface CertificateTroubleshootingCase {
  id: string;
  title: string;
  category: string;
  independent: boolean;
  days: number | null;
  situation: string;
  resolution: string;
  result: string;
  /** 원문을 민감정보 마스킹 후 화면용으로 축약한 상황·해결·결과. */
  summary?: CertificateTroubleshootingCaseSummary;
  createdAt: string;
}

export interface CertificateTroubleshootingCaseSummary {
  policyVersion: string;
  situation: string;
  resolution: string;
  result: string;
  generatedBy: "AI" | "FALLBACK";
}

export interface CertificateProblemCategory {
  label: string;
  count: number;
  percentage: number;
}

export interface CertificatePeerTag {
  label: string;
  count: number;
}

export interface CertificatePeerTagCase {
  tag: string;
  caseId: string;
  caseTitle: string;
}

export interface CertificateProblemDetail {
  status: CertificateDetailStatus;
  certifiedCount: number;
  independentRate: number | null;
  averageDays: number | null;
  categories: CertificateProblemCategory[];
  cases: CertificateTroubleshootingCase[];
  peerEvaluatorCount: number;
  peerTags: CertificatePeerTag[];
  peerTagCases: CertificatePeerTagCase[];
  limitations: string[];
}

export interface CertificatePeerReputationAxis {
  key: CertificatePeerAxisKey;
  score: number | null;
}

export interface CertificatePeerComment {
  comment: string;
  submittedAt: string;
}

export interface CertificateMentorEvaluationSummary {
  averageScore: number;
  submittedAt: string;
}

export interface CertificateGrowthDetail {
  status: CertificateDetailStatus;
  growthTimelineStatus: "NOT_READY";
  peerEvaluationCount: number;
  peerReputation: CertificatePeerReputationAxis[];
  peerComments: CertificatePeerComment[];
  mentorEvaluation: CertificateMentorEvaluationSummary | null;
  limitations: string[];
}

export interface CertificateDetailTabsResult {
  policyVersion: "2026.08.05-certificate-detail-tabs-v2";
  calculatedAt: string;
  studentId: string;
  tech: CertificateTechDetail;
  problem: CertificateProblemDetail;
  growth: CertificateGrowthDetail;
}

// ── 페르소나 고정 base 카테고리(7) — 화면 미표시, 매칭·통계용 ──
export const PERSONA_BASE = [
  "백엔드",
  "프론트엔드",
  "풀스택",
  "데이터 엔지니어",
  "데이터 분석",
  "ML·AI",
  "DevOps·인프라",
] as const;
export type PersonaBase = (typeof PERSONA_BASE)[number];

// ── AI 분석 출력 (블록1~6 + 온톨로지) ──
export type Tone =
  | "brand"
  | "info"
  | "warning"
  | "danger"
  | "accent"
  | "success";

// 블록1 — 기술 종합 판단
export type AiVerdictItemKey = "strength" | "growth" | "gap" | "unique";
export type AiVerdictItemStatus = "READY" | "NOT_READY";
export type AiVerdictConfidence = "HIGH" | "MEDIUM" | "LOW";
export interface AiVerdictDetail {
  status: AiVerdictItemStatus;
  evidence: string[];
  evidenceCodes: string[];
}
export interface AiVerdict {
  policyVersion: string;
  strength: string; // 강점
  growth: string; // 성장 포인트
  gap: string; // 보완
  unique: string; // 특이형
  /** 기존 3줄 표시와 분리한 항목별 산출·근거 추적 정보. */
  details: Record<AiVerdictItemKey, AiVerdictDetail>;
  confidence: AiVerdictConfidence;
  limitations: string[];
  generatedBy: "AI" | "FALLBACK";
}

// 블록2 — 프로파일링
export type AiProfileLevel = "HIGH" | "MID" | "LOW" | "NOT_READY";
export type AiProfileConfidence = "HIGH" | "MEDIUM" | "LOW";
export type AiProfileDimensionKey =
  | "STRUCTURING"
  | "EXECUTION"
  | "VERIFICATION"
  | "DIRECTION"
  | "COORDINATION"
  | "ENABLEMENT"
  | "IMPROVEMENT"
  | "RETENTION"
  | "PERSISTENCE"
  | "CLARITY"
  | "SHARING"
  | "FEEDBACK"
  | "FOUNDATION"
  | "APPLICATION"
  | "OPERATIONS";

export interface AiProfileDimension {
  key: AiProfileDimensionKey;
  label: string;
  level: AiProfileLevel;
  /** 0~100 결정 점수. 조건형 판정은 null일 수 있다. */
  score?: number | null;
  /** 해당 수강생의 실제 입력값과 배점을 포함한 계산 설명. */
  calculation?: string[];
}

export interface AiProfileRow {
  label: string; // 업무/리더십/학습/소통/기술
  value: string;
  /** 업무 프로파일부터 단계적으로 연결하는 근거 기반 상세 정보. */
  description?: string;
  dimensions?: AiProfileDimension[];
  evidence?: string[];
  confidence?: AiProfileConfidence;
  limitations?: string[];
}
export interface AiProfile {
  rows: AiProfileRow[];
  summary: string; // AI 한줄 요약
  strengths: string; // 핵심 강점
  growth: string; // 성장 포인트
}

// 블록3 — 페르소나 TOP3 (풍부 표시 title + 고정 base + 부연)
export interface AiPersona {
  rank: number;
  title: string;
  subtitle: string; // 아이콘 호버 근거(활동)
  baseCategory: PersonaBase;
  /** 결정 점수 기반 정렬·감사용 적합도. */
  fitScore: number;
  confidence: AiProfileConfidence;
  evidence: string[];
  limitations?: string[];
  components?: {
    personalContribution: number;
    verifiedProblemSolving: number;
    roleAchievement: number | null;
    crossCheckedProject: number;
    declaredInterest: number;
  };
  evidenceCodes?: string[];
  generatedBy?: "AI" | "FALLBACK";
}

// 블록4 — 프로젝트 분석
export type AiProjectStatus = "READY" | "PARTIAL" | "NOT_READY";
export type AiProjectMembershipRole = "OWNER" | "MEMBER";
export interface AiProjectTeamContext {
  domain: string | null;
  scope: string;
  techStacks: string[];
  /** 프로젝트 전체의 결과이며 개인 성과로 해석하지 않는다. */
  outcomes: string[];
}
export interface AiProjectPersonalEvidence {
  tasks: string[];
  workCategories: string[];
  technologies: string[];
  peerObservations: string[];
  troubleshootingCases: string[];
  artifacts: string[];
}
export interface AiProjectSnapshot {
  projectId: string;
  order: number;
  name: string;
  period: { startedAt: string; endedAt: string };
  certificationStatus: "CERTIFIED";
  status: AiProjectStatus;
  membershipRole: AiProjectMembershipRole;
  teamContext: AiProjectTeamContext;
  personalEvidence: AiProjectPersonalEvidence;
  analysis: string;
  evidenceCodes: string[];
  limitations: string[];
  generatedBy: "AI" | "FALLBACK";
}
export interface AiProjectOverview {
  experienceScope: string;
  workingStyle: string;
  overall: string;
}
export type AiProjectInsightKey =
  | "CONTINUITY"
  | "EXPANSION"
  | "VALIDATION";
export interface AiProjectInsight {
  key: AiProjectInsightKey;
  label: string;
  summary: string;
  projectIds: string[];
  projectNames: string[];
  evidenceCodes: string[];
  confidence: AiProfileConfidence;
  limitations: string[];
}
export interface AiProjects {
  policyVersion: string;
  summary: string;
  groups: AiProjectInsight[];
  status: AiProjectStatus;
  projects: AiProjectSnapshot[];
  overview: AiProjectOverview;
  projectCount: number;
  period: { startedAt: string; endedAt: string } | null;
  evidenceCodes: string[];
  confidence: AiProfileConfidence;
  limitations: string[];
  generatedBy: "AI" | "FALLBACK";
}

// 블록5 — 문제해결·협업
export type AiProblemStatus = "READY" | "PARTIAL" | "NOT_READY";
export type AiProblemAxisKey =
  | "DATA_PROCESSING"
  | "MODEL_TUNING"
  | "INFRA_DEPLOYMENT";
export type AiProblemConfidence = "MEDIUM" | "LOW";
export interface ProblemCap {
  key: AiProblemAxisKey;
  label: string;
  status: "PARTIAL" | "NOT_READY";
  /** 구조화 인증 평가가 도입되기 전에는 역량 점수를 만들지 않는다. */
  score: null;
  certifiedCaseCount: number;
  evidence: string[];
  evidenceCodes: string[];
  limitations: string[];
}
export interface AiCollaborationProjectEvaluation {
  projectId: string;
  evaluatorCount: number;
  /** 협업·소통·책임감·문제해결 4축의 평가자 평균. */
  average: number;
  /** 평가자별 4축 평균의 모집단 표준편차. */
  deviation: number;
  axes: {
    collaboration: number;
    communication: number;
    responsibility: number;
    problemSolving: number;
  };
}
export interface AiCollaborationAnalysis {
  status: "READY" | "NOT_READY";
  label: string;
  summary: string;
  evaluatorCount: number;
  projectCount: number;
  behaviorSignals: string[];
  tagStats: CollaborationEvidenceStat[];
  behaviorStats: CollaborationEvidenceStat[];
  projectEvaluations: AiCollaborationProjectEvaluation[];
  evidence: string[];
  evidenceCodes: string[];
  confidence: AiProfileConfidence;
  limitations: string[];
  generatedBy: "AI" | "FALLBACK";
}
export interface AiProblemGrowthAnalysis {
  status: "READY" | "NOT_READY";
  confidence: AiProblemConfidence;
  summary: string;
  certifiedCaseCount: number;
  period: { firstAt: string; lastAt: string } | null;
  newDomains: string[];
  repeatedDomains: string[];
  newTechnologies: string[];
  repeatedTechnologies: string[];
  evidence: string[];
  evidenceCodes: string[];
  limitations: string[];
  generatedBy: "AI" | "FALLBACK";
}
export interface ProblemTagEvidence {
  label: string;
  count: number;
}
export interface ProblemEvidenceGroup {
  label: string;
  certifiedCaseCount: number;
  solutionSummary: string;
  tags: ProblemTagEvidence[];
  caseIds: string[];
  caseTitles: string[];
  evidence: string[];
}
export type ProblemSolvingStepKey = "FRAME" | "APPLY" | "VERIFY";
export interface ProblemSolvingStep {
  key: ProblemSolvingStepKey;
  label: string;
  summary: string;
}
export interface TroubleshootingNarrative {
  label: string;
  problemSolvingSummary: string;
  problemSolvingSteps: ProblemSolvingStep[];
  problemGroups: ProblemEvidenceGroup[];
  evidence: string[];
  confidence: AiProfileConfidence;
  limitations: string[];
}
export interface CollaborationEvidenceStat {
  label: string;
  count: number;
  evaluationSharePercent: number;
}
export interface ProblemAi {
  policyVersion: string;
  status: AiProblemStatus;
  mappingVersion: string;
  caps: ProblemCap[];
  /** 기존 FE 단계적 연결용. collaboration.summary와 같다. */
  style: string;
  /** 기존 FE 단계적 연결용. growth.summary와 같다. */
  scaling: string;
  collaboration: AiCollaborationAnalysis;
  growth: AiProblemGrowthAnalysis;
  certifiedCaseCount: number;
  peerEvaluationCount: number;
  period: { startedAt: string; endedAt: string } | null;
  troubleshooting: TroubleshootingNarrative;
  unmappedCaseCount: number;
  limitations: string[];
}

// 블록6 — 상담 감성·키워드 버블
export type SentimentAnalysisStatus = "READY" | "PARTIAL" | "NOT_READY";
export type SentimentPhase = "early" | "mid" | "late";
export type SentimentPolarity = "CONCERN" | "NEUTRAL" | "POSITIVE";
export interface SentimentEvidence {
  code: string;
  at: string;
  excerpt: string;
}
export interface SentimentBubble {
  label: string;
  x: number;
  y: number;
  r: number;
  phase: SentimentPhase;
  polarity: SentimentPolarity;
  weight: number;
  evidenceCount: number;
  evidence?: SentimentEvidence[];
}
export interface SentimentPhaseDetail {
  phase: SentimentPhase;
  label: string;
  period: { startedAt: string; endedAt: string };
  noteCount: number;
  summary: string;
  confidence: AiProfileConfidence;
}
export interface Sentiment {
  policyVersion: string;
  status: SentimentAnalysisStatus;
  noteCount: number;
  phases: SentimentPhaseDetail[];
  bubbles: SentimentBubble[];
  trend: string;
  confidence: AiProfileConfidence;
  limitations?: string[];
}

// 온톨로지 역량 맵
export type OntologyStatus = "READY" | "PARTIAL" | "NOT_READY";
export type OntologyKind =
  | "self"
  | "subject"
  | "skill"
  | "method"
  | "project"
  | "domain";
export type OntologyEdgeType =
  | "LEARNED"
  | "FOLLOWED_BY"
  | "PARTICIPATED"
  | "USED"
  | "APPLIED"
  | "BELONGS_TO";
export interface OntologyNode {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: OntologyKind;
  weight: number;
  evidenceCount: number;
  evidence: string[];
  confidence: AiProfileConfidence;
}
export interface OntologyEdge {
  source: string;
  target: string;
  type: OntologyEdgeType;
  strength: number;
  evidence: string[];
}
export interface Ontology {
  policyVersion: string;
  status: OntologyStatus;
  summary: string;
  counts: Record<OntologyKind, number>;
  omittedCounts: Partial<Record<OntologyKind, number>>;
  nodes: OntologyNode[];
  edges: OntologyEdge[];
  limitations?: string[];
}

// 최종 분석 결과 (getAnalysis 반환 / 서버 /analysis 응답)
export interface AiAnalysis {
  verdict: AiVerdict;
  profile: AiProfile;
  personas: AiPersona[];
  projects: AiProjects;
  problem: ProblemAi;
  sentiment: Sentiment;
  ontology: Ontology;
}
