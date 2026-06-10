// 수강생 이력서 관리 — 내 이력서 목록(목업). BE 연동 전 화면 구현용.
export type ResumeStatus = '작성 중' | '작성 완료'

// 이력서 섹션(11) — 카드 칩 · 진행률 · 드로어 체크리스트 기준.
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
]

export interface ResumeSummary {
  id: string
  title: string
  status: ResumeStatus
  /** 작성 완료한 섹션 이름들(SECTIONS 부분집합) */
  doneSections: string[]
  updatedAt: string
}

export const RESUMES: ResumeSummary[] = [
  {
    id: 'r1',
    title: '새 이력서',
    status: '작성 중',
    doneSections: ['기본정보', '학력사항', '경력사항'],
    updatedAt: '2026.06.10',
  },
  {
    id: 'r2',
    title: '새 이력서',
    status: '작성 완료',
    doneSections: [],
    updatedAt: '2026.06.10',
  },
]

// 누적 피드백 수(헤더 KPI).
export const FEEDBACK_COUNT = 0

/** 전체 완료율(%) — 작성 완료 섹션 / 전체 섹션. */
export function completionOf(r: ResumeSummary) {
  return Math.round((r.doneSections.length / SECTIONS.length) * 100)
}

// Doc 미리보기 샘플 — 작성된 이력서를 문서 형태로 렌더(BE 연동 전).
export interface ResumeDocEntry {
  title: string
  meta?: string
}
export const RESUME_DOC = {
  name: '박준석',
  phone: '010-4404-6763',
  email: 'eric676392@gmail.com',
  birth: '1998-09-23',
  github: 'https://github.com/junseok-dev',
  careers: [
    {
      title: '플레이데이터',
      meta: '2026.05-2026.08 | 인턴 | LMS 프로젝트 프론트엔드 작업',
    },
  ] as ResumeDocEntry[],
  educations: [{ title: 'SK 네트웍스 Family AI Camp' }] as ResumeDocEntry[],
}
