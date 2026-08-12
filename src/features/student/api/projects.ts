import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { apiClient } from '@/shared/api'
import { useAuth } from '@/shared/store/auth'
import { projectKeys } from '../projects/queryKeys'
import type {
  ProjectInvitation,
  ProjectListData,
  ProjectSummary,
  ProjectWizardData,
  WorkspaceData,
} from '../projects/types'

export interface CreateProjectInput {
  name: string
  desc: string
  start: string
  end: string
  teamSize: number
  stacks: string[]
  domain: string
  deliverables: string[]
  memberUserIds?: string[]
}

// 프로젝트 훅 — 엔드포인트가 /student/* 라 학생 feature 소유. baseURL /api 라 경로 앞 /api 생략.
export function useProjectList() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: () =>
      apiClient.get<ProjectListData>('/student/projects').then((r) => r.data),
  })
}

/**
 * 내가 받은 초대 — 아직 답하지 않은 것만.
 *
 * <p>받아들이기 전에는 프로젝트 목록에도 워크스페이스에도 없다(팀이 아니니까). 알림을
 * 지우면 초대받은 사실로 가는 길이 끊기므로 목록 화면이 따로 들고 있어야 한다.</p>
 */
export function useProjectInvitations() {
  return useQuery({
    queryKey: projectKeys.invitations(),
    queryFn: () =>
      apiClient
        .get<{
          invitations: ProjectInvitation[]
        }>('/student/projects/invitations')
        .then((r) => r.data.invitations),
  })
}

/** 초대에 답한다 — 수락하면 그때부터 팀원, 거절하면 목록에서 사라진다. */
export function useAnswerInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      answer,
    }: {
      projectId: string
      answer: 'accept' | 'decline'
    }) => apiClient.post(`/student/projects/${projectId}/invitation/${answer}`),
    onSuccess: () => {
      // 수락하면 프로젝트가 하나 늘어난다 — 목록도 함께 새로 받는다.
      void queryClient.invalidateQueries({
        queryKey: projectKeys.invitations(),
      })
      void queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

export function useProjectWizard() {
  const { user } = useAuth()
  return useQuery({
    queryKey: projectKeys.wizard(),
    queryFn: async () => {
      // 같은 기수 동료(/users/peers)를 팀원 후보로, 본인을 PM으로 합성(실 BE join).
      const res = await apiClient.get<{
        items: { userId: string; name: string }[]
      }>('/users/peers')
      const candidates = (res.data.items ?? []).map((p, i) => ({
        id: p.userId,
        name: p.name,
        meta: '같은 기수 동료',
        avatarTone: (
          ['brand', 'info', 'warning', 'danger', 'accent', 'success'] as const
        )[i % 6],
      }))
      return {
        cohortLabel: '같은 기수',
        pmName: user?.name ?? '나',
        pmMeta: 'PM · 본인',
        candidates,
      } satisfies ProjectWizardData
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      // BE(/student/projects, §42/§48/§45) 계약으로 변환 — name→title, 기간·스택 저장.
      const body = {
        title: input.name,
        kind: input.teamSize > 1 ? 'team' : 'personal',
        teamSize: input.teamSize,
        start: input.start,
        end: input.end,
        stacks: input.stacks,
        memberUserIds: input.memberUserIds ?? [],
      }
      const res = await apiClient.post<ProjectSummary>(
        '/student/projects',
        body,
      )
      return res.data
    },
    // 생성 후 목록을 다시 불러와 새 프로젝트를 반영.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

export function useProjectWorkspace(id: string) {
  return useQuery({
    queryKey: projectKeys.workspace(id),
    queryFn: () =>
      apiClient
        .get<WorkspaceData>(`/student/projects/${id}`)
        .then((r) => r.data),
  })
}

// 프로젝트 삭제 — 모든 프로젝트(기본·신규 공통) 대상. 성공 시 목록 갱신.
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<{ id: string }>(`/student/projects/${id}`)
      return id
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

// ── 워크스페이스 쓰기(BE #75) — 성공 시 워크스페이스 캐시 무효화 ──
/**
 * 워크스페이스 쓰기 실패 안내 — 인증 동결(409)은 고정 안내로, 그 외에는 BE 메시지를 우선 표시.
 * BE는 인증 완료(CERTIFIED) 프로젝트의 수정을 409로 막는다(assertEditable).
 */
export function wsWriteError(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    if (e.response?.status === 409)
      return '현재 프로젝트는 인증이 완료된 프로젝트입니다.\n수정 요청 후 재요청하세요.'
    const msg = (e.response?.data as { message?: string } | undefined)?.message
    if (msg) return msg
  }
  return fallback
}

function useWsMutation<TVars>(
  fn: (id: string, vars: TVars) => Promise<unknown>,
  projectId: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: TVars) => fn(projectId, vars),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: projectKeys.workspace(projectId) }),
  })
}

