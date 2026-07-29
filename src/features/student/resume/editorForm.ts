import { INTRO_QUESTIONS } from './constants'
import type { ResumeDetail, ResumeUpdatePayload } from './types'

// 편집 폼 상태 — 저장 페이로드에서 status(제출 시 결정)·skills(별도 텍스트 입력) 제외.
export type ResumeForm = Omit<ResumeUpdatePayload, 'status' | 'skills'>

// ResumeItem[] 을 다루는 섹션들 — 키·제목·추가버튼 라벨.
export type ItemKey =
  | 'careers'
  | 'educations'
  | 'certificates'
  | 'awards'
  | 'trainings'
  | 'activities'
  | 'projects'

// SECTIONS 순서를 따른다(학력 → 경력 …). 기술스택·프로젝트는 위치상 별도 렌더.
export const ITEM_SECTIONS: {
  key: ItemKey
  title: string
  addLabel: string
}[] = [
  { key: 'educations', title: '학력사항', addLabel: '항목 추가' },
  { key: 'careers', title: '경력사항', addLabel: '항목 추가' },
  { key: 'certificates', title: '자격사항', addLabel: '항목 추가' },
  { key: 'awards', title: '수상내역', addLabel: '항목 추가' },
  { key: 'trainings', title: '교육경험', addLabel: '항목 추가' },
  { key: 'activities', title: '기타활동', addLabel: '항목 추가' },
]

export function blankForm(): ResumeForm {
  return {
    title: '새 이력서',
    basicInfo: {
      name: '',
      phone: '',
      email: '',
      birth: '',
      githubUrl: '',
      blogUrl: '',
    },
    strength: '',
    educations: [],
    careers: [],
    certificates: [],
    awards: [],
    trainings: [],
    activities: [],
    projects: [],
    coverLetters: INTRO_QUESTIONS.map((q) => ({ question: q, content: '' })),
  }
}

// 상세(mock) → 편집 폼. 배열은 복사해 원본 불변 유지.
export function toForm(d: ResumeDetail): ResumeForm {
  return {
    title: d.title,
    basicInfo: { ...d.basicInfo },
    strength: d.strength,
    educations: d.educations.map((x) => ({ ...x })),
    careers: d.careers.map((x) => ({ ...x })),
    certificates: d.certificates.map((x) => ({ ...x })),
    awards: d.awards.map((x) => ({ ...x })),
    trainings: d.trainings.map((x) => ({ ...x })),
    activities: d.activities.map((x) => ({ ...x })),
    projects: d.projects.map((x) => ({ ...x })),
    coverLetters: d.coverLetters.map((x) => ({ ...x })),
  }
}
