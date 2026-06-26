import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type {
  SettingsHubData,
  OpsAccountsData,
  HrdApiKey,
  HrdKeyListData,
  HrdKeyHistoryData,
  HrdKeyHistoryAction,
  HrdKeySummary,
  HrdKeyTestResult,
  CourseListItem,
  CourseConfigDetail,
  HrdCourseSearchData,
} from '@/shared/types'
import type { SettingsAuditData } from '../settings/settingsAudit.types'

// 운영 설정 Flow 10 (/admin/settings/*) 데이터. baseURL이 /api라 경로 앞에 안 붙임.
export function useSettingsHub() {
  return useQuery({
    queryKey: adminKeys.settingsHub(),
    queryFn: () =>
      apiClient.get<SettingsHubData>('/admin/settings/hub').then((r) => r.data),
  })
}

export function useOpsAccounts() {
  return useQuery({
    queryKey: adminKeys.settingsAccounts(),
    queryFn: () =>
      apiClient
        .get<OpsAccountsData>('/admin/settings/accounts')
        .then((r) => r.data),
  })
}

// ── HRD API Key (learning-service /admin/hrd-keys) ──
// baseURL '/api' + dev proxy(rewrite로 /api 제거)로 :8082 learning-service에 도달.

export interface HrdKeyListParams {
  page?: number
  size?: number
  query?: string
  active?: boolean
  sort?: 'latest' | 'name'
}

export function useHrdKeyList(params: HrdKeyListParams = {}) {
  return useQuery({
    queryKey: adminKeys.settingsHrdKeyList(params),
    // 페이지·검색 전환 시 이전 결과 유지(깜빡임 방지).
    placeholderData: keepPreviousData,
    queryFn: () =>
      apiClient
        .get<HrdKeyListData>('/admin/hrd-keys', {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sort: params.sort ?? 'latest',
          ...(params.query ? { query: params.query } : {}),
          ...(params.active != null ? { active: params.active } : {}),
        })
        .then((r) => r.data),
  })
}

export function useHrdKeySummary() {
  return useQuery({
    queryKey: adminKeys.settingsHrdKeySummary(),
    queryFn: () =>
      apiClient
        .get<HrdKeySummary>('/admin/hrd-keys/summary')
        .then((r) => r.data),
  })
}

export interface HrdKeyHistoryParams {
  page?: number
  size?: number
  action?: HrdKeyHistoryAction | 'all'
}

export function useHrdKeyHistory(params: HrdKeyHistoryParams = {}) {
  return useQuery({
    queryKey: adminKeys.settingsHrdKeyHistory(params),
    placeholderData: keepPreviousData,
    queryFn: () =>
      apiClient
        .get<HrdKeyHistoryData>('/admin/hrd-keys/history', {
          page: params.page ?? 0,
          size: params.size ?? 20,
          // 'all'·미지정이면 action 파라미터를 보내지 않음(BE 전체 조회).
          ...(params.action && params.action !== 'all'
            ? { action: params.action }
            : {}),
        })
        .then((r) => r.data),
  })
}

export interface HrdKeyCreateInput {
  name: string
  keyValue: string
  description?: string
  active?: boolean
}

export function useCreateHrdKey() {
  const queryClient = useQueryClient()
  return useMutation<HrdApiKey, Error, HrdKeyCreateInput>({
    mutationFn: (input) =>
      apiClient.post<HrdApiKey>('/admin/hrd-keys', input).then((r) => r.data),
    // 목록·요약·이력 전부 base prefix로 무효화.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.settingsHrdKeys() }),
  })
}

export interface HrdKeyUpdateInput {
  name?: string
  keyValue?: string
  description?: string
  active?: boolean
}

export function useUpdateHrdKey() {
  const queryClient = useQueryClient()
  return useMutation<
    HrdApiKey,
    Error,
    { id: string; input: HrdKeyUpdateInput }
  >({
    mutationFn: ({ id, input }) =>
      apiClient
        .patch<HrdApiKey>(`/admin/hrd-keys/${id}`, input)
        .then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminKeys.settingsHrdKeys(),
      }),
  })
}

