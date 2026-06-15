import { http, HttpResponse } from 'msw'
import type { EducationOverview } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 과정·기수·교과목 통합 (Figma 1543:11011) ──
// 단위기간·주차 기반 교과목/모듈 + 담당·연결 기능. (P0_22 BE 계약 확정 시 교체)
const overview: EducationOverview = {
  summary: {
    courses: 18,
    coursesHrdLinked: 16,
    cohorts: 32,
    cohortsActive: 21,
    modules: 64,
    weeks: 312,
  },
  rows: [
    {
      id: 'mod-1',
      cohortLabel: 'AI 캠프 22기',
      moduleName: 'Java/Spring 기본',
      unit: '1단위',
      owner: '김강사',
      linkedFeatures: '퀴즈 4 · 기록실 6주',
    },
    {
      id: 'mod-2',
      cohortLabel: 'AI 캠프 22기',
      moduleName: 'React 프로젝트',
      unit: '2단위',
      owner: '박멘토',
      linkedFeatures: '프로젝트 · 평판',
    },
    {
      id: 'mod-3',
      cohortLabel: 'AI 캠프 22기',
      moduleName: '취업 포트폴리오',
      unit: '3단위',
      owner: '이정훈',
      linkedFeatures: '이력서 · 증명서',
    },
  ],
}

export const handlers = [
  http.get('/api/admin/education', () => ok<EducationOverview>(overview)),
]
