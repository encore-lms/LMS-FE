import type { MenuItem } from '@/components/layout'

// 운영(매니저/ADMIN) 사이드바 1차 메뉴 — 정본: LMS-DOCS 화면_IA.md §운영 콘솔.
export const adminMenu: MenuItem[] = [
  { label: '대시보드', to: '/admin' },
  { label: '과정·기수·교과목', to: '/admin/courses' },
  { label: '운영 계정·권한', to: '/admin/accounts' },
  { label: '학생 계정 관리', to: '/admin/students' },
  { label: '마일리지 관리', to: '/admin/mileage' },
  { label: '매니저 설정', to: '/admin/settings' },
  { label: '퀴즈/문제 관리', to: '/admin/quizzes' },
  { label: '학습 기록 검토 큐', to: '/admin/record-review' },
  { label: '학생 이력서 피드백', to: '/admin/resume-feedback' },
  { label: 'CSV 매핑·업로드', to: '/admin/csv' },
  { label: '인입 격리 큐', to: '/admin/quarantine' },
  { label: '외부 연동', to: '/admin/integrations' },
  { label: '증명서 템플릿', to: '/admin/certificate-templates' },
  { label: '평판 관리', to: '/admin/reputation' },
  { label: '멘토 배정 관리', to: '/admin/mentor-assignment' },
  { label: '멘토링 일지 관리', to: '/admin/mentor-journals' },
  { label: '멘토링 일지 템플릿', to: '/admin/journal-templates' },
  { label: '인증 검토 큐', to: '/admin/certification-review' },
]
