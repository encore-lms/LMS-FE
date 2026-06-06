import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

// 나의 과정 탭바 — Figma 강의 홈(165:27) 상단 탭: 밑줄형(활성 탭 하단 브랜드 라인, 서브숫자·박스 없음).
export type CourseTabKey = 'home' | 'quizzes' | 'materials'

interface TabDef {
  key: string
  label: string
  to: string
  end?: boolean
}

const TABS: TabDef[] = [
  { key: 'home', label: '강의 홈', to: '/student/course', end: true },
  { key: 'quizzes', label: '퀴즈', to: '/student/quizzes' },
  { key: 'materials', label: '자료실', to: '/student/course/materials' },
  { key: 'assignments', label: '과제/실습', to: '/student/course/assignments' },
  { key: 'report', label: '역량 리포트', to: '/student/course/competency' },
]

// 밑줄형 전환으로 이전 박스형의 서브숫자(counts)는 제거됨.
export function CourseTabs() {
  return (
    <nav className="border-border flex w-full gap-1 border-b">
      {TABS.map((t) => (
        <NavLink
          key={t.key}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            cn(
              'relative px-5 py-3 text-[14px] transition-colors',
              isActive
                ? 'text-brand font-bold'
                : 'text-fg-muted hover:text-fg font-medium',
            )
          }
        >
          {({ isActive }) => (
            <>
              {t.label}
              {isActive && (
                <span className="bg-brand absolute inset-x-3 -bottom-px h-[2px] rounded-full" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
