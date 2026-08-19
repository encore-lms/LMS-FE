import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { tsKeys } from '../troubleshooting/queryKeys'
import type { TsCaseDetail, TsListData } from '../troubleshooting/types'

/** 작성·수정 요청 바디 — BE UpsertRequest 계약(category·completed·자유 tags·근거 링크 포함). */
export interface TsUpsertBody {
  title: string
  category: string
  situation: string
  resolution: string
  result: string
  independent: boolean
  completed: boolean
  daysSpent: number
  tags: string[]
  links: string[]
  projectId: string | null
  /** 문제를 겪은 날(YYYY-MM-DD). 안 골랐으면 null — 오늘로 대신 채우지 않는다. */
  occurredOn: string | null
}

// 트러블슈팅 훅 — 엔드포인트가 /student/* 라 학생 feature 소유. baseURL /api 라 경로 앞 /api 생략.
export function useTsList(enabled = true) {
  return useQuery({
    queryKey: tsKeys.list(),
    // 검토자(매니저·강사) 워크스페이스 열람 — /student/** 는 403이라 조회 자체를 끈다.
    enabled,
    queryFn: () =>
      apiClient.get<TsListData>('/student/troubleshooting').then((r) => r.data),
    // 새 사례 제출분(setQueryData)이 세션 내 유지되도록 재요청 억제(새로고침 시 mock 복원).
    staleTime: Infinity,
    // staleTime만으로는 부족 — 목록을 떠나 옵저버가 사라지면 gcTime(기본 5분) 후 캐시가
    // 수거되고, 재진입 시 mock 시드로 리패치돼 캐시에만 있던 신규 사례가 사라진다.
    // (변경 제안 승인처럼 목록을 오래 비우는 흐름에서 두드러짐.) 세션 내 보존 위해 GC 비활성화.
    gcTime: Infinity,
  })
}

export function useTsCase(id: string) {
  // 신규 임시 id(ts_…)는 아직 BE에 없다 — 조회를 건너뛰고 빈 작성 폼으로 시작한다.
  const isNew = id.startsWith('ts_')
  return useQuery({
    queryKey: tsKeys.case(id),
    enabled: !isNew,
    queryFn: () =>
      apiClient
        .get<TsCaseDetail>(`/student/troubleshooting/${id}`)
        .then((r) => r.data),
    // 새 사례 작성 시 시드한 상세(setQueryData)와 인증 요청 상태 전환이 세션 내
    // 유지되도록 재요청 억제(새로고침 시 mock 복원) — 목록(useTsList)과 동일 정책.
    staleTime: Infinity,
    // 옵저버가 사라져도 캐시가 수거되지 않도록 GC 비활성화(목록과 동일 — 신규 사례 소실 방지).
    gcTime: Infinity,
  })
}

// ── write ──────────────────────────────────────────────────────────────────

/** 새 사례 작성(POST) — 반환된 상세(BE 발급 실 id)를 캐시에 심고 목록을 무효화한다. */
export function useCreateTsCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TsUpsertBody) =>
      apiClient
        .post<TsCaseDetail>('/student/troubleshooting', body)
        .then((r) => r.data),
    onSuccess: (detail) => {
      qc.setQueryData(tsKeys.case(detail.id), detail)
      qc.invalidateQueries({ queryKey: tsKeys.list() })
    },
  })
}

/** 사례 수정(PUT). */
export function useUpdateTsCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TsUpsertBody }) =>
      apiClient
        .put<TsCaseDetail>(`/student/troubleshooting/${id}`, body)
        .then((r) => r.data),
    onSuccess: (detail) => {
      qc.setQueryData(tsKeys.case(detail.id), detail)
      qc.invalidateQueries({ queryKey: tsKeys.list() })
    },
  })
}

/**
 * 프로젝트 연결 변경(PATCH) — projectId 가 null 이면 해제.
 *
 * 본문 수정(PUT)과 분리된 경로다. 상세 화면은 태그·근거 링크를 들고 있지 않아
 * PUT 을 재사용하면 그 값들이 빈 값으로 덮인다.
 */
export function useLinkTsProject(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string | null) =>
      apiClient
        .patch<TsCaseDetail>(`/student/troubleshooting/${id}/project`, {
          projectId,
        })
        .then((r) => r.data),
    onSuccess: (detail) => {
      qc.setQueryData(tsKeys.case(detail.id), detail)
      qc.invalidateQueries({ queryKey: tsKeys.list() })
    },
  })
}

/** 사례 삭제(DELETE) — 작성자 본인만(BE 게이트). */
export function useDeleteTsCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/student/troubleshooting/${id}`).then((r) => r.data),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: tsKeys.case(id) })
      qc.invalidateQueries({ queryKey: tsKeys.list() })
    },
  })
}

/** 인증 요청(POST /{id}/certification-request) — SUBMITTED + REQUESTED 전이. */
export function useRequestTsCertification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient
        .post<TsCaseDetail>(
          `/student/troubleshooting/${id}/certification-request`,
        )
        .then((r) => r.data),
    onSuccess: (detail) => {
      qc.setQueryData(tsKeys.case(detail.id), detail)
      qc.invalidateQueries({ queryKey: tsKeys.list() })
    },
  })
}

/** 근거 파일 업로드(multipart) — 케이스 저장 후 실 id 로 호출. DB(bytea) 저장. */
export function useUploadTsAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      file,
      label,
    }: {
      id: string
      file: File
      label?: string
    }) => {
      const form = new FormData()
      form.append('file', file)
      if (label) form.append('label', label)
      // postForm — FormData 를 multipart/form-data(boundary 자동)로 전송(선례: projects 산출물 업로드).
      // 일반 post 는 기본 application/json 헤더가 붙어 BE 가 415(HttpMediaTypeNotSupported)로 거부한다.
      return apiClient.postForm(
        `/student/troubleshooting/${id}/attachments/file`,
        form,
      )
    },
    onSuccess: (_d, { id }) =>
      qc.invalidateQueries({ queryKey: tsKeys.case(id) }),
  })
}
