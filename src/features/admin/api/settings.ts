import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import { useAuthStore } from '@/shared/store/auth'
import type {
  OpsAccount,
  OpsAccountsData,
  HrdApiKey,
  HrdKeyListData,
  HrdKeyHistoryData,
  HrdKeyHistoryAction,
  HrdKeySummary,
  HrdKeyTestResult,
  CourseListItem,
  CourseConfigDetail,
  CohortMaterialItem,
  HrdCourseSearchData,
} from '@/shared/types'

// ── 운영 계정(auth-user-service /auth/accounts) — 매니저·강사·멘토 실연동 ──
// 실 BE 전용(mock 모드에선 mock 토큰이라 401). /api/auth proxy로 :8081 도달.
interface RawOpsUser {
  userId: string
  email: string | null
  name: string
  primaryRole: 'MANAGER' | 'INSTRUCTOR' | 'MENTOR' | string
  status: string // ACTIVE | INACTIVE | BLOCKED
  lastLoginAt: string | null
  cohortIds: string[] | null
}
interface RawOpsPage {
  content: RawOpsUser[]
  totalElements: number
}

function toOpsAccount(u: RawOpsUser, selfId: string | null): OpsAccount {
  return {
    id: u.userId,
    name: u.name,
    email: u.email ?? '-',
    role: (u.primaryRole as 'MANAGER' | 'INSTRUCTOR' | 'MENTOR') ?? 'MANAGER',
    cohortIds: u.cohortIds ?? [],
    // scope 표기는 화면에서 cohortIds를 과정/기수 라벨로 해석(여기선 임시값).
    scope:
      (u.cohortIds?.length ?? 0) > 0
        ? `${u.cohortIds!.length}개 기수 담당`
        : '담당 기수 없음',
    // BE status는 소문자(active/inactive/blocked). active만 활성, 그 외 비활성.
    status: u.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.slice(0, 10) : null,
    isSelf: !!selfId && u.userId === selfId,
  }
}

export function useOpsAccounts() {
  const selfId = useAuthStore.getState().user?.id ?? null
  return useQuery({
    queryKey: adminKeys.settingsAccounts(),
    queryFn: () =>
      apiClient.get<RawOpsPage>('/auth/accounts', { size: 100 }).then((r) => {
        const items = (r.data.content ?? []).map((u) => toOpsAccount(u, selfId))
        const by = (role: string) => items.filter((a) => a.role === role)
        const managers = by('MANAGER')
        const data: OpsAccountsData = {
          items,
          summary: {
            managers: managers.length,
            managersActive: managers.filter((a) => a.status === 'active')
              .length,
            managersInactive: managers.filter((a) => a.status === 'inactive')
              .length,
            instructors: by('INSTRUCTOR').length,
            instructorNoScope: 0,
            mentors: by('MENTOR').length,
            mentorNoTeam: 0,
            inactive: items.filter((a) => a.status === 'inactive').length,
            inactiveRevoked30d: 0,
            total: r.data.totalElements ?? items.length,
          },
        }
        return data
      }),
  })
}

export interface CreateOpsAccountInput {
  name: string
  email: string
  role: 'MANAGER' | 'INSTRUCTOR' | 'MENTOR'
  password: string
}
// 운영 계정 생성(POST /auth/accounts). 성공 시 목록 무효화.
export function useCreateOpsAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateOpsAccountInput) =>
      apiClient.post('/auth/accounts', input).then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.settingsAccounts() }),
  })
}

// 운영 계정 상태 변경(PATCH /auth/accounts/{userId}/status). ACTIVE|INACTIVE.
export function useUpdateOpsAccountStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      status,
      reason,
    }: {
      userId: string
      status: 'ACTIVE' | 'INACTIVE'
      reason?: string
    }) =>
      apiClient
        .patch(`/auth/accounts/${userId}/status`, { status, reason })
        .then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.settingsAccounts() }),
  })
}

export interface AccountPasswordResetResult {
  userId: string
  temporaryPassword: string
}
// 계정 임시 비밀번호 재발급(POST /auth/accounts/{userId}/password/reset).
// auth-service 공통 엔드포인트 — 운영 계정·학생 계정 모두 이 훅을 쓴다.
export function useResetAccountPassword() {
  return useMutation<AccountPasswordResetResult, Error, string>({
    mutationFn: (userId) =>
      apiClient
        .post<AccountPasswordResetResult>(
          `/auth/accounts/${userId}/password/reset`,
        )
        .then((r) => r.data),
  })
}

