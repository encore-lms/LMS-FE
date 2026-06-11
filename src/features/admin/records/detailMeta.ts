import type { RecordCategory, RecordSubmissionDetail } from '@/shared/types'

// 검토 상세 3종 공용 메타 — URL 세그먼트 ↔ RecordCategory 매핑 SSOT.
// 라우트는 'certificates'(복수), 타입 계약은 'certificate'(단수)라 양방향 매핑 함수로만 변환한다.
export type RecordCategorySegment = 'blog' | 'study' | 'certificates'

export const RECORD_SEGMENT_BY_CATEGORY: Record<
  RecordCategory,
  RecordCategorySegment
> = {
  blog: 'blog',
  study: 'study',
  certificate: 'certificates',
}

/** 미지원 세그먼트는 null — 페이지에서 Empty 가드 */
export function recordCategoryFromSegment(
  segment: string,
): RecordCategory | null {
  const entry = (
    Object.entries(RECORD_SEGMENT_BY_CATEGORY) as [
      RecordCategory,
      RecordCategorySegment,
    ][]
  ).find(([, seg]) => seg === segment)
  return entry ? entry[0] : null
}

// 페이지 로컬 보강 타입 — KPI '제출 상태' 캡션('5주차 블로그'·'이미지 2장')은
// shared 계약(RecordSubmissionBase)에 없는 표시 전용 필드.
// shared/types는 페어 동기화 규칙으로 이번 PR에서 수정하지 않고 로컬로 우회
// (BE 계약 확정 시 shared PR로 승격). 누락 시 submissionLabel로 폴백.
export type RecordSubmissionDetailView = RecordSubmissionDetail & {
  statusCaption?: string
}
