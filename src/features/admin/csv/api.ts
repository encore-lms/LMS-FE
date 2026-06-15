import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminCsvKeys } from './queryKeys'
import type { CsvImportOverview } from './types'

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
