import { Lock } from 'lucide-react'

/**
 * 외부 검증 전용 topbar — 비로그인 public 화면이라 AppShell(Header) 미사용.
 * 브랜드 마크('P' + 워드마크)는 내부 진입점 노출 금지 추정에 따라 링크가 아니다.
 * Figma 2815:174 — 우측 HTTPS 칩의 12×12 아이콘 자리는 빈 프레임이라 lucide Lock으로 채움.
 */
export function VerifyTopbar() {
  return (
    // 비로그인 공유 URL이라 모바일 유입 전제 — 좌우 여백은 좁은 폭에서 축소하고,
    // 브랜드 마크와 HTTPS 칩은 압축되지 않게 고정한다.
    <header className="border-divider bg-surface flex h-[72px] items-center justify-between gap-3 border-b px-4 sm:px-12">
      <div className="flex min-w-0 items-center gap-2">
        <span className="bg-brand text-on-color flex size-8 shrink-0 items-center justify-center rounded-lg text-lg font-bold">
          P
        </span>
        <span className="text-fg truncate text-base font-bold tracking-[0.96px]">
          PLAYDATA — 외부 검증
        </span>
      </div>
      {/* 375px 에서는 워드마크와 함께 놓을 폭이 없어(합계 ≈ 400px) 칩을 숨긴다 */}
      <span className="bg-success-bg text-success hidden shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap sm:flex">
        <Lock size={12} aria-hidden className="shrink-0" />
        HTTPS · 검증 전용 페이지
      </span>
    </header>
  )
}
