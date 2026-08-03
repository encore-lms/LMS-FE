import type { MenuNode } from '@/components/layout'
import { TERMS, roleTag } from '@/shared/constants'

// 운영(매니저/ADMIN) 사이드바 메뉴 — Figma "운영 대시보드 v2" 사이드바 기준.
// 항목이 16개로 많아 2026-06-25 업무 기준 4개 대분류(드롭다운)로 묶음(B안). 라벨·라우트는 기존 정합 유지.
//   - 대시보드(상단)·설정(하단)은 진입/탈출점이라 그룹에 넣지 않고 leaf로 고정.
//   - 검토·심사 = 매니저 일과의 중심(학습기록·인증·이력서·평판).
//   - 학습·보상 = 매니저 제작 → 수강생 노출 콘텐츠(퀴즈·PLAY) + 마일리지·역량 증명서.
//   - 데이터·연동 = 백오피스 플러밍(CSV·격리 큐·외부 연동).
//
// '외부 연동'은 Figma 사이드바에 없던 화면이라 진입점 확보를 위해 추가(2026-06-15) — URL 직접 입력 제거.
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
    label: roleTag('검토·심사', '매니저'),
    children: [
      // 학습 기록 검토·이력서 관리는 과정·기수·교과목 탭(기록실·이력서)으로 흡수(메뉴 제거).
      {
        label: '인증 검토',
        to: '/admin/certificates/reviews',
        // 검토 상세(reviews/:id)는 to prefix 매칭으로 활성 유지.
        // match: ['/admin/certificates']는 역량 증명서 관리(목록·상세)까지 잡아 이중 active를
        // 만들어 제거(2026-08-01). 스냅샷·감사 로그(certificates/:id/*)의 활성 유지는
        // 경로가 관리 상세(:studentId)와 prefix 를 공유해 라우트 재설계 전엔 표현 불가 — 보류.
        // BE 엔드포인트 미구현(404) — 오픈 시 comingSoon 제거.
        comingSoon: true,
      },
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
      { label: TERMS.certificate, to: '/admin/certificates' },
    ],
  },
  // 데이터·연동 — 준비 중. 항목 클릭 시 이동 없이 '준비중' 토스트만. 정식 오픈 시 comingSoon 제거.
  {
    label: roleTag('데이터·연동', '매니저'),
    children: [
      { label: 'CSV 매핑', to: '/admin/csv-mapping', comingSoon: true },
      {
        label: '인입 격리 큐',
        to: '/admin/ingestion/quarantine',
        comingSoon: true,
      },
      { label: '외부 연동', to: '/admin/integrations', comingSoon: true },
    ],
  },
  // 설정 — 랜딩(/admin/settings)이 계정 관리이며, 하위 탭(hrd-api-key·
  // courses/new)은 prefix 매칭으로 활성 유지. 운영 계정·권한 메뉴는 설정으로 통합되어 폐지.
  { label: roleTag('설정', '매니저'), to: '/admin/settings' },
]
