import { http, HttpResponse } from 'msw'
import { SKILL_OPTIONS } from './types'
import type {
  StudentOnboardingPayload,
  StudentOnboardingResponse,
} from './types'

// 온보딩 mock — 기능 로컬. features/**/mocks.ts 글롭이 자동 수집한다.
// 로컬(baseURL '/api')에서만 매칭되고, 배포(절대 URL)에선 실 BE로 통과한다.
// completed:true 로 게이트를 통과시켜 로컬에서 대시보드 등 /student 영역을 바로 볼 수 있게 한다.
const ok = <T>(data: T) => HttpResponse.json({ data })

const skillOptions = SKILL_OPTIONS.map((name, i) => ({
  skillId: `skill-${i + 1}`,
  name,
  category: '기술',
  selected: i < 3,
}))

const response: StudentOnboardingResponse = {
  completed: true,
  profile: {
    promise: '매일 꾸준히 성장하겠습니다.',
    blogUrl: 'https://blog.example.com',
    githubUrl: 'https://github.com/example',
    selectedSkillIds: ['skill-1', 'skill-2', 'skill-3'],
  },
  skillOptions,
}

export const handlers = [
  http.get('/api/student/onboarding', () => ok(response)),
  http.patch('/api/student/onboarding', async ({ request }) => {
    const body = (await request.json()) as StudentOnboardingPayload
    return ok<StudentOnboardingResponse>({
      completed: true,
      profile: {
        promise: body.promise,
        blogUrl: body.blogUrl,
        githubUrl: body.githubUrl,
        selectedSkillIds: body.skillIds,
      },
      skillOptions,
    })
  }),
]
