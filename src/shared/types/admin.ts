// 운영(admin) 도메인 타입 — 운영 대시보드 "통합 보강"(OPERATION CONSOLE) 기반.
// (Figma 운영 Pages "운영 — 대시보드 통합 보강" 1457:10468. BE 계약 확정 시 페어가 shared PR로 갱신)

export type OverallStatus = 'normal' | 'caution' | 'danger'
export type SyncStatus = 'normal' | 'caution' | 'error' // 정상 / 주의 / 오류
export type Priority = 'P0' | 'P1' | 'P2'

// KPI 타일 — 값 + 트렌드 델타 + 보조 설명. icon은 컴포넌트에서 매핑.
export interface AdminKpi {
  key: string
  label: string // "인증 요청"
  value: string // "18" / "1,243"(천단위 표기 위해 문자열)
  delta: string // "+3" / "—" / "−4"
  hint: string // "보완 요청 4건 포함"
  icon: 'request' | 'reviewing' | 'changes' | 'certified' | 'mart'
}

// 긴급 검토 대상 — P0/P1/P2 우선순위 처리 큐 행.
export interface AdminQueueItem {
  id: string
  priority: Priority
  type: string // "출결 이상"
  target: string // "AI 백엔드 3기 김민준"
  status: string // "HRD 퇴실 누락"
  due: string // "오늘" / "D-1"
  action: { label: string; to: string } // 확인 / 재계산 / 검토 / 처리 / 재채점 / 상세
}

// 위험 신호 — 운영자가 주의할 정책/상태 카드.
export interface AdminRiskSignal {
  title: string // "HRD 원본 수정 불가"
  desc: string
}

// 바로가기 — 핵심 운영 화면 진입 카드.
export interface AdminShortcut {
  key: string
  title: string // "인증 검토 큐"
  desc: string // "P0 2건 처리 대기"
  to: string
  icon: 'review' | 'accounts' | 'csv' | 'reputation' | 'quarantine'
}

// 데이터 동기화 상태 행.
export interface AdminSyncRow {
  name: string // "HRD-Net 수강생"
  at: string // "05-19 09:10"
  status: SyncStatus
}

// 우선순위 결정 로그(타임라인) 항목.
export interface AdminDecisionLog {
  at: string // "09:20"
  text: string
}

// 운영 대시보드 "통합 보강" 요약 — 히어로 + KPI 5 + 우선순위 큐 + 위험 신호 + 바로가기 + 동기화 상태 + 결정 로그.
export interface AdminDashboardSummary {
  hero: {
    status: { level: OverallStatus; label: string } // "운영 정상"
    riskCount: number // 위험 신호 3건
    martUpdatedAt: string // "09:20"
    martNextAt: string // "09:50"
    todayPending: { value: number; deltaLabel: string } // 45, "어제 대비 +6"
    todayDone: { value: number; avgLabel: string } // 12, "평균 처리 8분"
  }
  kpis: AdminKpi[] // 5
  queue: AdminQueueItem[]
  queueSummary: { total: number; p0: number; p1: number; p2: number }
  risks: AdminRiskSignal[]
  shortcuts: AdminShortcut[]
  sync: AdminSyncRow[]
  decisionLog: AdminDecisionLog[]
}
