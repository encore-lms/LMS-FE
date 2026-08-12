import type { BadgeTone } from '@/components/ui/StatusBadge'
import type { AmountSign, TxType } from './types'

// 원장 표기 — 지급 내역과 수강생 이력이 같은 말·같은 색을 쓰도록 한곳에 둔다.
export const TX_META: Record<TxType, { label: string; tone: BadgeTone }> = {
  grant: { label: '지급', tone: 'success' },
  deduct: { label: '차감', tone: 'neutral' },
  partial: { label: '부분', tone: 'warning' },
  failed: { label: '실패', tone: 'danger' },
}

export const AMOUNT_COLOR: Record<AmountSign, string> = {
  plus: 'text-success',
  minus: 'text-danger',
  zero: 'text-fg-subtle',
}
