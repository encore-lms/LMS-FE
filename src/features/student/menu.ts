import type { MenuItem } from '@/components/layout'
import { TERMS, roleTag } from '@/shared/constants'

// 수강생 사이드바 1차 메뉴 — 정본: LMS-DOCS 화면_IA.md §수강생 포털.
// 2026-08-05 재편: 매니저·강사 허브와 같은 구조로 통일 — '강의 홈'을 '교육과정'으로 바꾸고
// 출결·프로젝트·이력서·기록실·QnA·멘토링을 교육과정 허브 탭(CourseTabs)으로 흡수했다.
// 라우트 URL은 그대로(알림 딥링크·북마크 무회귀) — 진입 동선만 사이드바 → 허브 탭.
// 교육과정은 3역할 공통 개념이 되어 무접미(원칙 5), 수강생 고유 과업 메뉴만 접미 유지.
// (마이프로필·설정은 헤더 아바타 드롭다운. 동료평가→프로젝트 상호평가 흡수, 기수게시판 폐기)
export const studentMenu: MenuItem[] = [
  // 로그인 직후 실제 경로는 /student/dashboard 라, match 에 없으면 첫 화면에서 메뉴가
  // 아무것도 켜지지 않는다(어디에 있는지 표시가 사라짐).
  {
    label: '대시보드',
    to: '/student',
    match: ['/student/dashboard', '/student/profile'],
  },
  // 교육과정 허브 — 과정 홈·출결/태도·공지·자료실·과제·퀴즈·프로젝트·이력서·기록실·
  // QnA 게시판·멘토링(배정 시) 탭. 흡수된 라우트 전부를 match 로 묶어 활성 표시를 유지한다.
  {
    label: TERMS.educationCourse,
    to: '/student/course',
    match: [
      '/student/quizzes',
      '/student/attendance',
      '/student/projects',
      '/student/resume',
      '/student/records',
      '/student/qna',
      '/student/mentoring',
    ],
  },
  { label: roleTag(TERMS.certificate, '수강생'), to: '/student/certificate' },
  // 과정 기능 토글(정본 CohortFeatureConfig: mileage·play)로 노출 제어.
  {
    label: roleTag('마일리지', '수강생'),
    to: '/student/mileage',
    featureKey: 'mileage',
  },
  // PLAY — 마일리지와 같이 과정 토글로 제어한다. 매니저가 끄면 메뉴에서 사라져야 하는데,
  // comingSoon 만 걸려 있어 토글을 아예 보지 않았다(꺼도 '준비 중'으로 계속 보임).
  {
    label: roleTag('PLAY', '수강생'),
    to: '/student/play',
    featureKey: 'play',
    comingSoon: true,
  },
]
