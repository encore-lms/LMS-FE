import { http, HttpResponse } from 'msw'
import type { BulkUploadData } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 타자 제시문 일괄 업로드 검증 (Figma 1546:11329) ──
const overview: BulkUploadData = {
  file: {
    fileName: 'typing_texts_2026-05.csv',
    detail: 'UTF-8 · comma · header 포함',
  },
  summary: {
    uploadFiles: 2,
    uploadFilesHint: 'CSV 1 · XLSX 1',
    normalRows: 238,
    normalHint: '등록 가능',
    errorRows: 7,
    errorHint: '필수 열 누락',
    dupCandidates: 13,
    dupHint: '기존 제목',
    estimated: 225,
    estimatedHint: '활성 등록',
  },
  fields: [
    {
      id: 'language',
      field: 'language',
      sample: 'ko',
      validation: 'normal',
      action: 'pin',
    },
    {
      id: 'level',
      field: 'level',
      sample: 'medium',
      validation: 'normal',
      action: 'pin',
    },
    {
      id: 'title',
      field: 'title',
      sample: 'Spring 예외 처리',
      validation: 'normal',
      action: 'pin',
    },
    {
      id: 'content',
      field: 'content',
      sample: 'try-catch 흐름…',
      validation: 'length_check',
      action: 'review',
    },
    {
      id: 'sortOrder',
      field: 'sortOrder',
      sample: '12',
      validation: 'dup_candidate',
      action: 'edit',
    },
  ],
  validations: [
    {
      id: 'required',
      item: '필수 열',
      normal: 238,
      error: 0,
      handling: 'pass',
    },
    {
      id: 'length',
      item: '본문 길이',
      normal: 233,
      error: 5,
      handling: 'fix_needed',
    },
    {
      id: 'dup',
      item: '제목 중복',
      normal: 225,
      error: 13,
      handling: 'ops_check',
    },
    {
      id: 'level',
      item: '난이도 값',
      normal: 236,
      error: 2,
      handling: 'map_needed',
    },
  ],
}

export const handlers = [
  http.get('/api/admin/play/typing-texts/bulk', () =>
    ok<BulkUploadData>(overview),
  ),
]
