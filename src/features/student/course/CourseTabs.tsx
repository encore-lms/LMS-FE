import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useCourseHome } from '../api/course'
import type { CourseHome } from './types'

// 나의 과정 탭바 — Figma 강의 홈(165:27) 정합: 박스형(활성 탭 연한 brand 배경) + 서브(오늘/카운트).
export type CourseTabKey =
  | 'home'
  | 'notices'
  | 'quizzes'
  | 'materials'
  | 'assignments'

type CountKey = keyof CourseHome['tabCounts']

interface TabDef {
  key: CourseTabKey
  label: string
  to: string
  end?: boolean
  staticSub?: string // 강의 홈 = "오늘"
  countKey?: CountKey // 퀴즈/자료실/과제 = tabCounts 카운트
}

const TABS: TabDef[] = [
  {
    key: 'home',
    label: '강의 홈',
    to: '/student/course',
    end: true,
    staticSub: '오늘',
  },
  {
    key: 'notices',
    label: '공지',
    to: '/student/course/notices',
  },
  {
    key: 'quizzes',
    label: '퀴즈',
    to: '/student/quizzes',
    countKey: 'quizzes',
  },
  {
    key: 'materials',
    label: '자료실',
    to: '/student/course/materials',
    countKey: 'materials',
  },
  {
    key: 'assignments',
    label: '과제/실습',
    to: '/student/course/assignments',
    countKey: 'assignments',
  },
]

export function CourseTabs() {
  // 카운트는 course 요약에서(모든 탭 페이지 공유, react-query 캐시).
  const { data } = useCourseHome()
  const counts = data?.tabCounts

  return (
    <nav className="bg-surface flex w-full gap-2 rounded-2xl p-2 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
      {TABS.map((t) => {
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
                'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 transition-colors',
                isActive ? 'bg-brand/10' : 'hover:bg-surface-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'text-[14px]',
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
