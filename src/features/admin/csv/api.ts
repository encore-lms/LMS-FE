import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminCsvKeys } from './queryKeys'
import type {
  CsvImportOverview,
  CsvIngestDataset,
  CsvIngestRollbackResult,
  CsvIngestUpload,
  CsvIngestUploadResult,
} from './types'

// CSV 매핑·업로드 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useCsvImport() {
  return useQuery({
    queryKey: adminCsvKeys.overview(),
    queryFn: () =>
      apiClient
        .get<CsvImportOverview>('/admin/csv-mapping')
        .then((r) => r.data),
  })
}

// 인입 데이터셋 계약·staging 적재 현황 — operations-service 실연동.
export function useCsvIngestDatasets() {
  return useQuery({
    queryKey: adminCsvKeys.datasets(),
    queryFn: () =>
      apiClient
        .get<CsvIngestDataset[]>('/admin/csv-ingest/datasets')
        .then((r) => r.data),
  })
}

// CSV 업로드 — 정상 행 staging 반영, 오류 행 격리 큐 이동. 성공 시 적재 현황을 갱신한다.
export function useCsvIngestUpload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      dataset,
      file,
      mode,
    }: {
      dataset: string
      file: File
      mode: 'replace' | 'append'
    }) => {
      const form = new FormData()
      form.append('file', file)
      return apiClient
        .postForm<CsvIngestUploadResult>(
          `/admin/csv-ingest/${dataset}?mode=${mode}`,
          form,
        )
        .then((r) => r.data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCsvKeys.datasets() })
      void queryClient.invalidateQueries({ queryKey: adminCsvKeys.uploads() })
    },
  })
}

// 업로드 감사 이력 — 최근 업로드와 반영/롤백 상태.
export function useCsvIngestUploads(limit = 10) {
  return useQuery({
    queryKey: [...adminCsvKeys.uploads(), limit],
    queryFn: () =>
      apiClient
        .get<CsvIngestUpload[]>('/admin/csv-ingest/uploads', { limit })
        .then((r) => r.data),
  })
}

// 업로드 롤백 — 해당 업로드가 반영한 staging 행·격리 행 제거. 성공 시 이력·적재 현황 갱신.
export function useCsvIngestRollback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uploadId: number) =>
      apiClient
        .post<CsvIngestRollbackResult>(
          `/admin/csv-ingest/uploads/${uploadId}/rollback`,
        )
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCsvKeys.datasets() })
      void queryClient.invalidateQueries({ queryKey: adminCsvKeys.uploads() })
    },
  })
}
