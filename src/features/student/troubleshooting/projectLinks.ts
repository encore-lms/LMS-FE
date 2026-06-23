import { create } from 'zustand'

// 프로젝트(워크스페이스) ↔ 트러블슈팅 사례 연결 — 연결 방향은 프로젝트 → 사례.
// 프로젝트별로 "인증 완료된" 트러블슈팅 사례 id 목록을 핀으로 보관한다(보기 전용).
// 백엔드 없이 프론트 데모용. BE 연동 시 서버 연결 목록으로 대체하고 이 스토어는 제거.
//
// 시드: 기존 mock의 프로젝트 연결(ts1·ts6 → p1, ts9 → p2)을 초기 연결로 재사용.
// (모두 인증 완료 사례 — 연결은 인증 완료만 허용)
interface ProjectTsLinksState {
  /** projectId → 연결된 사례 id[] */
  links: Record<string, string[]>
  link: (projectId: string, caseId: string) => void
  unlink: (projectId: string, caseId: string) => void
}

const SEED: Record<string, string[]> = {
  p1: ['ts1', 'ts6'],
  p2: ['ts9'],
}

export const useProjectTsLinks = create<ProjectTsLinksState>((set) => ({
  links: SEED,
  link: (projectId, caseId) =>
    set((s) => {
      const cur = s.links[projectId] ?? []
      if (cur.includes(caseId)) return s
      return { links: { ...s.links, [projectId]: [...cur, caseId] } }
    }),
  unlink: (projectId, caseId) =>
    set((s) => {
      const cur = s.links[projectId] ?? []
      return {
        links: { ...s.links, [projectId]: cur.filter((x) => x !== caseId) },
      }
    }),
}))
