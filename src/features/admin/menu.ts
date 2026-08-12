import type { MenuNode } from '@/components/layout'
import { TERMS, roleTag } from '@/shared/constants'

// 운영(매니저/ADMIN) 사이드바 메뉴 — Figma "운영 대시보드 v2" 사이드바 기준.
// 항목이 16개로 많아 2026-06-25 업무 기준 4개 대분류(드롭다운)로 묶음(B안). 라벨·라우트는 기존 정합 유지.
//   - 대시보드(상단)·설정(하단)은 진입/탈출점이라 그룹에 넣지 않고 leaf로 고정.
//   - 검토·심사 = 내용을 들여다보고 판단하는 일(역량 증명서·평판).
//   - 학습·보상 = 매니저 제작 → 수강생 노출 콘텐츠(PLAY) + 마일리지.
//
// 강사에게 없는 매니저 전용 메뉴는 roleTag('매니저') 접미로 명시(2026-08-03) — 그룹 전체 전용이면 그룹명에만.
// 학생 이력서 피드백은 '이력서 관리' 화면의 '피드백 관리' 탭으로 통합 — 별도 메뉴/페이지 없음.
export const adminMenu: MenuNode[] = [
  // 로그인 nextRoute가 /admin/dashboard라 to=/admin(정확 일치)만으론 활성이 풀린다 → match로 묶는다.
  { label: '대시보드', to: '/admin', match: ['/admin/dashboard'] },
  // 학생 관리·멘토링 관리·QnA 게시판은 기수 허브(/admin/education/:cohortId)의 탭으로 옮겼다 —
  // 셋 다 기수를 고른 뒤에 하는 일이라 단독 메뉴로 두면 화면에 들어가서 기수를 또 골라야 했다.
  // 남은 항목이 하나뿐이라 그룹을 풀고 leaf 로 둔다. 단독 라우트는 딥링크·알림 목적지로 유지.
  {
    label: TERMS.educationCourse,
    to: '/admin/education',
    match: [
      '/admin/students',
      '/admin/mentoring',
      '/admin/mentors',
      '/admin/qna',
    ],
  },
  {
    // 학습 기록 검토·이력서 관리는 과정·기수·교과목 탭(기록실·이력서)으로 흡수(메뉴 제거).
    // 인증 검토는 역량 증명서 상세로 흡수(2026-08-06) — 증명서 한 장을 두 화면에서 보던 것을
    // 한곳으로 모았다. 그래서 역량 증명서는 '만들어 주는 콘텐츠'(학습·보상)가 아니라
    // '내용을 들여다보고 판단하는 일'이라, 평판 관리와 함께 둔다(2026-08-06).
    label: roleTag('검토·심사', '매니저'),
    children: [
      { label: TERMS.certificate, to: '/admin/certificates' },
      { label: '평판 관리', to: '/admin/reputation' },
    ],
  },
  {
    label: roleTag('학습·보상', '매니저'),
    children: [
      // 퀴즈 운영은 과정·기수·교과목 '퀴즈' 탭으로 흡수(메뉴 제거).
      // PLAY 타자 관리 — 실저장 CRUD·복제·CSV 일괄 업로드 완결(2026-07-30 오픈).
      { label: 'PLAY 관리', to: '/admin/play/typing-texts' },
      { label: '마일리지', to: '/admin/mileage' },
    ],
  },
  // 설정 — 랜딩(/admin/settings)이 계정 관리이며, 하위 탭(hrd-api-key·
  // courses/new)은 prefix 매칭으로 활성 유지. 운영 계정·권한 메뉴는 설정으로 통합되어 폐지.
  { label: roleTag('설정', '매니저'), to: '/admin/settings' },
]
