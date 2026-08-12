import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { useMentoringAssigned } from '../api/mentoring'

// 교육과정 허브 탭바 — 매니저·강사 허브와 같은 컴포넌트(공용 Tabs underline)·같은 구성·순서
// (2026-08-05 사이드바 재편 → 08-05 컴포넌트 통일, 카운트 배지도 제거해 완전 동일).
// 매니저: 과정 홈→수강생→공지→자료실→과제→퀴즈→프로젝트→이력서→기록실→QnA 게시판.
// 수강생 대응: '수강생'(출결·계정 관리) 슬롯은 본인 시점 대응물인 '출결/태도',
// '멘토링(매니저)'는 멘토 배정 시에만 노출(사이드바 시절 조건 유지), '설정(매니저)'는 대응물 없음.
// 각 탭은 기존 라우트로 링크한다(Tabs 링크 모드) — URL 유지(알림 딥링크·북마크 무회귀).
export type CourseTabKey =
  | 'home'
  | 'attendance'
  | 'notices'
  | 'materials'
  | 'assignments'
  | 'quizzes'
  | 'projects'
  | 'resume'
  | 'records'
  | 'qna'
  | 'diagnosis'
  | 'mentoring'

interface TabDef {
  key: CourseTabKey
  label: string
  to: string
  end?: boolean
}

const TABS: TabDef[] = [
  { key: 'home', label: '과정 홈', to: '/student/course', end: true },
  { key: 'attendance', label: '출결/태도', to: '/student/attendance' },
  { key: 'notices', label: '공지', to: '/student/course/notices' },
  { key: 'materials', label: '자료실', to: '/student/course/materials' },
  { key: 'assignments', label: '과제', to: '/student/course/assignments' },
  { key: 'quizzes', label: '퀴즈', to: '/student/quizzes' },
  { key: 'projects', label: '프로젝트', to: '/student/projects' },
  { key: 'resume', label: '이력서', to: '/student/resume' },
  { key: 'records', label: '기록실', to: '/student/records' },
  { key: 'qna', label: 'QnA 게시판', to: '/student/qna' },
  // 진단 리포트 — LLM 수준 진단 PoV(주간 리포트 열람). QnA 우측 배치(2026-08-10).
  { key: 'diagnosis', label: '진단 리포트', to: '/student/course/diagnosis' },
  { key: 'mentoring', label: '멘토링', to: '/student/mentoring' },
]

export function CourseTabs() {
  // 멘토링 — 멘토가 배정된 수강생에게만(사이드바 시절 featureKey 조건 그대로).
  const mentoringAssigned = useMentoringAssigned().data

  const items: TabItem[] = TABS.filter(
    (t) => t.key !== 'mentoring' || mentoringAssigned !== false,
  ).map((t) => ({
    value: t.key,
    label: t.label,
    to: t.to,
    end: t.end,
  }))

  return (
    <Tabs
      variant="underline"
      aria-label="교육과정 탭"
      items={items}
      className="overflow-x-auto"
    />
  )
}
