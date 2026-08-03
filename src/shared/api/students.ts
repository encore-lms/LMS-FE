import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { adminKeys, instructorKeys } from './queryKeys'
import type { StudentAccount, StudentAccountQueue } from '@/shared/types'

// 수강생 계정(auth-user-service /users/students) 목록 — 운영·강사 화면이 공유하는 읽기 훅.
// 실 BE 전용(mock 모드에선 mock 토큰이라 401). 운영(계정/출결/교육 패널)과 강사(제출·채점)
// 양쪽이 학생 명단을 필요로 해 shared로 승격. 캐시 키는 기존 adminKeys.studentAccounts를
// 그대로 유지해 useSyncStudents 등의 무효화와 계속 맞물린다.

// auth-service 학생 목록 원본.
interface RawStudent {
  userId: string
  studentUuid: string
  name: string
  birth: string | null
  status: string // ACTIVE | INACTIVE | BLOCKED
  lastLoginAt: string | null
  createdAt: string
  test: boolean
}
interface RawStudentPage {
  content: RawStudent[]
  totalElements: number
}

function toAccount(s: RawStudent): StudentAccount {
  return {
    id: s.userId,
    name: s.name,
    studentUuid: s.studentUuid,
    birthDate: s.birth ?? '-',
    joinedAt: s.createdAt ? s.createdAt.slice(5, 10) : '-',
    lastLoginAt: s.lastLoginAt ? s.lastLoginAt.slice(0, 10) : null,
    trainingStatus: s.status === 'INACTIVE' ? 'dropout' : 'active',
    loginBlocked: s.status === 'BLOCKED',
    isTest: s.test ?? false,
  }
}

// 수강생 계정 목록 — /users/students 실연동(StudentAccountQueue로 매핑해 기존 화면 유지).
// cohortId가 있으면 해당 기수 배정 학생만 조회(선택 즉시 목록 갱신).
export function useStudentAccounts(cohortId?: string | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.studentAccounts({ cohortId: cohortId ?? undefined }),
    enabled,
    queryFn: () =>
      apiClient
        .get<RawStudentPage>('/users/students', {
          size: 100,
          ...(cohortId ? { cohortId } : {}),
        })
        .then((r) => {
          const items = (r.data.content ?? []).map(toAccount)
          const queue: StudentAccountQueue = {
            cohortLabel: '전체',
            items,
            summary: {
              total: r.data.totalElements ?? items.length,
              normal: items.filter(
                (a) => !a.loginBlocked && a.trainingStatus !== 'dropout',
              ).length,
              loginBlocked: items.filter((a) => a.loginBlocked).length,
              lastSyncAt: '-',
              syncCreated: 0,
              syncExisting: 0,
            },
          }
          return queue
        }),
  })
}

/**
 * 수강생 로그인 차단/해제.
 *
 * <p>예전에는 화면 state 만 바꿔, 차단해 놓고 새로고침하면 풀린 것처럼 보였다.
 * 서버 status(ACTIVE/BLOCKED)가 정본이고 로그인 검사도 그 값을 본다.</p>
 */
export function useChangeLoginBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, blocked }: { userId: string; blocked: boolean }) =>
      apiClient.patch(`/users/students/${userId}/login-block`, { blocked }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.studentAccounts() })
    },
  })
}

/** 담당 기수 수강생 1명 — 이름 join·작성 대기 계산용. */
export interface CohortStudent {
  userId: string
  name: string
}

/**
 * 기수 수강생 로스터 — auth-user-service의 기수 스코프 명단(강사 허용, 운영도 사용 가능).
 * learning 응답(이력서·자료실·추천서)은 userId만 주므로 화면이 여기서 이름을 join 한다.
 * 강사 다수 화면 + 공용 MaterialsPane이 함께 써 shared 로 승격(2026-08-03, 구 위치:
 * features/instructor/api/console.ts). 캐시 키는 기존 instructorKeys 기반을 그대로 유지.
 */
export function useCohortRoster(cohortId?: string | null) {
  return useQuery({
    queryKey: [...instructorKeys.all, 'cohort-roster', cohortId ?? ''],
    enabled: !!cohortId,
    queryFn: () =>
      apiClient
        .get<{ items: CohortStudent[] }>('/users/cohort-students', { cohortId })
        .then((r) => r.data.items),
  })
}
