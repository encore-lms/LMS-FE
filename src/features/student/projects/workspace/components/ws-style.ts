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

// 평소엔 flat, 호버 시 소프트 그림자가 천천히 올라오고 pointer 커서(사용자 확정 인터랙션).
export const card =
  'bg-surface rounded-2xl p-5 cursor-pointer transition-shadow duration-300 hover:shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

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
