import { Bell } from 'lucide-react'

// 헤더 — 콘텐츠 영역 상단 바(로고는 사이드바로 이동). 검색·사용자 드롭다운 등 상세는 후속.
export function Header() {
  return (
    <header className="border-border flex h-16 shrink-0 items-center justify-end gap-4 border-b bg-white px-6">
      <button
        type="button"
        aria-label="알림"
        className="text-fg-muted hover:text-fg"
      >
        <Bell className="h-5 w-5" />
      </button>
      <div
        aria-label="프로필"
        className="bg-surface-muted h-8 w-8 rounded-full"
      />
    </header>
  )
}
