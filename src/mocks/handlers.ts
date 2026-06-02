import { http, HttpResponse } from 'msw'
import type { Role } from '@/shared/types'

// 개발용 mock 로그인. 이메일 prefix로 역할을 흉내내 각 shell을 바로 테스트할 수 있다.
//   admin@…→운영(MANAGER) / instructor@…→강사 / mentor@…→멘토 / 그 외→수강생
function roleFromEmail(email: string): Role {
  if (email.startsWith('admin')) return 'MANAGER'
  if (email.startsWith('instructor')) return 'INSTRUCTOR'
  if (email.startsWith('mentor')) return 'MENTOR'
  return 'STUDENT'
}

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    const email = body.email ?? ''
    return HttpResponse.json({
      data: {
        token: 'mock-token',
        user: {
          id: 'mock-1',
          email,
          name: '테스트 사용자',
          role: roleFromEmail(email),
        },
      },
    })
  }),
]
