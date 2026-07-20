import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

// 프로필 섹션 카드 — 제목(+설명) + 본문. 기본정보·외부URL·스킬·공개설정이 공유.
export function ProfileCard({
  title,
  description,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'bg-surface flex flex-col gap-4 rounded-xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]',
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="text-fg font-bold">{title}</h2>
        {description && <p className="text-fg-subtle text-xs">{description}</p>}
      </div>
      {children}
    </section>
  )
}
