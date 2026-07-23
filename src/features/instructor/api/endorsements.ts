import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  Endorsement,
  EndorsementHistory,
  EndorsementQueue,
} from '@/shared/types'

// 강사 추천서 — /instructor/endorsements 묶음. baseURL이 /api라 경로 앞에 안 붙임.
// 수강생 로스터(이름 join·작성 대기 계산)는 콘솔 공용 useCohortRoster(api/console.ts) 사용.

// 목록/작성 화면: 작성 대기 카드 + 최근 작성 추천서.
// 강사는 기수를 여러 개 담당하므로 선택 기수로 조회한다(미지정 시 서버가 기본 기수로 폴백).
export function useEndorsementQueue(cohortId?: string | null) {
  return useQuery({
    queryKey: [...instructorKeys.endorsements(), cohortId ?? ''],
    queryFn: () =>
      apiClient
        .get<EndorsementQueue>('/instructor/endorsements', {
          cohortId: cohortId ?? undefined,
        })
        .then((r) => r.data),
  })
}

// 전체 보기: 누적 추천서 큐 + KPI.
export function useEndorsementHistory() {
  return useQuery({
    queryKey: instructorKeys.endorsementHistory(),
    queryFn: () =>
      apiClient
        .get<EndorsementHistory>('/instructor/endorsements/history')
        .then((r) => r.data),
  })
}

// 상세/수정: 추천서 1건.
export function useEndorsement(endorsementId: string) {
  return useQuery({
    queryKey: instructorKeys.endorsementDetail(endorsementId),
    queryFn: () =>
      apiClient
        .get<Endorsement>(`/instructor/endorsements/${endorsementId}`)
        .then((r) => r.data),
    enabled: Boolean(endorsementId),
  })
}

// ── 작성/수정/삭제 (mutations) — mock 백엔드. 실 BE 계약 확정 시 페어가 shared PR로 교체. ──
export interface SubmitEndorsementInput {
  studentId: string
  comment: string
  /** 대상 기수 — 강사가 여러 기수를 담당하므로 화면이 고른 기수로 저장한다. */
  cohortId?: string | null
}
// 신규 추천서 제출 — 작성 대기에서 빠지고 최근/전체 보기 큐에 추가된다.
export function useSubmitEndorsement() {
  const qc = useQueryClient()
  return useMutation<Endorsement, Error, SubmitEndorsementInput>({
    mutationFn: (input) =>
      apiClient
        .post<Endorsement>('/instructor/endorsements', input)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.endorsements() })
      qc.invalidateQueries({ queryKey: instructorKeys.endorsementHistory() })
    },
  })
}

export interface UpdateEndorsementInput {
  comment: string
}
// 24h 수정 창 안에서 기존 추천서 코멘트 수정.
export function useUpdateEndorsement(endorsementId: string) {
  const qc = useQueryClient()
  return useMutation<Endorsement, Error, UpdateEndorsementInput>({
    mutationFn: (input) =>
      apiClient
        .patch<Endorsement>(`/instructor/endorsements/${endorsementId}`, input)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: instructorKeys.endorsementDetail(endorsementId),
      })
      qc.invalidateQueries({ queryKey: instructorKeys.endorsements() })
      qc.invalidateQueries({ queryKey: instructorKeys.endorsementHistory() })
    },
  })
}

// 추천서 삭제.
export function useDeleteEndorsement() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (endorsementId) =>
      apiClient
        .delete<void>(`/instructor/endorsements/${endorsementId}`)
        .then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.endorsements() })
      qc.invalidateQueries({ queryKey: instructorKeys.endorsementHistory() })
    },
  })
}
