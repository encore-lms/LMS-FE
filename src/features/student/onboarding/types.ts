// 수강생 온보딩 도메인 계약 — /student/onboarding API와 풀스크린 3스텝 마법사 공유 타입.

export type OnboardingStep = 'pledge' | 'skills' | 'links'

export interface StepMeta {
  no: number
  key: OnboardingStep
  label: string // 다짐 / 스킬 / 외부 URL
}

export const ONBOARDING_STEPS: StepMeta[] = [
  { no: 1, key: 'pledge', label: '다짐' },
  { no: 2, key: 'skills', label: '스킬' },
  { no: 3, key: 'links', label: '외부 URL' },
]

/** 관심 스킬 옵션 */
export const SKILL_OPTIONS: string[] = [
  'Java',
  'Spring',
  'React',
  'SQL',
  'Python',
  'Docker',
  'Git',
  'AWS',
  'JPA',
  'TypeScript',
  'REST API',
  'Linux',
]

export const PLEDGE_MAX = 300
export const SKILL_MAX = 6

export interface StudentSkillOption {
  skillId: string
  name: string
  category: string
  selected: boolean
}

export interface StudentOnboardingProfile {
  promise: string
  blogUrl: string | null
  githubUrl: string | null
  selectedSkillIds: string[]
}

export interface StudentOnboardingResponse {
  completed: boolean
  profile: StudentOnboardingProfile
  skillOptions: StudentSkillOption[]
}

export interface StudentOnboardingPayload {
  promise: string
  skillIds: string[]
  blogUrl: string | null
  githubUrl: string | null
}

/** http/https URL 형식 검증 — 빈 문자열 허용 여부는 호출 측(선택 입력)에서 판단. */
export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
