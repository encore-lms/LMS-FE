import { create } from 'zustand'
import type { ProjectStatus } from '../types'

// 프로젝트 생애주기 시뮬레이션 — 백엔드 없이 프론트에서 완료 확정·인증 흐름을 걸어볼 수 있게.
// active(진행 중) → completed(기간 경과·완료 확정 → 완료 배너·상호평가 열림)
//   → reviewing(인증 검토 중) → certified(인증 완료).
// BE 연동 시: 초기값을 GET 워크스페이스의 상태로 채우고, 완료 확정/인증 승인은
// 운영·강사 측 엔드포인트로 대체하면 이 스토어와 테스트 FAB는 제거 가능.
export type ProjectPhase = 'active' | 'completed' | 'reviewing' | 'certified'

function statusToPhase(status: ProjectStatus): ProjectPhase {
  if (status === 'certified') return 'certified'
  if (status === 'reviewing') return 'reviewing'
  return 'active' // draft = 진행 중(완료 확정 전)
}

interface ProjectFlowState {
  phase: ProjectPhase
  forProjectId: string | null
  setPhase: (phase: ProjectPhase) => void
  // 프로젝트 진입 시 1회 초기화 — 같은 프로젝트면 FAB로 진행하던 상태를 유지한다.
  initForProject: (projectId: string, status: ProjectStatus) => void
}

export const useProjectFlow = create<ProjectFlowState>((set) => ({
  phase: 'active',
  forProjectId: null,
  setPhase: (phase) => set({ phase }),
  initForProject: (projectId, status) =>
    set((s) =>
      s.forProjectId === projectId
        ? s
        : { forProjectId: projectId, phase: statusToPhase(status) },
    ),
}))
