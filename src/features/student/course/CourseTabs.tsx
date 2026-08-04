import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useCourseHome } from '../api/course'
import { useMentoringAssigned } from '../api/mentoring'
import type { CourseHome } from './types'

// 교육과정 허브 탭바 — 매니저·강사 허브와 같은 구성·순서(2026-08-05 사이드바 재편).
// 매니저: 과정 홈→수강생→공지→자료실→과제→퀴즈→프로젝트→이력서→기록실→QnA 게시판.
// 수강생 대응: '수강생'(출결·계정 관리) 슬롯은 본인 시점 대응물인 '출결/태도',
// '멘토링(매니저)'는 멘토 배정 시에만 노출(사이드바 시절 조건 유지), '설정(매니저)'는 대응물 없음.
// 각 탭은 기존 라우트로 링크한다 — URL 유지(알림 딥링크·북마크 무회귀), 화면 임베드 없음.
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
  | 'mentoring'

type CountKey = keyof CourseHome['tabCounts']

interface TabDef {
  key: CourseTabKey
  label: string
  to: string
  end?: boolean
  staticSub?: string // 과정 홈 = "오늘"
  countKey?: CountKey // 퀴즈/자료실/과제 = tabCounts 카운트
}

const TABS: TabDef[] = [
  {
    key: 'home',
    label: '과정 홈',
    to: '/student/course',
    end: true,
    staticSub: '오늘',
  },
  { key: 'attendance', label: '출결/태도', to: '/student/attendance' },
  { key: 'notices', label: '공지', to: '/student/course/notices' },
  {
    key: 'materials',
    label: '자료실',
    to: '/student/course/materials',
    countKey: 'materials',
  },
  {
    key: 'assignments',
    label: '과제',
    to: '/student/course/assignments',
    countKey: 'assignments',
  },
  {
    key: 'quizzes',
    label: '퀴즈',
    to: '/student/quizzes',
    countKey: 'quizzes',
  },
  { key: 'projects', label: '프로젝트', to: '/student/projects' },
  { key: 'resume', label: '이력서', to: '/student/resume' },
  { key: 'records', label: '기록실', to: '/student/records' },
  { key: 'qna', label: 'QnA 게시판', to: '/student/qna' },
  { key: 'mentoring', label: '멘토링', to: '/student/mentoring' },
]

export function CourseTabs() {
  // 카운트는 course 요약에서(모든 탭 페이지 공유, react-query 캐시).
  const { data } = useCourseHome()
  const counts = data?.tabCounts
  // 멘토링 — 멘토가 배정된 수강생에게만(사이드바 시절 featureKey 조건 그대로).
  const mentoringAssigned = useMentoringAssigned().data
  const tabs = TABS.filter(
    (t) => t.key !== 'mentoring' || mentoringAssigned !== false,
  )

  return (
    <nav className="bg-surface flex w-full gap-1 overflow-x-auto rounded-2xl p-2 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
      {tabs.map((t) => {
        const sub =
          t.staticSub ??
          (t.countKey && counts ? String(counts[t.countKey]) : undefined)
        return (
          <NavLink
            key={t.key}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'flex min-w-fit flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2.5 transition-colors',
                isActive ? 'bg-brand/10' : 'hover:bg-surface-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'text-[14px] whitespace-nowrap',
                    isActive
                      ? 'text-brand font-bold'
                      : 'text-fg-muted font-medium',
                  )}
                >
                  {t.label}
                </span>
                {sub && (
                  <span
                    className={cn(
                      'text-[11px]',
                      isActive ? 'text-brand/70' : 'text-fg-subtle',
                    )}
                  >
                    {sub}
                  </span>
                )}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
