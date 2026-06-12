import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mentorKeys } from '../queryKeys'
import type {
  MentorDashboardData,
  MentorTeamDetailData,
  MentorTeamsData,
} from '../types'

// 멘토 콘솔 데이터 — P0_32_35 API명세 /api/mentor/v1/* (apiClient baseURL이 /api라 /mentor/v1부터).
// 화면은 teamId 사용, 서버가 teamId→본인 assignment 재검증(scope: MentorTeamAssignment.mentorUserId).

export function useMentorDashboard() {
  return useQuery({
    queryKey: mentorKeys.dashboard(),
    queryFn: () =>
      apiClient
        .get<MentorDashboardData>('/mentor/v1/dashboard')
        .then((r) => r.data),
  })
}

export function useMentorTeams() {
  return useQuery({
    queryKey: mentorKeys.teams(),
    queryFn: () =>
      apiClient.get<MentorTeamsData>('/mentor/v1/teams').then((r) => r.data),
  })
}

export function useMentorTeamDetail(teamId: string) {
  return useQuery({
    queryKey: mentorKeys.teamDetail(teamId),
    enabled: !!teamId,
    queryFn: () =>
      apiClient
        .get<MentorTeamDetailData>(`/mentor/v1/teams/${teamId}`)
        .then((r) => r.data),
  })
}