export function useAddTask(projectId: string) {
  return useWsMutation<{
    title: string
    description?: string
    status?: string
    startAt?: string
    dueAt?: string
    assigneeMemberIds?: string[]
  }>((id, v) => apiClient.post(`/student/projects/${id}/tasks`, v), projectId)
}
export function useUpdateTaskStatus(projectId: string) {
  return useWsMutation<{ taskId: string; status: string }>(
    (id, v) =>
      apiClient.put(`/student/projects/${id}/tasks/${v.taskId}/status`, {
        status: v.status,
      }),
    projectId,
  )
}
export function useAddMeeting(projectId: string) {
  return useWsMutation<{ title: string; body?: string; heldAt?: string }>(
    (id, v) => apiClient.post(`/student/projects/${id}/meetings`, v),
    projectId,
  )
}
export function useAddArtifact(projectId: string) {
  return useWsMutation<{ artifactType: string; title: string; url?: string }>(
    (id, v) => apiClient.post(`/student/projects/${id}/artifacts`, v),
    projectId,
  )
}
/** 상호평가 제출 — scores 는 4축 순서(기술/기술기여 · 소통·협업·팀워크 · 문제해결 · 책임감), 전 축 1~5 필수. */
export function useSubmitPeerEval(projectId: string) {
  return useWsMutation<{
    targetMemberId: string
    scores: number[]
    comment?: string
  }>(
    (id, v) => apiClient.post(`/student/projects/${id}/peer-evaluations`, v),
    projectId,
  )
}
/** 상호평가 임시저장 — 자기 수행 내용 + 팀원별 점수(미입력 0)·코멘트를 함께 보관(제출로 세지 않음). */
export function useSavePeerEvalDraft(projectId: string) {
  return useWsMutation<{
    selfReview: string
    evaluations: {
      targetMemberId: string
      scores: number[]
      comment?: string
    }[]
  }>(
    (id, v) =>
      apiClient.post(`/student/projects/${id}/peer-evaluations/draft`, v),
    projectId,
  )
}

export function useSaveSelfReview(projectId: string) {
  return useWsMutation<{ content: string }>(
    (id, v) => apiClient.put(`/student/projects/${id}/self-review`, v),
    projectId,
  )
}
export function useRequestCertification(projectId: string) {
  return useWsMutation<void>(
    (id) => apiClient.post(`/student/projects/${id}/certification`),
    projectId,
  )
}

// 설정 탭 — 이름·기간 수정(PM 전용). 날짜는 YYYY-MM-DD.
export function useUpdateProjectInfo(projectId: string) {
  return useWsMutation<{ title: string; start?: string; end?: string }>(
    (id, v) => apiClient.put(`/student/projects/${id}/info`, v),
    projectId,
  )
}
// 설정 탭 — 기술 카테고리 교체(팀원 누구나). stacks 전체로 덮어씀.
export function useUpdateProjectTechStacks(projectId: string) {
  return useWsMutation<{ stacks: string[] }>(
    (id, v) => apiClient.put(`/student/projects/${id}/tech-stacks`, v),
    projectId,
  )
}

// 산출물 파일 업로드(multipart, BE #78) — 성공 시 워크스페이스 무효화
export function useUploadArtifactFile(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title?: string; file: File }) => {
      const fd = new FormData()
      if (input.title) fd.append('title', input.title)
      fd.append('file', input.file)
      return apiClient.postForm(
        `/student/projects/${projectId}/artifacts/file`,
        fd,
      )
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: projectKeys.workspace(projectId) }),
  })
}

// 일정 추가(§48)
export function useAddSchedule(projectId: string) {
  return useWsMutation<{ title: string; date: string }>(
    (id, v) => apiClient.post(`/student/projects/${id}/schedules`, v),
    projectId,
  )
}
// 성과지표 추가(§46)
export function useAddMetric(projectId: string) {
  return useWsMutation<{
    label: string
    description?: string
    beforeValue?: string
    afterValue?: string
    changeLabel?: string
    changeDirection?: string
  }>((id, v) => apiClient.post(`/student/projects/${id}/metrics`, v), projectId)
}

// ── 워크스페이스 항목 수정·삭제 ──────────────────────────────────────────
// 추가만 있던 탓에 오타 하나도 고칠 수 없었다. 권한은 추가와 같은 기준(참여 멤버·인증 전).

