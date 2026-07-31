import type { MenuItem } from '@/components/layout'

// 수강생 사이드바 1차 메뉴 — 정본: LMS-DOCS 화면_IA.md §수강생 포털.
// (마이프로필·설정은 헤더 아바타 드롭다운. 동료평가→프로젝트 상호평가 흡수, 기수게시판 폐기)
// 하위 라우트/화면은 소유자가 features/student/에 추가한다.
export const studentMenu: MenuItem[] = [
  // 마이 프로필(헤더 드롭다운 진입, 사이드바 항목 없음)은 홈=대시보드 강조 유지.
  { label: '대시보드', to: '/student', match: ['/student/profile'] },
  // 나의 과정 = 강의홈·자료실·과제(/student/course/*) + 퀴즈(/student/quizzes)
  { label: '나의 과정', to: '/student/course', match: ['/student/quizzes'] },
  { label: '출결/태도', to: '/student/attendance' },
  { label: '기록실', to: '/student/records' },
  { label: '수강 역량 증명서', to: '/student/certificate' },
  { label: '이력서 관리', to: '/student/resume' },
  { label: '프로젝트', to: '/student/projects' },
  { label: '트러블슈팅', to: '/student/troubleshooting' },
  // QnA 게시판 — FE 선반영(기수 게시판 폐기 2026-05-21 이후 재도입 프로토타입). 정식화 시 재합의 필요.
  { label: 'QnA 게시판', to: '/student/qna' },
  // 멘토링 — 운영 매니저가 멘토를 배정한 수강생에게만 노출(AppShellWithMenu에서
  // /student/mentoring의 mentor.assigned를 features.mentoring으로 합성).
  { label: '멘토링', to: '/student/mentoring', featureKey: 'mentoring' },
  // 과정 기능 토글(정본 CohortFeatureConfig: mileage·play)로 노출 제어.
  { label: '마일리지', to: '/student/mileage', featureKey: 'mileage' },
  // PLAY — 마일리지와 같이 과정 토글로 제어한다. 매니저가 끄면 메뉴에서 사라져야 하는데,
  // comingSoon 만 걸려 있어 토글을 아예 보지 않았다(꺼도 '준비 중'으로 계속 보임).
  { label: 'PLAY', to: '/student/play', featureKey: 'play', comingSoon: true },
]
