import { cn } from '@/shared/lib/cn'
import type { MentoringLogStatus } from '../types'
import { LOG_STATUS_META } from './logMeta'

// 일지 상태 칩 — Figma 2553:4040/2582:6514 문법(rounded-5 · 아이콘 + Bold 11px).
// valid 라벨은 목록 '유효' / 상세 모달 '자동 유효'(제출 즉시 자동 유효 정책 강조) 변형 지원.
export function LogStateChip({
  status,
  note,
  validLabel = '유효',
}: {
  status: MentoringLogStatus
  note?: string
  validLabel?: string
}) {
  const meta = LOG_STATUS_META[status]
  const Icon = meta.icon
  const chip = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[11px] font-bold whitespace-nowrap',
        meta.chip,
      )}
    >
      <Icon className="h-[11px] w-[11px] shrink-0" />
      {status === 'valid' ? validLabel : meta.label}
    </span>
  )
  // 수정 요청 사유는 칩 안에 이어 붙이면(nowrap) 칩이 상태 컬럼(170px)을 밀어내
  // 표 전체가 가로 스크롤된다. 사유는 칩 아래 별도 줄에 말줄임으로 둔다.
  if (status !== 'change_requested' || !note) return chip
  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      {chip}
      <span
        className="text-fg-subtle max-w-[130px] truncate text-[10px] font-medium"
        title={note}
      >
        {note}
      </span>
    </span>
  )
}

/** 필수/선택 항목 배지 — danger 틴트 '필수' / surface-muted '선택'(Figma 공통 문법). */
export function RequiredChip({ required }: { required: boolean }) {
  return required ? (
    <span className="bg-danger-bg text-danger rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
      필수
    </span>
  ) : (
    <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap">
      선택
    </span>
  )
}

/** 글자수 카운터 — 'n / 한도'(한도 미지정 항목은 입력 길이만). */
export function CharCounter({
  length,
  limit,
  over = false,
}: {
  length: number
  limit: number | null
  over?: boolean
}) {
  return (
    <span
      className={cn(
        'text-[11px] whitespace-nowrap',
        over ? 'text-danger font-bold' : 'text-fg-subtle',
      )}
    >
      {length}
      {limit != null ? ` / ${limit}` : '자'}
    </span>
  )
}