export function useEditTask(projectId: string) {
  return useWsMutation<{
    taskId: string
    title: string
    description?: string
    status?: string
    startAt?: string
    dueAt?: string
    assigneeMemberIds?: string[]
  }>(
    (id, { taskId, ...body }) =>
      apiClient.put(`/student/projects/${id}/tasks/${taskId}`, body),
    projectId,
  )
}
export function useDeleteTask(projectId: string) {
  return useWsMutation<{ taskId: string }>(
    (id, v) => apiClient.delete(`/student/projects/${id}/tasks/${v.taskId}`),
    projectId,
  )
}
export function useEditMeeting(projectId: string) {
  return useWsMutation<{
    meetingId: string
    title: string
    body?: string
    heldAt?: string
  }>(
    (id, { meetingId, ...body }) =>
      apiClient.put(`/student/projects/${id}/meetings/${meetingId}`, body),
    projectId,
  )
}
export function useDeleteMeeting(projectId: string) {
  return useWsMutation<{ meetingId: string }>(
    (id, v) =>
      apiClient.delete(`/student/projects/${id}/meetings/${v.meetingId}`),
    projectId,
  )
}
export function useEditArtifact(projectId: string) {
  return useWsMutation<{
    artifactId: string
    artifactType?: string
    title: string
    url?: string
  }>(
    (id, { artifactId, ...body }) =>
      apiClient.put(`/student/projects/${id}/artifacts/${artifactId}`, body),
    projectId,
  )
}
export function useDeleteArtifact(projectId: string) {
  return useWsMutation<{ artifactId: string }>(
    (id, v) =>
      apiClient.delete(`/student/projects/${id}/artifacts/${v.artifactId}`),
    projectId,
  )
}
export function useEditSchedule(projectId: string) {
  return useWsMutation<{
    scheduleId: string
    title: string
    description?: string
    startsAt: string
    /** 비우면 하루짜리 일정으로 저장된다. */
    endsAt?: string
  }>(
    (id, { scheduleId, ...body }) =>
      apiClient.put(`/student/projects/${id}/schedules/${scheduleId}`, body),
    projectId,
  )
}
export function useDeleteSchedule(projectId: string) {
  return useWsMutation<{ scheduleId: string }>(
    (id, v) =>
      apiClient.delete(`/student/projects/${id}/schedules/${v.scheduleId}`),
    projectId,
  )
}
export function useEditMetric(projectId: string) {
  return useWsMutation<{
    metricId: string
    label: string
    description?: string
    beforeValue?: string
    afterValue?: string
    changeLabel?: string
    changeDirection?: string
  }>(
    (id, { metricId, ...body }) =>
      apiClient.put(`/student/projects/${id}/metrics/${metricId}`, body),
    projectId,
  )
}
export function useDeleteMetric(projectId: string) {
  return useWsMutation<{ metricId: string }>(
    (id, v) =>
      apiClient.delete(`/student/projects/${id}/metrics/${v.metricId}`),
    projectId,
  )
}

// 트러블슈팅 연결/해제(§52)
export function useLinkTroubleshooting(projectId: string) {
  return useWsMutation<{ troubleshootingCaseId: string }>(
    (id, v) =>
      apiClient.post(`/student/projects/${id}/troubleshooting-links`, v),
    projectId,
  )
}
export function useUnlinkTroubleshooting(projectId: string) {
  return useWsMutation<{ caseId: string }>(
    (id, v) =>
      apiClient.delete(
        `/student/projects/${id}/troubleshooting-links/${v.caseId}`,
      ),
    projectId,
  )
}
// 팀원 초대/삭제(§43)
export function useInviteMember(projectId: string) {
  return useWsMutation<{ userId: string; role?: string }>(
    (id, v) => apiClient.post(`/student/projects/${id}/members`, v),
    projectId,
  )
}
export function useRemoveMember(projectId: string) {
  return useWsMutation<{ memberId: string }>(
    (id, v) =>
      apiClient.delete(`/student/projects/${id}/members/${v.memberId}`),
    projectId,
  )
}
// 팀원 수정 — specialty(전문분야, 누구나)·makePm(PM 위임, 현재 PM만)
export function useUpdateMember(projectId: string) {
  return useWsMutation<{
    memberId: string
    specialty?: string
    makePm?: boolean
  }>(
    (id, v) =>
      apiClient.put(`/student/projects/${id}/members/${v.memberId}`, {
        specialty: v.specialty,
        makePm: v.makePm,
      }),
    projectId,
  )
}
