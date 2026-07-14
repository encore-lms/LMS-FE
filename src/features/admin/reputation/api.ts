import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminReputationKeys } from './queryKeys'
import type { PushTarget, ReputationOverview, ReputationStudent } from './types'

// 평판 관리 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
//
// cohortIds — 조회 범위 기수(선택 기수 1개 또는 선택 과정의 전체 기수).
// 요약(KPI·누락 수)까지 서버가 이 범위로 집계한다. 범위가 정해지기 전(과정·기수 로딩 중)엔
// 조회하지 않는다 — 파라미터 없이 부르면 전 기수 합계가 잠깐 보였다가 바뀌기 때문.
export function useReputation(cohortIds: string[] | undefined) {
  return useQuery({
    queryKey: adminReputationKeys.overview(cohortIds),
    enabled: !!cohortIds?.length,
    queryFn: () =>
      apiClient
        // 2번째 인자는 params 객체 그대로다 — { params: ... } 로 감싸면 params[cohortIds]= 로 나간다.
        .get<ReputationOverview>('/admin/reputation', {
          cohortIds: cohortIds?.join(','),
        })
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
      // 기수 범위별로 캐시가 나뉘므로 평판 조회 캐시 전체에 반영한다.
      queryClient.setQueriesData<ReputationOverview>(
        { queryKey: adminReputationKeys.all },
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
