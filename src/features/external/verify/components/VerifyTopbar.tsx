import { Lock } from 'lucide-react'

/**
 * 외부 검증 전용 topbar — 비로그인 public 화면이라 AppShell(Header) 미사용.
 * 브랜드 마크('P' + 워드마크)는 내부 진입점 노출 금지 추정에 따라 링크가 아니다.
 * Figma 2815:174 — 우측 HTTPS 칩의 12×12 아이콘 자리는 빈 프레임이라 lucide Lock으로 채움.
 */
export function VerifyTopbar() {
  return (
    <header className="border-divider bg-surface flex h-[72px] items-center justify-between border-b px-12">
      <div className="flex items-center gap-2">
        <span className="bg-brand text-on-color flex size-8 items-center justify-center rounded-lg text-lg font-bold">
          P
        </span>
        <span className="text-fg text-base font-bold tracking-[0.96px]">
          PLAYDATA — 외부 검증
        </span>
      </div>
      <span className="bg-success-bg text-success flex items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[11px] font-bold">
        <Lock size={12} aria-hidden />
        HTTPS · 검증 전용 페이지
      </span>
    </header>
  )
}
