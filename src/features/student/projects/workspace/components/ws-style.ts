// 워크스페이스 공용 스타일 상수·메타 파서·날짜 헬퍼(비컴포넌트).
import type { Badge, Tone } from '../../types'
import type { ProjectPhase } from '../useProjectFlow'

export const TONES: Tone[] = [
  'brand',
  'info',
  'warning',
  'danger',
  'accent',
  'success',
]

export function toneOf(name: string): Tone {
  let h = 0
  for (let i = 0; i < name.length; i++)
    h = (h + name.charCodeAt(i)) % TONES.length
  return TONES[h]
}

export const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

export const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}

export const SOLID: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}

export const TEXT: Record<Tone, string> = {
  brand: 'text-brand',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent-strong',
  success: 'text-success',
}

export function parseMeetingMeta(meta: string): {
  date: string
  attendees?: number
} {
  const date = meta.split(' · ')[0] ?? meta
  const m = meta.match(/참석\s*(\d+)\s*명/)
  return { date, attendees: m ? Number(m[1]) : undefined }
}
// "PDF · 1.2MB" → 형식·부가정보 분해.

export function parseDocMeta(meta: string): { type: string; detail: string } {
  const [type, detail] = meta.split(' · ')
  return { type: type ?? meta, detail: detail ?? '' }
}

// 날짜 헬퍼(캘린더·회의록 등 공용).

export const WEEK = ['일', '월', '화', '수', '목', '금', '토']

export const pad2 = (n: number) => String(n).padStart(2, '0')

export const dateStr = (y: number, m: number, d: number) =>
  `${y}-${pad2(m + 1)}-${pad2(d)}`

export function formatKoreanDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return s
  const [y, mo, d] = [+m[1], +m[2], +m[3]]
  return `${y}년 ${mo}월 ${d}일 (${WEEK[new Date(y, mo - 1, d).getDay()]})`
}

// 인증 단계(phase) → 배지.

export function phaseCertBadge(phase: ProjectPhase): Badge {
  if (phase === 'certified') return { label: '인증 완료', tone: 'success' }
  if (phase === 'reviewing') return { label: '검토 중', tone: 'warning' }
  return { label: '검토 전', tone: 'info' }
}
