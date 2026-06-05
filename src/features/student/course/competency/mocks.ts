import { http, HttpResponse } from 'msw'
import type { CompetencyReport } from './types'

// 과정별 역량 리포트 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// 데이터는 Figma 역량 리포트(3345:5971) 시안 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

const mockReport: CompetencyReport = {
  courseName: '백엔드 부트캠프',
  cohortName: '3기',
  collectedAtLabel: '최신 집계 2026-06-01 09:00 KST · 과정 단위',
  metrics: [
    {
      key: 'attendance',
      label: '출석률',
      value: '96%',
      note: '정상 범위',
      noteTone: 'positive',
    },
    {
      key: 'review',
      label: '과제 검토완료율',
      value: '88%',
      note: '보완요청 2건',
      noteTone: 'warning',
    },
    {
      key: 'quiz',
      label: '퀴즈 평균',
      value: '84.5',
      note: '동료 평균 +3.2',
      noteTone: 'positive',
    },
    {
      key: 'records',
      label: '기록 승인',
      value: '17건',
      note: '최근 7일 +3',
      noteTone: 'positive',
    },
  ],
  skillAxes: [
    { label: '기술', score: 82 },
    { label: '문제해결', score: 78 },
    { label: '소통', score: 73 },
    { label: '실행력', score: 91 },
    { label: '협업', score: 76 },
    { label: '학습', score: 86 },
  ],
  quizCategories: [
    { label: 'Spring', score: 88 },
    { label: 'JPA', score: 72 },
    { label: 'DB/SQL', score: 81 },
    { label: '테스트', score: 64 },
    { label: '협업 도구', score: 79 },
  ],
  evidence: [
    {
      id: 'e1',
      title: '9주차 JPA 과제 제출',
      sub: 'AssignmentSubmission · 보완요청 후 재제출 필요',
      chipLabel: '보완요청',
      chipTone: 'warning',
    },
    {
      id: 'e2',
      title: '5과목 퀴즈 평균',
      sub: 'QuizSubmission · 수동 채점 대기 1건 제외',
      chipLabel: '84.5점',
      chipTone: 'info',
    },
    {
      id: 'e3',
      title: '출석률 96%',
      sub: 'AttendanceRecord · HRD 단방향 원천 기준',
      chipLabel: '정상',
      chipTone: 'success',
    },
  ],
  remediation: [
    {
      id: 'r1',
      chipLabel: 'JPA 카테고리 72점',
      chipTone: 'warning',
      desc: '재응시 가능 퀴즈가 있으면 퀴즈 목록으로 이동합니다.',
    },
    {
      id: 'r2',
      chipLabel: '보완요청 과제 2건',
      chipTone: 'danger',
      desc: '과제 상세에서 피드백을 확인하고 재제출합니다.',
    },
  ],
}

export const handlers = [
  http.get('/api/student/course/competency', () =>
    ok<CompetencyReport>(mockReport),
  ),
]
