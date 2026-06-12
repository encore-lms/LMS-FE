import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mentorKeys } from '../queryKeys'
import type { MenteeDetailData } from '../types'

// 학생 상세 — P0_32 API명세 GET /api/mentor/v1/mentees/{studentProfileId}.
// 팀 상세에서만 진입하는 보조 상세(독립 목록 endpoint 없음) — 조회 전용 화면.

export function useMenteeDetail(studentId: string) {
  return useQuery({
    queryKey: mentorKeys.mentee(studentId),
    enabled: !!studentId,
    queryFn: () =>
      apiClient
        .get<MenteeDetailData>(`/mentor/v1/mentees/${studentId}`)
        .then((r) => r.data),
  })
}
