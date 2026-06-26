import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { isMenuGroup, type MenuNode } from '@/components/layout'

// 수강생이 보는 과정 기능 플래그(learning-service /student/course-features).
// features: 토글 키 → 사용 여부. 운영 중인 과정 기준(enrollment 도입 전 프로토타입).
export interface StudentCourseFeatures {
  courseId: string | null
  courseTitle: string | null
  features: Record<string, boolean>
}

// STUDENT일 때만 조회(enabled). 실패 시 데이터 없음 → 메뉴 전부 노출(graceful).
export function useStudentCourseFeatures(enabled: boolean) {
  return useQuery({
    queryKey: ['student', 'course-features'],
    enabled,
    staleTime: 60_000,
    queryFn: () =>
      apiClient
        .get<StudentCourseFeatures>('/student/course-features')
        .then((r) => r.data),
  })
}

// featureKey가 명시적으로 false인 항목만 숨긴다(features 없으면 전부 노출).
export function filterMenuByFeatures(
  menu: MenuNode[],
  features: Record<string, boolean> | undefined,
): MenuNode[] {
  if (!features) return menu
  const visible = (key?: string) => !key || features[key] !== false
  return menu
    .map((node) =>
      isMenuGroup(node)
        ? {
            ...node,
            children: node.children.filter((c) => visible(c.featureKey)),
          }
        : node,
    )
    .filter((node) =>
      isMenuGroup(node) ? node.children.length > 0 : visible(node.featureKey),
    )
}
