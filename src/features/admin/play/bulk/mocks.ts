import { http, HttpResponse } from 'msw'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// CSV 일괄 등록 — 실 API 계약과 동일한 {created} 응답(dev mock 모드용).
// 예전의 GET 미리보기 mock은 화면이 클라이언트 파싱으로 바뀌며 제거됐다.
export const handlers = [
  http.post('/api/admin/play/typing-texts/bulk', async ({ request }) => {
    const body = (await request.json()) as { items?: unknown[] }
    return ok({ created: body.items?.length ?? 0 })
  }),
]
