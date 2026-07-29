import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { cn } from '@/shared/lib/cn'

// 이력서 항목 '기간' 입력 — 공통 DateTimePicker(month) 2개 + '현재' 토글.
// 저장은 기존 계약(period: string)을 유지한다 — 시작/종료를 점 표기로 직렬화.
//   범위:   '2017.03 ~ 2023.02'
//   진행중: '2024.03 ~ 현재'
//   단일점: '2023.06'        (자격증·수상 등 종료 없는 경우)
// month 모드 값은 'YYYY-MM' ↔ 저장 표기는 'YYYY.MM' 로 변환.

const ONGOING = '현재'

const toDot = (ym: string) => ym.replace('-', '.') // '2017-03' → '2017.03'
const fromDot = (s: string) => s.trim().replace('.', '-') // '2017.03' → '2017-03'

interface Parsed {
  start: string // 'YYYY-MM' | ''
  end: string // 'YYYY-MM' | ''
  ongoing: boolean
}

// period 문자열 → 구조값. 빈값·단일점·범위·진행중 모두 해석.
function parsePeriod(period: string): Parsed {
  const s = period.trim()
  if (!s) return { start: '', end: '', ongoing: false }
  const [rawStart = '', rawEnd = ''] = s.split('~').map((p) => p.trim())
  const start = rawStart ? fromDot(rawStart) : ''
  if (rawEnd === ONGOING || rawEnd === '재직중')
    return { start, end: '', ongoing: true }
  return { start, end: rawEnd ? fromDot(rawEnd) : '', ongoing: false }
}

// 구조값 → period 문자열(저장 표기). 모든 입력이 parsePeriod 로 라운드트립된다.
function buildPeriod({ start, end, ongoing }: Parsed): string {
  const s = start ? toDot(start) : ''
  if (ongoing) return s ? `${s} ~ ${ONGOING}` : `~ ${ONGOING}`
  if (s && end) return `${s} ~ ${toDot(end)}`
  return s
}

interface PeriodFieldProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

/** 기간 입력 — 시작 월 ~ 종료 월(또는 '현재'). 컨트롤드(상태 없음): value 만 신뢰원천. */
export function PeriodField({ value, onChange, className }: PeriodFieldProps) {
  const { start, end, ongoing } = parsePeriod(value)
  const emit = (next: Partial<Parsed>) =>
    onChange(buildPeriod({ start, end, ongoing, ...next }))

  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-2 gap-y-2', className)}
    >
      <div className="w-[132px]">
        <DateTimePicker
          mode="month"
          value={start}
          onChange={(v) => emit({ start: v })}
          placeholder="시작 월"
          ariaLabel="시작 월"
        />
      </div>
      <span className="text-fg-subtle text-[13px]">~</span>
      <div className="w-[132px]">
        <DateTimePicker
          mode="month"
          value={ongoing ? '' : end}
          onChange={(v) => emit({ end: v })}
          placeholder={ongoing ? ONGOING : '종료 월'}
          ariaLabel="종료 월"
          disabled={ongoing}
          min={start || undefined}
        />
      </div>
      <label className="text-fg-muted inline-flex cursor-pointer items-center gap-1.5 text-[13px] select-none">
        <input
          type="checkbox"
          checked={ongoing}
          onChange={(e) => emit({ ongoing: e.target.checked })}
          className="accent-brand size-4"
        />
        현재 (진행 중)
      </label>
    </div>
  )
}
