import { http, HttpResponse } from 'msw'
import type { StudentProfile, ProfileUpdatePayload } from './types'

// 마이 프로필 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// (mocks/handlers.ts 가 import.meta.glob 으로 자동 등록 → handlers.ts 안 건드림)
const ok = <T>(data: T) => HttpResponse.json({ data })

const mockProfile: StudentProfile = {
  name: '김수강',
  displayName: '수강 Kim',
  courseName: '백엔드 부트캠프',
  cohortName: '5기',
  email: 'sukang.kim@example.com',
  profileImageUrl: null,
  // 시안(159:27)은 GitHub·블로그가 미입력(필수 누락) 상태 → 빈 값으로 재현
  githubUrl: '',
  blogUrl: '',
  portfolioUrl: 'https://yourportfolio.com',
  linkedinUrl: '',
  skills: ['Java', 'Spring Boot', 'JPA', 'MySQL', 'Redis', 'Docker', 'AWS'],
  interests: ['백엔드 개발자', 'DevOps', '데이터 엔지니어'],
  publicSettings: {
    profileImage: true,
    githubUrl: true,
    blogUrl: true,
    portfolioUrl: false,
    linkedinUrl: false,
  },
  completion: {
    pct: 75,
    requiredDone: 6,
    requiredTotal: 8,
    missingCount: 2,
    updatedAt: '2026-06-10T14:22:00Z',
  },
}

export const handlers = [
  http.get('/api/student/profile', () => ok<StudentProfile>(mockProfile)),

  http.put('/api/student/profile', async ({ request }) => {
    const body = (await request.json()) as ProfileUpdatePayload
    // mock: 제출분을 기존 프로필에 머지해 echo (완성도는 서버 파생이라 그대로)
    return ok<StudentProfile>({ ...mockProfile, ...body })
  }),
]
