import type { MenuNode } from '@/components/layout'

// 운영(매니저/ADMIN) 사이드바 메뉴 — Figma "운영 대시보드 v2" 사이드바 기준.
// 항목이 16개로 많아 2026-06-25 업무 기준 4개 대분류(드롭다운)로 묶음(B안). 라벨·라우트는 기존 정합 유지.
//   - 대시보드(상단)·설정(하단)은 진입/탈출점이라 그룹에 넣지 않고 leaf로 고정.
//   - 검토·심사 = 매니저 일과의 중심(학습기록·인증·이력서·평판).
//   - 학습·보상 = 매니저 제작 → 수강생 노출 콘텐츠(퀴즈·PLAY) + 마일리지·증명서 템플릿.
//   - 데이터·연동 = 백오피스 플러밍(CSV·격리 큐·외부 연동).
//
// '외부 연동'은 Figma 사이드바에 없던 화면이라 진입점 확보를 위해 추가(2026-06-15) — URL 직접 입력 제거.
// 학생 이력서 피드백은 '이력서 관리' 화면의 '피드백 관리' 탭으로 통합 — 별도 메뉴/페이지 없음.
export const adminMenu: MenuNode[] = [
  { label: '대시보드', to: '/admin' },
  {
    label: '기수 설계·운영',
    children: [
      { label: '과정·기수·교과목', to: '/admin/education' },
      { label: '학생 관리', to: '/admin/students' },
      {
        label: '멘토링 관리',
        to: '/admin/mentors/assignments',
        // 배정(/admin/mentors/*) + 일지·템플릿·통계(/admin/mentoring/*) 진입 시 활성 유지
        match: ['/admin/mentoring', '/admin/mentors'],
      },
    ],
  },
  {
    label: '검토·심사',
    children: [
      {
        label: '학습 기록 검토',
        to: '/admin/records/review',
        // 검토 상세 3종(/admin/records/{blog|study|certificates}/:id) 진입 시에도 활성 유지
        match: ['/admin/records'],
      },
      {
        label: '인증 검토',
        to: '/admin/certificates/reviews',
        // 검토 상세(reviews/:id)·스냅샷(:id/snapshot)·감사 로그(:id/audit) 진입 시에도 활성 유지
        match: ['/admin/certificates'],
      },
      { label: '이력서 관리', to: '/admin/resume' },
      { label: '평판 관리', to: '/admin/reputation' },
    ],
  },
  {
    label: '학습·보상',
    children: [
      { label: '퀴즈 운영', to: '/admin/quizzes' },
      { label: 'PLAY 관리', to: '/admin/play/typing-texts' },
      { label: '마일리지', to: '/admin/mileage' },
      { label: '증명서 템플릿', to: '/admin/certificate-template' },
    ],
  },
  {
    label: '데이터·연동',
    children: [
      { label: 'CSV 매핑', to: '/admin/csv-mapping' },
      { label: '인입 격리 큐', to: '/admin/ingestion/quarantine' },
      { label: '외부 연동', to: '/admin/integrations' },
    ],
  },
  // 설정 — 랜딩(/admin/settings)이 계정 관리이며, 하위 탭(hrd-api-key·course-config·
  // courses/new)은 prefix 매칭으로 활성 유지. 운영 계정·권한 메뉴는 설정으로 통합되어 폐지.
  { label: '설정', to: '/admin/settings' },
]