export function useDeleteHrdKey() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    // BE는 204 No Content(래퍼 없음) — 본문 무시.
    mutationFn: (id) =>
      apiClient.delete<void>(`/admin/hrd-keys/${id}`).then(() => undefined),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.settingsHrdKeys() }),
  })
}

export function useTestHrdKey() {
  const queryClient = useQueryClient()
  return useMutation<HrdKeyTestResult, Error, string>({
    mutationFn: (id) =>
      apiClient
        .post<HrdKeyTestResult>(`/admin/hrd-keys/${id}/test`)
        .then((r) => r.data),
    // 테스트 결과는 summary.lastTest·recentFail·history에 반영되므로 갱신.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.settingsHrdKeys() }),
  })
}

export function useCourseList() {
  return useQuery({
    queryKey: adminKeys.settingsCourses(),
    queryFn: () =>
      apiClient
        .get<CourseListItem[]>('/admin/settings/courses')
        .then((r) => r.data),
  })
}

export function useCourseConfig(courseId: string | null) {
  return useQuery({
    queryKey: adminKeys.settingsCourseConfig(courseId ?? ''),
    enabled: !!courseId,
    queryFn: () =>
      apiClient
        .get<CourseConfigDetail>(`/admin/settings/courses/${courseId}/config`)
        .then((r) => r.data),
  })
}

// ── 교육 과정 추가 (learning-service /admin/courses) ──
// HRD-Net 검색은 현재 BE fixture 스텁, 등록/제거는 in-memory MVP. proxy로 :8082 도달.

export interface HrdCourseSearchParams {
  keyId?: string
  organ?: string
  title?: string
  from?: string
  to?: string
  page?: number
  size?: number
}

export function useHrdCourseSearch(
  params: HrdCourseSearchParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: adminKeys.settingsHrdSearch(params),
    // '조회' 전에는 호출하지 않는다(enabled=false). keyId 미지정 시 BE가 활성 키로 폴백.
    enabled,
    // 페이지·검색 전환 시 이전 결과를 유지해 깜빡임(전체 로딩) 방지.
    placeholderData: keepPreviousData,
    queryFn: () =>
      apiClient
        .get<HrdCourseSearchData>('/admin/courses/hrd-search', {
          page: params.page ?? 1,
          size: params.size ?? 12,
          ...(params.keyId ? { keyId: params.keyId } : {}),
          ...(params.organ ? { organ: params.organ } : {}),
          ...(params.title ? { title: params.title } : {}),
          ...(params.from ? { from: params.from } : {}),
          ...(params.to ? { to: params.to } : {}),
        })
        .then((r) => r.data),
  })
}

export interface CourseRegisterInput {
  trprId: string
  title: string
  grade: string
  startDate: string
  endDate: string
}

export interface CourseRegistration {
  id: string
  trprId: string
  title: string
  grade: string
  startDate: string
  endDate: string
  createdBy: string
  createdAt: string
}

export function useRegisterCourse() {
  const queryClient = useQueryClient()
  return useMutation<CourseRegistration, Error, CourseRegisterInput>({
    mutationFn: (input) =>
      apiClient
        .post<CourseRegistration>('/admin/courses', input)
        .then((r) => r.data),
    // 등록 후 검색 결과의 상태(미등록→등록됨)·요약을 갱신.
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminKeys.settingsHrdSearch(),
      }),
  })
}

export function useDeleteCourseRegistration() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { trprId: string; grade: string }>({
    mutationFn: ({ trprId, grade }) =>
      apiClient
        .delete<void>(
          `/admin/courses?trprId=${encodeURIComponent(trprId)}&grade=${encodeURIComponent(grade)}`,
        )
        .then(() => undefined),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminKeys.settingsHrdSearch(),
      }),
  })
}

export function useSettingsAudit() {
  return useQuery({
    queryKey: adminKeys.settingsAudit(),
    queryFn: () =>
      apiClient
        .get<SettingsAuditData>('/admin/settings/audit')
        .then((r) => r.data),
  })
}
