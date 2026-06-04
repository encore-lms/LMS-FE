// 운영 인증 검토(증명서 폐쇄 루프) 도메인 타입. (BE 계약 확정 시 페어가 shared PR로 갱신)

export type CertReviewStatus =
  | 'requested' // 요청됨
  | 'reviewing' // 검토 중
  | 'changes_requested' // 보완 요청
  | 'certified' // 인증 완료

export interface CertReviewListItem {
  id: string
  student: { name: string; studentNo: string; cohort: string }
  status: CertReviewStatus
  requestedAt: string // 표시용 "05-17 14:32"
  assignee: string | null // 담당자(미배정이면 null)
  missingCount: number // 결측
  riskFlags: string[] // 위험 플래그 칩
  latestReason: string // 최근 사유('없음' 가능)
}

// 인증 검토 큐(/admin/certificates/reviews) 응답.
export interface CertReviewQueue {
  total: number // 전체 167
  byStatus: Record<CertReviewStatus, number> // 탭/KPI 카운트
  unassigned: number // 미배정
  riskFlagged: number // 위험 플래그 건
  myAssigned: number // 내 담당
  avgHours: number // 평균 처리 시간
  items: CertReviewListItem[]
}

// --- 인증 검토 상세 (Flow 11 C2) ---

export interface SkillScore {
  key: string // 기술·책임감·소통·성장·팀워크·문제해결
  score: number
  confirmed: boolean
}

export interface ApprovalCheck {
  key: string
  label: string // 프로필·핵심 지표·6축 점수·대표 근거·원천 데이터 최신성·개인정보
  detail: string
  pass: boolean
}

export interface ReviewRiskFlag {
  label: string // 결측·개인정보 위험·점수 재검토
  detail: string
  count: number
}

export interface ScoreEvidence {
  skill: string // "기술 82점"
  basis: string
}

export interface ArtifactApproval {
  title: string
  by: string
  status: 'approved' | 'unverified'
}

export interface AuditEntry {
  at: string
  actor: string
  action: string
}

// 인증 검토 상세(/admin/certificates/reviews/:reviewId) 응답.
export interface CertReviewDetail {
  id: string
  student: { name: string; certId: string; cohort: string }
  status: CertReviewStatus
  assignee: string
  requestedAt: string
  martStale: boolean // 원천 데이터 미갱신
  martLastRefreshed: string
  metrics: {
    trainingHours: number // 480
    attendance: number // 0.962
    quizAvg: number // 84.7
    submissionRate: number // 0.91
    submissionRaw: string // "32/35건"
  }
  skills: SkillScore[]
  skillAvg: number // 81.7
  payloadPreview: string // JSON 요약 1줄
  approvalChecks: ApprovalCheck[] // 승인 필수 체크
  riskFlags: ReviewRiskFlag[]
  scoreEvidence: ScoreEvidence[] // 점수 근거
  artifactApprovals: ArtifactApproval[] // 산출물 승인 상태
  auditLog: AuditEntry[] // 감사 로그
}

// --- 스냅샷 상세 (Flow 11 C3) ---

export interface SnapshotEvidence {
  title: string
  sub: string
}

// 동결 스냅샷(/admin/certificates/:certificateId/snapshot) 응답.
export interface CertSnapshot {
  certificateId: string
  student: { name: string; certId: string; cohort: string }
  isPublic: boolean
  issuedAt: string
  metrics: {
    trainingHours: number
    attendance: number
    quizAvg: number
    submissionRate: number
    submissionRaw: string
  }
  skills: SkillScore[]
  skillAvg: number
  evidence: SnapshotEvidence[] // 대표 근거(외부 공개)
  payloadJson: string // 동결 공개 payload (멀티라인)
  verify: { url: string; snapshotHash: string; verifLevel: string }
}
