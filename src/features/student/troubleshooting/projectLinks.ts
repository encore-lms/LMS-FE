import { create } from 'zustand'

// 프로젝트(워크스페이스) ↔ 트러블슈팅 사례 연결 — 연결 방향은 프로젝트 → 사례.
// 프로젝트별로 "인증 완료된" 트러블슈팅 사례 id 목록을 핀으로 보관한다(보기 전용).
// 백엔드 없이 프론트 데모용. BE 연동 시 서버 연결 목록으로 대체하고 이 스토어는 제거.
//
// 프로젝트마다 "해당되는" 트러블슈팅이 다르게 보이도록, 알려진 프로젝트는 프로젝트별 기본
// 연결(SEED)을 사용한다 — 모두 인증 완료 사례, 프로젝트 성격에 맞춰 분배(겹치지 않음).
// 신규/미등록 프로젝트는 빈 목록으로 시작해 사용자가 관련 인증 사례를 직접 연결한다.
// 사용자가 연결/해제하면 그 프로젝트만 명시적 목록으로 분기(고정)된다.
const SEED: Record<string, string[]> = {
  p1: ['ts1', 'ts4', 'ts6'], // 주문 관리 MSA — Kafka 중복·MySQL 데드락·배포 토큰
  p2: ['ts11', 'ts8'], // 실시간 채팅 서버 — WebSocket 재연결·배포 캐시 무효화
  p3: ['ts10', 'ts12'], // 포트폴리오 REST API — CORS 프리플라이트·타임존 집계
}

interface ProjectTsLinksState {
  /** projectId → 연결된 사례 id[]. 키가 없으면 SEED(또는 빈 목록)로 간주. */
  links: Record<string, string[]>
  /** 해당 프로젝트의 현재 연결 목록(명시 없으면 프로젝트별 기본값, 그것도 없으면 빈 목록). */
  linksFor: (projectId: string) => string[]
  link: (projectId: string, caseId: string) => void
  unlink: (projectId: string, caseId: string) => void
}

export const useProjectTsLinks = create<ProjectTsLinksState>((set, get) => ({
  links: {},
  linksFor: (projectId) => get().links[projectId] ?? SEED[projectId] ?? [],
  link: (projectId, caseId) =>
    set((s) => {
      const cur = s.links[projectId] ?? SEED[projectId] ?? []
      if (cur.includes(caseId)) return s
      return { links: { ...s.links, [projectId]: [...cur, caseId] } }
    }),
  unlink: (projectId, caseId) =>
    set((s) => {
      const cur = s.links[projectId] ?? SEED[projectId] ?? []
      return {
        links: { ...s.links, [projectId]: cur.filter((x) => x !== caseId) },
      }
    }),
}))
