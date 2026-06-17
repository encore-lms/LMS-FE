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
  { label: '프로젝트', to: '/student/projects' },
  { label: '트러블슈팅', to: '/student/troubleshooting' },
  // 멘토링·마일리지: 사이드바 토글 off(임시) — 라우트(/student/mentoring·/student/mileage)는 유지.
  //   진입 방법(헤더 메뉴/직접 URL 등)은 별도 결정 예정.
  // { label: '멘토링', to: '/student/mentoring' },
  { label: '수강 역량 증명서', to: '/student/certificate' },
  { label: '이력서 관리', to: '/student/resume' },
  // { label: '마일리지', to: '/student/mileage' },
  { label: 'PLAY', to: '/student/play' },
]
