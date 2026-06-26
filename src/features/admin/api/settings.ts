import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type {
  SettingsHubData,
  OpsAccountsData,
  HrdKeyData,
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

export function useHrdKeys() {
  return useQuery({
    queryKey: adminKeys.settingsHrdKeys(),
    queryFn: () =>
      apiClient
        .get<HrdKeyData>('/admin/settings/hrd-api-keys')
        .then((r) => r.data),
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

export function useHrdCourseSearch(page: number) {
  return useQuery({
    queryKey: adminKeys.settingsHrdSearch(page),
    // 페이지 전환 시 이전 결과를 유지해 깜빡임(전체 로딩) 방지.
    placeholderData: keepPreviousData,
    queryFn: () =>
      apiClient
        .get<HrdCourseSearchData>('/admin/settings/hrd-courses', { page })
        .then((r) => r.data),
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
