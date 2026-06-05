import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

// 나의 과정 탭바 — Figma 강의 홈(165:27) 상단 탭. 강의홈/퀴즈/자료실은 라우팅,
// 과제·실습/역량 리포트는 이번 범위 밖이라 보이되 비활성(404 방지).
export type CourseTabKey = 'home' | 'quizzes' | 'materials'

interface TabDef {
  key: string
  label: string
  sub?: string
  to?: string // 없으면 비활성
  end?: boolean
}

const baseTab =
  'flex h-[52px] flex-[1_0_0] flex-col items-center justify-center gap-0.5 rounded-[10px] px-[18px] py-2 text-center'

function tabClass(isActive: boolean) {
  return cn(baseTab, isActive ? 'bg-brand/10' : 'hover:bg-surface-muted')
}

export function CourseTabs({
  counts,
}: {
  counts?: { quizzes?: number; materials?: number; assignments?: number }
}) {
  const tabs: TabDef[] = [
    {
      key: 'home',
      label: '강의 홈',
      sub: '오늘',
      to: '/student/course',
      end: true,
    },
    {
      key: 'quizzes',
      label: '퀴즈',
      sub: counts?.quizzes != null ? String(counts.quizzes) : undefined,
      to: '/student/quizzes',
    },
    {
      key: 'materials',
      label: '자료실',
      sub: counts?.materials != null ? String(counts.materials) : undefined,
      to: '/student/course/materials',
    },
    {
      key: 'assignments',
      label: '과제/실습',
      sub: counts?.assignments != null ? String(counts.assignments) : undefined,
      to: '/student/course/assignments',
    },
    { key: 'report', label: '역량 리포트', to: '/student/course/competency' },
  ]

  return (
    <nav className="border-border bg-surface flex w-full gap-1 rounded-[14px] border p-2 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
      {tabs.map((t) =>
        t.to ? (
          <NavLink
            key={t.key}
            to={t.to}
            end={t.end}
            className={({ isActive }) => tabClass(isActive)}
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
                {t.sub != null && (
                  <span
                    className={cn(
                      'text-[10px]',
                      isActive ? 'text-brand' : 'text-fg-subtle',
                    )}
                  >
                    {t.sub}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ) : (
          // 비활성(범위 밖) 탭 — 클릭 불가
          <div
            key={t.key}
            className={cn(baseTab, 'cursor-default')}
            aria-disabled
            title="준비 중"
          >
            <span className="text-fg-subtle text-[14px] font-medium">
              {t.label}
            </span>
            {t.sub != null && (
              <span className="text-fg-subtle text-[10px]">{t.sub}</span>
            )}
          </div>
        ),
      )}
    </nav>
  )
}
