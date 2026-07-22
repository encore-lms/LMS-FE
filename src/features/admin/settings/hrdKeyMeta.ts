// HRD API Key 페이지 공용 상수·포맷 헬퍼(이력 라벨·페이지 크기·날짜/에러 포맷) — HrdApiKeyPage에서 분리.
import { isAxiosError } from 'axios'
import type { HrdKeyHistoryAction } from '@/shared/types'
import { formatDate, formatDateTime } from '@/shared/lib/date'

export type HistoryFilter = 'all' | HrdKeyHistoryAction

// BE history action(create/update/delete/test) 표시 라벨.
export const ACTION_LABEL: Record<HrdKeyHistoryAction, string> = {
  create: '등록',
  update: '수정',
  delete: '삭제',
  test: '연결 테스트',
}

export const HISTORY_FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'create', label: '등록' },
  { key: 'update', label: '수정' },
  { key: 'delete', label: '삭제' },
  { key: 'test', label: '연결 테스트' },
]

export const KEY_PAGE_SIZE = 6
export const HISTORY_PAGE_SIZE = 8

// ISO-8601 Instant → 'YYYY-MM-DD' (공용 Intl 유틸 — KST 고정)
export function fmtDate(iso: string) {
  return formatDate(iso) || '-'
}

// ISO-8601 Instant → 'YYYY-MM-DD HH:mm' — 연도 생략 시 해가 바뀐 이력이 모호해져 연도 포함.
export function fmtDateTime(iso: string) {
  return formatDateTime(iso) || '-'
}

// axios 에러에서 BE 메시지(ErrorResponse.message) 추출, 없으면 fallback.
export function errMsg(e: unknown, fallback: string) {
  if (isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string } | undefined)?.message
    if (msg) return msg
  }
  return fallback
}