// 운영자 담당 기수 일괄 설정(PUT /auth/accounts/{userId}/cohorts). 성공 시 목록 무효화.
export function useUpdateOperatorCohorts() {
  const queryClient = useQueryClient()
  return useMutation<string[], Error, { userId: string; cohortIds: string[] }>({
    mutationFn: ({ userId, cohortIds }) =>
      apiClient
        .put<string[]>(`/auth/accounts/${userId}/cohorts`, { cohortIds })
        .then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.settingsAccounts() }),
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

// 등록된 LMS 과정 목록 — learning-service. 실 BE 전용(mock 모드에선 401).
export function useCourseList() {
  return useQuery({
    queryKey: adminKeys.settingsCourses(),
    queryFn: () =>
      apiClient.get<CourseListItem[]>('/admin/courses').then((r) => r.data),
  })
}

// 등록 과정 상세(기본 정보 + 기수 + 토글/정책) — learning-service.
export function useCourseConfig(courseId: string | null) {
  return useQuery({
    queryKey: adminKeys.settingsCourseConfig(courseId ?? ''),
    enabled: !!courseId,
    queryFn: () =>
      apiClient
        .get<CourseConfigDetail>(`/admin/courses/${courseId}`)
        .then((r) => r.data),
  })
}

export interface CohortSettingsUpdateInput {
  courseId: string
  cohortId: string
  mileageEnabled: boolean
  playEnabled: boolean
}

// 기수 기능 토글(mileage·play) 저장. 응답(최신 과정 상세)을 캐시에 반영.
export function useUpdateCohortSettings() {
  const queryClient = useQueryClient()
  return useMutation<CourseConfigDetail, Error, CohortSettingsUpdateInput>({
    mutationFn: ({ courseId, cohortId, mileageEnabled, playEnabled }) =>
      apiClient
        .put<CourseConfigDetail>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/settings`,
          { mileageEnabled, playEnabled },
        )
        .then((r) => r.data),
    onSuccess: (data, { courseId }) => {
      queryClient.setQueryData(adminKeys.settingsCourseConfig(courseId), data)
    },
  })
}

// ── 기수 자료실(CohortMaterial) ── learning-service 실연동.
export function useCohortMaterials(
  courseId: string | null,
  cohortId: string | null,
) {
  return useQuery({
    queryKey: adminKeys.settingsCohortMaterials(courseId ?? '', cohortId ?? ''),
    enabled: !!courseId && !!cohortId,
    queryFn: () =>
      apiClient
        .get<
          CohortMaterialItem[]
        >(`/admin/courses/${courseId}/cohorts/${cohortId}/materials`)
        .then((r) => r.data),
  })
}

export interface CreateCohortMaterialInput {
  courseId: string
  cohortId: string
  title: string
  materialType: string // 'link' | 'document' | 'file'
  body?: string
  url?: string // link/document
  file?: File // file형
}

// 자료 생성 — multipart. link/document면 url, file이면 file 첨부. body(본문)는 공통 선택.
export function useCreateCohortMaterial() {
  const queryClient = useQueryClient()
  return useMutation<CohortMaterialItem, Error, CreateCohortMaterialInput>({
    mutationFn: ({
      courseId,
      cohortId,
      title,
      materialType,
      body,
      url,
      file,
    }) => {
      const form = new FormData()
      form.append('title', title)
      form.append('materialType', materialType)
      if (body) form.append('body', body)
      if (url) form.append('url', url)
      if (file) form.append('file', file)
      return apiClient
        .postForm<CohortMaterialItem>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/materials`,
          form,
        )
        .then((r) => r.data)
    },
    onSuccess: (_data, { courseId, cohortId }) =>
      queryClient.invalidateQueries({
        queryKey: adminKeys.settingsCohortMaterials(courseId, cohortId),
      }),
  })
}

// 자료 파일 다운로드 — Blob 받아 브라우저 저장 트리거.
export async function downloadCohortMaterialFile(
  courseId: string,
  cohortId: string,
  materialId: string,
  fileName: string,
) {
  const blob = await apiClient.getBlob(
    `/admin/courses/${courseId}/cohorts/${cohortId}/materials/${materialId}/file`,
  )
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

export interface DeleteCohortMaterialInput {
  courseId: string
  cohortId: string
  materialId: string
}

export function useDeleteCohortMaterial() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, DeleteCohortMaterialInput>({
    mutationFn: ({ courseId, cohortId, materialId }) =>
      apiClient
        .delete<void>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/materials/${materialId}`,
        )
        .then(() => undefined),
    onSuccess: (_data, { courseId, cohortId }) =>
      queryClient.invalidateQueries({
        queryKey: adminKeys.settingsCohortMaterials(courseId, cohortId),
      }),
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
