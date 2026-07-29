import { create } from 'zustand'
import { formatDateTime } from '@/shared/lib/date'
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
export type EditRequestStatus =
  | 'none'
  | 'requested'
  | 'approved'
  | 'submitted'
  | 'rejected'

// 원본↔현재 비교(보조)에 쓰는 프로젝트 핵심 콘텐츠 — 목에서는 대표 2개 필드만.
export interface ProjectContent {
  설명: string
  산출물: string
}

/** 변경 전/후 한 줄 — 서버 응답 그대로(label·before·after). */
export interface ChangeDiff {
  label: string
  before: string | null
  after: string | null
}

export interface EditRequestState {
  status: EditRequestStatus
  /** 수정 권한 요청 사유 (수강생 작성, 필수) */
  requestReason?: string
  /** 수정 가능 만료 시각 — 강사 승인 시 부여(ISO). approved 동안 원본 수정 허용. */
  editAllowedUntil?: string
  /** 수정 완료 제출 시 작성한 변경 요약 */
  changeSummary?: string
  /** 강사가 승인·반려하며 남긴 사유. 반려됐을 때 무엇이 부족했는지 알려준다. */
  decisionReason?: string
  /**
   * 승인 시점 원본 스냅샷 — 서버가 내려주는 '변경 전'(label·before).
   * 예전에는 프론트가 하드코딩한 예시 문구를 모든 프로젝트에 똑같이 보여줬다.
   */
  changes?: ChangeDiff[]
}

// approved 상태인데 만료 시각이 지났는지 — true면 잠금(none)으로 자동 복귀시킨다.
// (수정 가능 기간 정책은 서버가 editAllowedUntil로 내려준다.)
export function isEditWindowExpired(er?: EditRequestState) {
  return (
    er?.status === 'approved' &&
    !!er.editAllowedUntil &&
    new Date(er.editAllowedUntil).getTime() < Date.now()
  )
}

// editAllowedUntil(ISO) → 'YYYY-MM-DD HH:mm' (표시용). 파싱 실패 시 원문 그대로(기존 동작 유지).
export function formatEditUntil(iso?: string) {
  if (!iso) return ''
  return formatDateTime(iso) || iso
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
}))
