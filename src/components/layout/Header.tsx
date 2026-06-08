import { useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useAuthActions } from '@/shared/store'

// 헤더 — 콘텐츠 영역 상단 바. 우측 클러스터: 검색 · 알림 · 프로필.
// 검색(전역) · 알림 목록은 BE 데이터 연동 후속이라 현재는 UI까지. 프로필은 로그아웃까지 실동작.
export function Header() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { clearSession } = useAuthActions()
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
    <header className="border-border flex h-16 shrink-0 items-center justify-end gap-3 border-b bg-white px-6">
      {/* 검색 — UI(전역 검색 연동은 후속) */}
      <div className="relative hidden sm:block">
        <Search className="text-fg-subtle pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="search"
          aria-label="검색"
          placeholder="검색"
          className="border-border bg-surface-muted/60 text-fg placeholder:text-fg-subtle focus:border-brand h-9 w-[240px] rounded-lg border pr-3 pl-9 text-[13px] focus:bg-white focus:outline-none"
        />
      </div>

      {/* 알림 */}
      <button
        type="button"
        aria-label="알림"
        className="text-fg-muted hover:text-fg relative"
      >
        <Bell className="h-5 w-5" />
        <span className="bg-danger absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ring-white" />
      </button>

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
                <span className="text-fg-subtle text-[11px]">{user.email}</span>
              )}
            </div>
            <div className="bg-divider my-1 h-px w-full" />
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
    </header>
  )
}
