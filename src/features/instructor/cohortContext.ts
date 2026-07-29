import { create } from 'zustand'

// 강사 "선택 기수" 공용 컨텍스트 — 대시보드에서 고른 기수를 검토 화면 등으로 이어 유지(§2).
// 화면 이동 시에도 선택이 유지되도록 zustand로 보관. 'all' = 전체(통합).
interface CohortContextState {
  cohortId: string // 'all' | 'da-4' | 'fe-7'
  setCohortId: (id: string) => void
}

export const useCohortContext = create<CohortContextState>((set) => ({
  cohortId: 'all',
  setCohortId: (id) => set({ cohortId: id }),
}))

// 기수 id ↔ 라벨 매핑(mock 기준). 검토 필터는 라벨(cohortLabel) 기반이라 변환에 사용.
export const COHORT_ID_TO_LABEL: Record<string, string> = {
  all: '전체',
  'da-4': 'DA 4기',
  'fe-7': 'FE 7기',
}

export const COHORT_LABEL_TO_ID: Record<string, string> = {
  전체: 'all',
  'DA 4기': 'da-4',
  'FE 7기': 'fe-7',
}
