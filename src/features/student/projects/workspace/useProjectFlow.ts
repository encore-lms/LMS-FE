import { create } from 'zustand'
import type { ProjectStatus } from '../types'

// 프로젝트 생애주기 시뮬레이션 — 백엔드 없이 프론트에서 완료 확정·인증 흐름을 걸어볼 수 있게.
// active(작성 중) → completed(작성 완료·완료 확정 → 완료 배너·상호평가 열림)
//   → reviewing(인증 검토 중) → certified(인증 완료).
// 프로젝트별 단계를 보관해 워크스페이스와 목록(배지·필터·통계)이 같은 흐름을 공유한다.
// BE 연동 시: 단계는 서버 상태로 대체하고 이 스토어·테스트 FAB는 제거 가능.
export type ProjectPhase = 'active' | 'completed' | 'reviewing' | 'certified'

// 인증 완료 후 "수정 권한 요청" 서브상태 — certified 단계에서만 의미를 가진다(생애주기와 분리).
// none(수정 잠금) → requested(강사 승인 대기) → approved(시한부 수정 가능)
//   → submitted(강사 최종 확인 대기) → (최종 확인 시 none 으로 복귀).
export type EditRequestStatus = 'none' | 'requested' | 'approved' | 'submitted'

// 원본↔현재 비교(보조)에 쓰는 프로젝트 핵심 콘텐츠 — 목에서는 대표 2개 필드만.
export interface ProjectContent {
  설명: string
  산출물: string
}

export const DEFAULT_PROJECT_CONTENT: ProjectContent = {
  설명: '주문·결제·재고 도메인을 분리한 MSA 구조의 백엔드 프로젝트입니다.',
  산출물: 'API 명세서 v1.pdf',
}

export interface EditRequestState {
  status: EditRequestStatus
  /** 수정 권한 요청 사유 (수강생 작성, 필수) */
  requestReason?: string
  /** 수정 가능 만료 시각 — 강사 승인 시 부여(ISO). approved 동안 원본 수정 허용. */
  editAllowedUntil?: string
  /** 수정 완료 제출 시 작성한 변경 요약 */
  changeSummary?: string
  /** 승인 시점 원본 스냅샷 — '변경 전' (원본↔현재 보조 비교용). */
  snapshot?: ProjectContent
}

// 강사 승인 시 열리는 원본 수정 가능 기간(일). 만료되면 자동으로 다시 잠긴다.
export const EDIT_WINDOW_DAYS = 7

// 승인 시점 기준 만료 시각(ISO) — now + EDIT_WINDOW_DAYS.
export function editWindowUntilISO() {
  return new Date(
    Date.now() + EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()
}

// approved 상태인데 만료 시각이 지났는지 — true면 잠금(none)으로 자동 복귀시킨다.
export function isEditWindowExpired(er?: EditRequestState) {
  return (
    er?.status === 'approved' &&
    !!er.editAllowedUntil &&
    new Date(er.editAllowedUntil).getTime() < Date.now()
  )
}

// editAllowedUntil(ISO) → 'YYYY-MM-DD HH:mm' (표시용).
export function formatEditUntil(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

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
  // 프로젝트별 수정 권한 요청 상태(미설정이면 none).
  editRequests: Record<string, EditRequestState>
  setEditRequest: (projectId: string, patch: Partial<EditRequestState>) => void
  resetEditRequest: (projectId: string) => void
  // 프로젝트별 현재 콘텐츠(미설정이면 DEFAULT_PROJECT_CONTENT). 원본↔현재 비교의 '변경 후'.
  projectContent: Record<string, ProjectContent>
  setProjectContent: (projectId: string, patch: Partial<ProjectContent>) => void
}

export const useProjectFlow = create<ProjectFlowState>((set) => ({
  phases: {},
  setPhase: (projectId, phase) =>
    set((s) => ({ phases: { ...s.phases, [projectId]: phase } })),
  editRequests: {},
  setEditRequest: (projectId, patch) =>
    set((s) => {
      const prev: EditRequestState = s.editRequests[projectId] ?? {
        status: 'none',
      }
      return {
        editRequests: { ...s.editRequests, [projectId]: { ...prev, ...patch } },
      }
    }),
  resetEditRequest: (projectId) =>
    set((s) => ({
      editRequests: { ...s.editRequests, [projectId]: { status: 'none' } },
    })),
  projectContent: {},
  setProjectContent: (projectId, patch) =>
    set((s) => {
      const prev = s.projectContent[projectId] ?? DEFAULT_PROJECT_CONTENT
      return {
        projectContent: {
          ...s.projectContent,
          [projectId]: { ...prev, ...patch },
        },
      }
    }),
}))
