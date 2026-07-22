import { useEffect, useRef, useState } from 'react'
import { LogOut, Search, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useAuthActions, usePageHeaderStore } from '@/shared/store'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { PROFILE_PATH } from '@/features/profile/paths'

// 헤더 — 콘텐츠 영역 상단 바. 좌측: 페이지 제목·설명(usePageHeader로 각 페이지가 등록),
// 우측 클러스터: 검색 · 알림 · 프로필. 구분선 없이 본문과 이어지는 통합형(Figma 기준).
// 검색(전역) · 알림 목록은 BE 데이터 연동 후속이라 현재는 UI까지. 프로필은 로그아웃까지 실동작.
export function Header() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { clearSession } = useAuthActions()
  const title = usePageHeaderStore((s) => s.title)
  const description = usePageHeaderStore((s) => s.description)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const initial = (user?.name ?? user?.email ?? '?').slice(0, 1)

  const logout = () => {
    clearSession()
    setOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex min-h-[80px] shrink-0 items-center justify-between gap-6 bg-white px-8 py-4">
      {/* 페이지 제목 — 각 페이지가 usePageHeader()로 등록(본문 h1 대체) */}
      <div className="flex min-w-0 flex-col gap-0.5">
        {title && (
          <h1 className="text-fg truncate text-[22px] font-bold">{title}</h1>
        )}
        {description && (
          <p className="text-fg-muted truncate text-[13px]">{description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {/* 검색 — UI(전역 검색 연동은 후속) */}
        <div className="relative hidden sm:block">
          <Search className="text-fg-subtle pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="search"
            aria-label="검색"
            placeholder="검색"
            className="border-border bg-surface-muted/60 text-fg placeholder:text-fg-subtle focus:border-brand h-9 w-[240px] rounded-lg border pr-3 pl-9 text-[13px] focus:bg-white focus:outline-none focus-visible:shadow-none"
          />
        </div>

        {/* 알림 — 전 역할 공통 드롭다운(서버 알림은 역할별로 useRoleNotifications가 분기) */}
        <NotificationBell />

        {/* 프로필 */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="프로필 메뉴"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="bg-brand flex size-8 items-center justify-center rounded-full text-[13px] font-bold text-white"
          >
            {initial}
          </button>
          {open && (
            <div className="border-border absolute right-0 z-40 mt-2 w-56 rounded-xl border bg-white p-1.5 shadow-[0px_12px_32px_0px_rgba(18,23,38,0.16)]">
              <div className="flex flex-col gap-0.5 px-3 py-2">
                <span className="text-fg text-[13px] font-bold">
                  {user?.name ?? '사용자'}
                </span>
                {user?.email && (
                  <span className="text-fg-subtle text-[11px]">
                    {user.email}
                  </span>
                )}
              </div>
              <div className="bg-divider my-1 h-px w-full" />
              {/* 마이 프로필 — 전 역할 노출(§7-X '항상'), 역할별 경로로 이동 */}
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate(PROFILE_PATH[role ?? 'STUDENT'])
                }}
                className="text-fg hover:bg-surface-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium"
              >
                <User className="h-4 w-4" />
                마이 프로필
              </button>
              <button
                type="button"
                onClick={logout}
                className="text-fg hover:bg-surface-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
