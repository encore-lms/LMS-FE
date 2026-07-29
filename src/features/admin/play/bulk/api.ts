import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { playBulkKeys } from './queryKeys'
import type { BulkUploadData } from './types'

// 타자 제시문 일괄 업로드 검증 미리보기 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function usePlayBulkPreview() {
  return useQuery({
    queryKey: playBulkKeys.preview(),
    queryFn: () =>
      apiClient
        .get<BulkUploadData>('/admin/play/typing-texts/bulk')
        .then((r) => r.data),
  })
}
