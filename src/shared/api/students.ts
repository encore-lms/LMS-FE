import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { adminKeys } from './queryKeys'
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
export function useStudentAccounts(cohortId?: string | null) {
  return useQuery({
    queryKey: adminKeys.studentAccounts({ cohortId: cohortId ?? undefined }),
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
