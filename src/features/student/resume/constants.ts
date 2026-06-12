import type { ResumeSummary } from './types'

// 이력서 섹션 11종 — 카드 칩·진행률·드로어 체크리스트의 기준(고정 순서).
// mock 의 doneSections 값과 철자가 일치해야 한다(B안: 한글 문자열을 값으로 사용).
export const SECTIONS = [
  '기본정보',
  '핵심역량/강점',
  '학력사항',
  '경력사항',
  '자격사항',
  '수상내역',
  '교육경험',
  '기타활동',
  '기술스택',
  '프로젝트 경험',
  '자기소개서',
] as const

/** 전체 완료율(%) — 작성 완료 섹션 / 전체 섹션 */
export function completionOf(r: ResumeSummary) {
  return Math.round((r.doneSections.length / SECTIONS.length) * 100)
}
