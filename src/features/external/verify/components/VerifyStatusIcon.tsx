import type { ReactNode } from 'react'
import { VERIFY_TONES, type VerifyTone } from './tones'

/**
 * 원형 상태 아이콘 — 두 변형.
 * ① tint(기본): 80px 틴트 원 + 보더 — Figma 3198:164(진입 로딩)·미인증.
 * ② solid-ring: 110px 유색 솔리드 원 > 80px surface 원 > 톤 아이콘 — Figma 541:2907(비공개)·537:2905(잘못된 링크).
 * 진입 로딩의 '...'은 디자인이 정적 텍스트라 그대로 둔다(스피너 전환은 회고 안건).
 */
export function VerifyStatusIcon({
  tone,
  variant = 'tint',
  children,
}: {
  tone: VerifyTone
  variant?: 'tint' | 'solid-ring'
  children: ReactNode
}) {
  const t = VERIFY_TONES[tone]
  if (variant === 'solid-ring') {
    return (
      <span
        className={`flex size-[110px] items-center justify-center rounded-full ${t.solid}`}
      >
        <span
          className={`bg-surface flex size-20 items-center justify-center rounded-full ${t.text}`}
        >
          {children}
        </span>
      </span>
    )
  }
  return (
    <span
      className={`flex size-20 items-center justify-center rounded-full border text-[34px] font-bold ${t.bg} ${t.border} ${t.text}`}
    >
      {children}
    </span>
  )
}
