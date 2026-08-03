import type { MenuItem } from '@/components/layout'
import { TERMS, roleTag } from '@/shared/constants'

// 수강생 사이드바 1차 메뉴 — 정본: LMS-DOCS 화면_IA.md §수강생 포털.
// 수강생 고유 과업(수강·제출·응시·신청) 메뉴는 roleTag('수강생') 접미(2026-08-03, 과업 기준).
// 대시보드(전 역할 공통 개념)·QnA 게시판(3역할 공용 화면)만 무접미.
// (마이프로필·설정은 헤더 아바타 드롭다운. 동료평가→프로젝트 상호평가 흡수, 기수게시판 폐기)
// 하위 라우트/화면은 소유자가 features/student/에 추가한다.
export const studentMenu: MenuItem[] = [
  // 마이 프로필(헤더 드롭다운 진입, 사이드바 항목 없음)은 홈=대시보드 강조 유지.
  // 로그인 직후 실제 경로는 /student/dashboard 라, match 에 없으면 첫 화면에서 메뉴가
  // 아무것도 켜지지 않는다(어디에 있는지 표시가 사라짐).
  {
    label: '대시보드',
    to: '/student',
    match: ['/student/dashboard', '/student/profile'],
  },
  // 나의 과정 = 강의홈·자료실·과제(/student/course/*) + 퀴즈(/student/quizzes)
  {
    label: roleTag(TERMS.lectureHome, '수강생'),
    to: '/student/course',
    match: ['/student/quizzes'],
  },
  { label: roleTag('출결/태도', '수강생'), to: '/student/attendance' },
  { label: roleTag('기록실', '수강생'), to: '/student/records' },
  { label: roleTag(TERMS.certificate, '수강생'), to: '/student/certificate' },
  { label: roleTag('이력서', '수강생'), to: '/student/resume' },
  { label: roleTag('프로젝트', '수강생'), to: '/student/projects' },
  { label: roleTag('트러블슈팅', '수강생'), to: '/student/troubleshooting' },
  // QnA 게시판 — FE 선반영(기수 게시판 폐기 2026-05-21 이후 재도입 프로토타입). 정식화 시 재합의 필요.
  { label: TERMS.qnaBoard, to: '/student/qna' },
  // 멘토링 — 운영 매니저가 멘토를 배정한 수강생에게만 노출(AppShellWithMenu에서
  // /student/mentoring의 mentor.assigned를 features.mentoring으로 합성).
  {
    label: roleTag('멘토링', '수강생'),
    to: '/student/mentoring',
    featureKey: 'mentoring',
  },
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
