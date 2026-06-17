import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminReputationKeys } from './queryKeys'
import type { PushTarget, ReputationOverview, ReputationStudent } from './types'

// 평판 관리 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useReputation() {
  return useQuery({
    queryKey: adminReputationKeys.overview(),
    queryFn: () =>
      apiClient
        .get<ReputationOverview>('/admin/reputation')
        .then((r) => r.data),
  })
}

/** 평판 요청 푸시 입력 — 단건(수강생·대상) 또는 누락 일괄 */
export type ReputationPushInput =
  | { kind: 'single'; studentId: string; target: PushTarget; memo?: string }
  | { kind: 'bulk'; memo?: string }

// 평판 요청 푸시 훅 — 성공 시 푸시한 대상을 목록에서 제거하고 강사 추천서를 '요청 중'으로 전이 + 누락 카운트 재계산.
// BE 계약(P0_25 LMS 알림) 미확정 → 네트워크 없이 클라이언트 낙관 반영으로 시뮬레이션한다.
// 계약 확정 시 mutationFn 을 apiClient.post('/admin/reputation/push', input) 로 교체한다.
export function useReputationPush() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, ReputationPushInput>({
    mutationFn: async () => {},
    onSuccess: (_result, input) => {
      queryClient.setQueryData<ReputationOverview>(
        adminReputationKeys.overview(),
        (prev) => {
          if (!prev) return prev
          // 푸시한 대상은 버튼 목록에서 제거하고, 강사 푸시는 추천서 상태를 '요청 중'으로 올린다.
          const pushOne = (
            s: ReputationStudent,
            targets: PushTarget[],
          ): ReputationStudent => ({
            ...s,
            pushTargets: s.pushTargets.filter((t) => !targets.includes(t)),
            endorsementStatus:
              targets.includes('instructor') &&
              s.endorsementStatus === 'not_collected'
                ? 'requesting'
                : s.endorsementStatus,
          })
          const students = prev.students.map((s) => {
            if (input.kind === 'bulk') return pushOne(s, s.pushTargets)
            return s.id === input.studentId ? pushOne(s, [input.target]) : s
          })
          return {
            ...prev,
            students,
            summary: {
              ...prev.summary,
              missingStudents: students.filter((s) => s.pushTargets.length > 0)
                .length,
            },
          }
        },
      )
    },
  })
}
