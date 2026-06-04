import type { MenuItem } from '@/components/layout'

// 운영(매니저/ADMIN) 사이드바 메뉴.
// 라벨·순서: Figma "운영 대시보드 v2" 사이드바 정합(2026-06-04).
// 항목 구성: 화면_IA.md §운영 콘솔 기준 유지 — 멘토·이력서·외부 연동은 Figma 사이드바엔
// 없으나 실제 운영 화면이라 하단에 유지(라우트는 기존 그대로, 라벨만 변경).
export const adminMenu: MenuItem[] = [
  { label: '대시보드', to: '/admin' },
  { label: '과정·기수·교과목', to: '/admin/courses' },
  { label: '학생 관리', to: '/admin/students' },
  { label: '운영 계정·권한', to: '/admin/accounts' },
  { label: '인증 검토', to: '/admin/certification-review' },
  { label: '평판 관리', to: '/admin/reputation' },
  { label: 'CSV 매핑', to: '/admin/csv' },
  { label: '인입 격리 큐', to: '/admin/quarantine' },
  { label: '마일리지', to: '/admin/mileage' },
  { label: '증명서 템플릿', to: '/admin/certificate-templates' },
  { label: '퀴즈 운영', to: '/admin/quizzes' },
  { label: '학습 기록 검토', to: '/admin/record-review' },
  { label: 'PLAY 관리', to: '/admin/play' },
  { label: '설정', to: '/admin/settings' },
  // Figma v2 사이드바엔 없지만 실제 운영 화면 — 하단 유지
  { label: '학생 이력서 피드백', to: '/admin/resume-feedback' },
  { label: '외부 연동', to: '/admin/integrations' },
  { label: '멘토 배정 관리', to: '/admin/mentor-assignment' },
  { label: '멘토링 일지 관리', to: '/admin/mentor-journals' },
  { label: '멘토링 일지 템플릿', to: '/admin/journal-templates' },
]
