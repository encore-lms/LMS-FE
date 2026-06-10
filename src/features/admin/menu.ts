import type { MenuItem } from '@/components/layout'

// 운영(매니저/ADMIN) 사이드바 메뉴 — Figma "운영 대시보드 v2" 사이드바 기준(학생 관리 밑 이력서 관리 포함 15개).
// 라벨·순서·구성 모두 Figma 정합.
//
// Figma 사이드바에 없어 제외한 실제 운영 화면(라우트는 존재하므로 URL/컨텍스트 진입 가능,
// 추후 그룹·하위 네비 설계 시 재배치): 학생 이력서 피드백(/admin/resume-feedback),
// 외부 연동(/admin/integrations), 멘토 배정 관리(/admin/mentor-assignment),
// 멘토링 일지 관리(/admin/mentor-journals), 멘토링 일지 템플릿(/admin/journal-templates).
export const adminMenu: MenuItem[] = [
  { label: '대시보드', to: '/admin' },
  { label: '과정·기수·교과목', to: '/admin/courses' },
  { label: '학생 관리', to: '/admin/students' },
  { label: '이력서 관리', to: '/admin/resume' },
  { label: '운영 계정·권한', to: '/admin/accounts' },
  { label: '인증 검토', to: '/admin/certificates/reviews' },
  { label: '평판 관리', to: '/admin/reputation' },
  { label: 'CSV 매핑', to: '/admin/csv' },
  { label: '인입 격리 큐', to: '/admin/quarantine' },
  { label: '마일리지', to: '/admin/mileage' },
  { label: '증명서 템플릿', to: '/admin/certificate-templates' },
  { label: '퀴즈 운영', to: '/admin/quizzes' },
  { label: '학습 기록 검토', to: '/admin/records/review' },
  { label: 'PLAY 관리', to: '/admin/play' },
  { label: '설정', to: '/admin/settings' },
]
