import { create } from 'zustand'
import type { ProjectStatus } from '../types'

// 프로젝트 생애주기 시뮬레이션 — 백엔드 없이 프론트에서 완료 확정·인증 흐름을 걸어볼 수 있게.
// active(작성 중) → completed(작성 완료·완료 확정 → 완료 배너·상호평가 열림)
//   → reviewing(인증 검토 중) → certified(인증 완료).
// 프로젝트별 단계를 보관해 워크스페이스와 목록(배지·필터·통계)이 같은 흐름을 공유한다.
// BE 연동 시: 단계는 서버 상태로 대체하고 이 스토어·테스트 FAB는 제거 가능.
export type ProjectPhase = 'active' | 'completed' | 'reviewing' | 'certified'

// 목록의 정적 상태(draft/reviewing/certified) → 시작 단계.
export function statusToPhase(status: ProjectStatus): ProjectPhase {
  if (status === 'certified') return 'certified'
  if (status === 'reviewing') return 'reviewing'
  return 'active' // draft = 작성 중
}

interface ProjectFlowState {
  // 프로젝트별 진행 단계 override(미설정이면 목록 상태에서 파생).
  phases: Record<string, ProjectPhase>
  setPhase: (projectId: string, phase: ProjectPhase) => void
}

export const useProjectFlow = create<ProjectFlowState>((set) => ({
  phases: {},
  setPhase: (projectId, phase) =>
    set((s) => ({ phases: { ...s.phases, [projectId]: phase } })),
}))
