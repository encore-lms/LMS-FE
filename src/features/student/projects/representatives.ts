import { create } from 'zustand'

// 프로젝트 대표 후보 — 인증 완료 프로젝트만 별(★)로 지정/해제할 수 있고, 최대 3개까지 가능.
// 지정한 대표 후보는 목록 최상단에 노출된다(해제하면 최신순 자리로 복귀).
// 백엔드 없이 프론트 데모용(스토어 오버레이). 시드: mock에서 대표 후보였던 p1.
// BE 연동 시 서버 대표 후보 목록으로 대체하고 이 스토어는 제거.
export const MAX_REPRESENTATIVES = 3

type ToggleResult = 'added' | 'removed' | 'limit'

interface RepresentativesState {
  /** 대표 후보 프로젝트 id (지정 순서 보존). */
  ids: string[]
  /** 토글 결과: 추가/해제/한도초과. 한도 초과 시 상태 변경 없이 'limit' 반환. */
  toggle: (id: string) => ToggleResult
}

export const useRepresentatives = create<RepresentativesState>((set, get) => ({
  ids: ['p1'],
  toggle: (id) => {
    const cur = get().ids
    if (cur.includes(id)) {
      set({ ids: cur.filter((x) => x !== id) })
      return 'removed'
    }
    if (cur.length >= MAX_REPRESENTATIVES) return 'limit'
    set({ ids: [...cur, id] })
    return 'added'
  },
}))
