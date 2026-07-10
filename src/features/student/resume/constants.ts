import type { ResumeDetail, ResumeSummary } from './types'

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

// 자기소개서 표준 문항 — 새 이력서·mock 기본값 공통 사용(편집기에서 추가/삭제 가능).
export const INTRO_QUESTIONS = [
  '자기소개',
  '지원동기',
  '직무와 관련된 경험 중 어려움을 극복한 사례',
  '성장과정',
  '직무와 관련된 성격의 장단점',
  '지원한 회사에 대한 포부',
] as const

/** 전체 완료율(%) — 작성 완료 섹션 / 전체 섹션 */
export function completionOf(r: ResumeSummary) {
  return Math.round((r.doneSections.length / SECTIONS.length) * 100)
}

// 섹션 작성 여부 판정에 필요한 내용 필드 — ResumeDetail·ResumeUpdatePayload 둘 다 만족.
type ResumeContent = Pick<
  ResumeDetail,
  | 'basicInfo'
  | 'strength'
  | 'educations'
  | 'careers'
  | 'certificates'
  | 'awards'
  | 'trainings'
  | 'activities'
  | 'skills'
  | 'projects'
  | 'coverLetters'
>

/**
 * 작성 완료된 섹션명(SECTIONS 부분집합) — 서버·편집기 공통 기준(단일 소스).
 * 내용이 채워진 섹션만 push 한다(빈 배열·빈 문자열은 미작성).
 */
export function computeDoneSections(d: ResumeContent): string[] {
  const done: string[] = []
  if (d.basicInfo.name && d.basicInfo.email) done.push('기본정보')
  if (d.strength.trim()) done.push('핵심역량/강점')
  if (d.educations.length) done.push('학력사항')
  if (d.careers.length) done.push('경력사항')
  if (d.certificates.length) done.push('자격사항')
  if (d.awards.length) done.push('수상내역')
  if (d.trainings.length) done.push('교육경험')
  if (d.activities.length) done.push('기타활동')
  if (d.skills.length) done.push('기술스택')
  if (d.projects.length) done.push('프로젝트 경험')
  if (d.coverLetters.some((c) => c.content.trim())) done.push('자기소개서')
  return done
}

/** 미작성 섹션 목록(SECTIONS 순서 유지). */
export function missingSections(d: ResumeContent): string[] {
  const done = new Set(computeDoneSections(d))
  return SECTIONS.filter((s) => !done.has(s))
}
