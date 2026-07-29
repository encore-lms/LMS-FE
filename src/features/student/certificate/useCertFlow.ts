import { create } from 'zustand'
import type { CertStatus } from './types'

// 증명서 라이프사이클 상태 시뮬레이션 — 백엔드 없이 프론트에서 전이를 walkable하게.
// BE 연동 시: 초기값을 GET /student/certificate 의 header.status 로 채우고,
// 요청/재요청/공개 적용은 각 PATCH 엔드포인트 호출로 교체하면 이 스토어는 제거 가능.
interface CertFlowState {
  status: CertStatus
  setStatus: (s: CertStatus) => void
}

export const useCertFlow = create<CertFlowState>((set) => ({
  status: 'draft', // 데모 시작 = 정식 인증 전(앞에서부터 전체 흐름을 걸어볼 수 있도록)
  setStatus: (status) => set({ status }),
}))
