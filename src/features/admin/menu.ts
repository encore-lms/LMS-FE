import type { MenuItem } from '@/components/layout'

// 운영(매니저/ADMIN) 사이드바 메뉴 — Figma "운영 대시보드 v2" 사이드바 기준
// (2026-06-12 갱신: '멘토링 관리' 포함 16개). 라벨·순서·구성 모두 Figma 정합.
//
// Figma 사이드바에 없던 '외부 연동'은 진입점 확보를 위해 추가(2026-06-15) — URL 직접 입력 제거.
// 여전히 제외 중: 학생 이력서 피드백(/admin/resume-feedback).
export const adminMenu: MenuItem[] = [
  { label: '대시보드', to: '/admin' },
  { label: '과정·기수·교과목', to: '/admin/education' },
  { label: '학생 관리', to: '/admin/students' },
  { label: '이력서 관리', to: '/admin/resume' },
  { label: '운영 계정·권한', to: '/admin/settings/accounts' },
  { label: '인증 검토', to: '/admin/certificates/reviews' },
  { label: '평판 관리', to: '/admin/reputation' },
  { label: 'CSV 매핑', to: '/admin/csv-mapping' },
  { label: '인입 격리 큐', to: '/admin/ingestion/quarantine' },
  { label: '마일리지', to: '/admin/mileage' },
  { label: '증명서 템플릿', to: '/admin/certificate-template' },
  { label: '퀴즈 운영', to: '/admin/quizzes' },
  {
    label: '학습 기록 검토',
    to: '/admin/records/review',
    // 검토 상세 3종(/admin/records/{blog|study|certificates}/:id) 진입 시에도 활성 유지
    match: ['/admin/records'],
  },
  {
    label: '멘토링 관리',
    to: '/admin/mentors/assignments',
    // 배정(/admin/mentors/*) + 일지·템플릿·통계(/admin/mentoring/*) 진입 시 활성 유지
    match: ['/admin/mentoring', '/admin/mentors'],
  },
  { label: 'PLAY 관리', to: '/admin/play/typing-texts' },
  { label: '외부 연동', to: '/admin/integrations' },
  { label: '설정', to: '/admin/settings' },
]
