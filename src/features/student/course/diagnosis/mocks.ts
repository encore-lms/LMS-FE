import { http, HttpResponse } from 'msw'
import { buildDiagnosisReports, buildMyDiagnosisReports } from './reportData'

// 진단 리포트 mock — 기능 로컬. 자동 수집 규약: `export const handlers`
// (mocks/handlers.ts 가 import.meta.glob 으로 자동 등록 → handlers.ts 안 건드림).
// LLM 수준 진단 PoV v0.1 — BE 미연동이라 24주 전량을 목록 한 번에 내려준다.
const ok = <T>(data: T) => HttpResponse.json({ data })

const reports = buildDiagnosisReports()
const myReports = buildMyDiagnosisReports()

// 경로를 와일드카드로 매칭 — VITE_API_BASE_URL로 실 BE(절대 주소)에 붙은 모드에서도
// 진단 엔드포인트는 BE에 없으므로 이 mock이 가로채야 화면이 보인다(mock·실연동 겸용).
export const handlers = [
  // 그룹 리포트 — 매니저 허브(진단 리포트 탭) 소비.
  http.get('*/student/course/diagnosis/reports', () => ok(reports)),
  // 개인 리포트 — 수강생 교육과정 허브(진단 리포트 탭) 소비.
  http.get('*/student/course/diagnosis/my-reports', () => ok(myReports)),
]
