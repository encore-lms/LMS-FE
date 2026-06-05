import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { courseKeys } from '../course/queryKeys'
import type { CourseHome, CourseMaterials } from '../course/types'
import type {
  AssignmentDetail,
  AssignmentListItem,
} from '../course/assignments/types'
import type { CompetencyReport } from '../course/competency/types'

// 수강생 "나의 과정" 훅 — 엔드포인트가 /student/* 라 학생 feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).

/** 강의 홈 — /student/course */
export function useCourseHome() {
  return useQuery({
    queryKey: courseKeys.home(),
    queryFn: () =>
      apiClient.get<CourseHome>('/student/course').then((r) => r.data),
  })
}

/** 강의 자료실 — /student/course/materials */
export function useCourseMaterials() {
  return useQuery({
    queryKey: courseKeys.materials(),
    queryFn: () =>
      apiClient
        .get<CourseMaterials>('/student/course/materials')
        .then((r) => r.data),
  })
}

/** 과제/실습 목록 — /student/course/assignments */
export function useAssignments() {
  return useQuery({
    queryKey: courseKeys.assignments(),
    queryFn: () =>
      apiClient
        .get<AssignmentListItem[]>('/student/course/assignments')
        .then((r) => r.data),
  })
}

/** 과제 상세·제출 — /student/course/assignments/:id */
export function useAssignment(id: string) {
  return useQuery({
    queryKey: courseKeys.assignment(id),
    queryFn: () =>
      apiClient
        .get<AssignmentDetail>(`/student/course/assignments/${id}`)
        .then((r) => r.data),
    enabled: !!id,
  })
}

/** 과정별 역량 리포트 — /student/course/competency */
export function useCompetencyReport() {
  return useQuery({
    queryKey: courseKeys.competency(),
    queryFn: () =>
      apiClient
        .get<CompetencyReport>('/student/course/competency')
        .then((r) => r.data),
  })
}
