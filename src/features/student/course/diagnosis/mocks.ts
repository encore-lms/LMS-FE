import { http, HttpResponse } from 'msw'
import { buildDiagnosisReports } from './reportData'

// 진단 리포트 mock — 기능 로컬. 자동 수집 규약: `export const handlers`
// (mocks/handlers.ts 가 import.meta.glob 으로 자동 등록 → handlers.ts 안 건드림).
// LLM 수준 진단 PoV v0.1 — BE 미연동이라 24주 전량을 목록 한 번에 내려준다.
const ok = <T>(data: T) => HttpResponse.json({ data })

const reports = buildDiagnosisReports()

export const handlers = [
  http.get('/api/student/course/diagnosis/reports', () => ok(reports)),
]
