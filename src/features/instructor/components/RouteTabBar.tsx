import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

/**
 * 라우트 전환 탭바(underline) — 별도 페이지들을 한 화면처럼 탭으로 오간다.
 * 강사 '검토'(학습기록·프로젝트·트러블슈팅)와 '평가 관리'(퀴즈·과제)에서 사용.
 * 기수 탭(각 페이지 내부)과 같은 스타일로 통일.
 */
export function RouteTabBar({
  tabs,
}: {
  tabs: { label: string; to: string }[]
}) {
  const { pathname } = useLocation()
  return (
    <div className="border-divider mb-4 flex flex-wrap items-center gap-1 border-b">
      {tabs.map((t) => {
        const active = pathname === t.to || pathname.startsWith(t.to + '/')
        return (
          <Link
            key={t.to}
            to={t.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors',
              active
                ? 'border-brand text-fg'
                : 'text-fg-subtle hover:text-fg border-transparent',
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}

// 검토 3종 — 학습기록·프로젝트·트러블슈팅 인증 검토.
// 학습 기록 조회는 검토 하위 탭에서 제외(자기참조 탭 삭제). 검토 = 프로젝트·트러블슈팅.
export const REVIEW_TABS = [
  { label: '프로젝트', to: '/instructor/projects/review' },
  { label: '트러블슈팅', to: '/instructor/troubleshooting/review' },
]
