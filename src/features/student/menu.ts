import type { MenuItem } from '@/components/layout'

// 수강생 사이드바 1차 메뉴 — 정본: LMS-DOCS 화면_IA.md §수강생 포털.
// (마이프로필·설정은 헤더 아바타 드롭다운. 동료평가→프로젝트 상호평가 흡수, 기수게시판 폐기)
// 하위 라우트/화면은 소유자가 features/student/에 추가한다.
export const studentMenu: MenuItem[] = [
  { label: '대시보드', to: '/student' },
  { label: '나의 과정', to: '/student/courses' },
  { label: '출결/태도', to: '/student/attendance' },
  { label: '기록실', to: '/student/records' },
  { label: '프로젝트', to: '/student/projects' },
  { label: '트러블슈팅', to: '/student/troubleshooting' },
  { label: '멘토링', to: '/student/mentoring' },
  { label: '수강 역량 증명서', to: '/student/certificate' },
  { label: '마일리지', to: '/student/mileage' },
  { label: 'PLAY', to: '/student/play' },
]
