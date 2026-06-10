import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { TS_CHANGE_ITEMS } from '../types'

// 트러블슈팅 변경 제안 (/student/troubleshooting/:id/change-requests/new) — Figma 362:1348. 정적 폼.
const card = 'border-border bg-surface rounded-2xl border p-6'
// 처리 흐름 단계 톤(Figma 2533:5239) — 아이콘박스 tint + "STEP N" 배지 색.
type StepTone = 'warning' | 'success' | 'danger'
const STEP_BG: Record<StepTone, string> = {
  warning: 'bg-warning-bg',
  success: 'bg-success-bg',
  danger: 'bg-danger-bg',
}
const STEP_TEXT: Record<StepTone, string> = {
  warning: 'text-warning',
  success: 'text-success',
  danger: 'text-danger',
}
const DIFF: Record<
  string,
  { label: string; before: string; after: string; delta: string }
> = {
  해결: {
    label: '해결 (Resolution)',
    before: "'enable.auto.commit=false' 전환, 외부 키 기반 dedup 테이블 적용.",
    after:
      "'enable.auto.commit=false' 전환, 멱등성 키(idempotency-key) 기반 dedup 테이블 + ack 재처리 패턴으로 재설계.",
    delta: '변경됨 (+70)',
  },
  결과: {
    label: '결과 (Result)',
    before: '중복 처리 0건/주, 결제 실패율 8% → 0.4%.',
    after:
      '중복 처리 0건/주 누적, 결제 실패율 8% → 0.4%, 처리 lag 평균 1.2s → 240ms (P95).',
    delta: '변경됨 (+58)',
  },
}
const STEPS: {
  no: string
  icon: LucideIcon
  title: string
  sub: string
  tone: StepTone
}[] = [
  {
    no: 'STEP 1',
    icon: Timer,
    title: '강사 검토 큐',
    sub: 'D+1 영업일 내 검토',
    tone: 'warning',
  },
  {
    no: 'STEP 2',
    icon: CheckCircle2,
    title: '승인 → 원본 반영',
    sub: '변경 사항 자동 갱신',
    tone: 'success',
  },
  {
    no: 'STEP 3',
    icon: AlertTriangle,
    title: '반려 → 사유 회신',
    sub: '코멘트와 함께 회신',
    tone: 'danger',
  },
]

export default function ChangeRequestPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>(['해결', '결과'])
  const [reason, setReason] = useState(
    'dedup 키 ID 컬럼명을 멱등성 키로 명확화하고, 결과에 처리 lag 지표를 추가하기 위함입니다. 인증 발표에서 변경 근거로 쓸 수 있게 보강합니다.',
  )
  const toggle = (v: string) =>
    setSelected((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))
  usePageHeader(
    '트러블슈팅 변경 제안',
    '인증 완료된 트러블슈팅 사례의 수정·삭제를 강사에게 제안합니다.',
  )

  return (
    <div className="flex flex-col gap-5 p-8 pb-28">
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-[12px]">
          <button
            type="button"
            onClick={() => navigate('/student/troubleshooting')}
            className="text-fg-muted hover:text-fg"
          >
            ← 트러블슈팅 목록
          </button>
          <span className="text-fg-subtle">/</span>
          <span className="text-fg-muted">Kafka 컨슈머 리밸런싱…</span>
          <span className="text-fg-subtle">/</span>
          <span className="text-fg font-semibold">변경 제안</span>
        </nav>
        <span className="text-fg-subtle text-[11px]">인증 완료 · 미수정</span>
      </div>

      <div className="border-warning/50 bg-warning-bg/50 flex flex-col gap-1 rounded-xl border p-4">
        <span className="text-warning text-[12px] font-bold">
          ⚠ 인증 완료된 사례는 변경 제안으로만 수정 가능합니다
        </span>
        <span className="text-fg-muted text-[11px]">
          certified → 변경 제안. 변경 항목을 선택하면 강사 검토 큐로 전달되고,
          승인 시 원본에 반영됩니다. 반려 시 사유 코멘트가 전달됩니다.
        </span>
      </div>

      <section className={cn(card, 'flex flex-col gap-2')}>
        <div className="flex items-center gap-2">
          <span className="text-fg text-[15px] font-bold">
            Kafka 컨슈머 리밸런싱으로 메시지 중복 처리
          </span>
          <span className="bg-success-bg text-success rounded px-1.5 py-0.5 text-[10px] font-bold">
            인증 완료
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">
          DB · 독립 해결 · 대표 연결 · 작성 2026-04-22 · 인증 2026-05-10
        </span>
      </section>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center justify-between">
          <span className="text-fg text-[15px] font-bold">변경 항목 선택</span>
          <span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-[12px] font-bold">
            선택 {selected.length} / {TS_CHANGE_ITEMS.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TS_CHANGE_ITEMS.map((it) => {
            const on = selected.includes(it)
            return (
              <button
                key={it}
                type="button"
                onClick={() => toggle(it)}
                className={cn(
                  'rounded-lg border px-3.5 py-2 text-[12px] font-semibold',
                  on
                    ? 'border-brand bg-brand text-white'
                    : 'border-border text-fg-muted hover:border-brand/50',
                )}
              >
                {it}
              </button>
            )
          })}
        </div>
      </section>

      <section className={cn(card, 'flex flex-col gap-2')}>
        <div className="flex items-center gap-1.5">
          <span className="text-fg text-[15px] font-bold">변경 사유</span>
          <span className="text-danger text-[11px]">필수</span>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border-border bg-surface text-fg focus:border-brand min-h-[96px] w-full resize-none rounded-[10px] border px-4 py-3 text-[14px] leading-6 focus:outline-none"
        />
      </section>

      <section className={cn(card, 'flex flex-col gap-4')}>
        <span className="text-fg text-[15px] font-bold">변경 전 / 후 비교</span>
        {selected.length === 0 && (
          <span className="text-fg-subtle text-[12px]">
            변경 항목을 선택하면 전/후 비교가 표시됩니다.
          </span>
        )}
        {selected.map((it) => {
          const diff = DIFF[it]
          return (
            <div key={it} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-success-bg text-success rounded px-2 py-0.5 text-[11px] font-bold">
                  {diff?.label ?? it}
                </span>
                {diff && (
                  <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-bold">
                    {diff.delta}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="border-border bg-surface-muted/40 flex flex-col gap-1 rounded-[10px] border p-3.5">
                  <span className="text-fg-subtle text-[11px]">변경 전</span>
                  <span className="text-fg-muted text-[12px] leading-5">
                    {diff?.before ?? '기존 값'}
                  </span>
                </div>
                <div className="border-brand/40 bg-brand/5 flex flex-col gap-1 rounded-[10px] border p-3.5">
                  <span className="text-brand text-[11px] font-semibold">
                    변경 후
                  </span>
                  <span className="text-fg text-[12px] leading-5">
                    {diff?.after ?? '새 값을 입력하세요'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">
          근거 자료{' '}
          <span className="text-fg-subtle text-[11px] font-normal">(선택)</span>
        </span>
        <span className="border-border text-fg-muted flex items-center gap-2 rounded-[10px] border px-3 py-2.5 text-[12px]">
          📄 retro-2026-05-20.md
        </span>
        <span className="border-border text-fg-subtle rounded-[10px] border px-3 py-2.5 text-[12px]">
          🔗 https://blog.example.com/kafka-idempotency-key
        </span>
      </section>

      <section className={cn(card, 'flex flex-col gap-3.5')}>
        <div className="flex items-center gap-2">
          <Info className="text-info size-4 shrink-0" />
          <span className="text-fg text-[14px] font-bold">
            제출 후 처리 흐름
          </span>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {STEPS.map((s, i) => (
            <Fragment key={s.no}>
              <div className="flex flex-1 items-center gap-3">
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-[12px]',
                    STEP_BG[s.tone],
                  )}
                >
                  <s.icon className={cn('size-[22px]', STEP_TEXT[s.tone])} />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold tracking-[0.8px]',
                        STEP_BG[s.tone],
                        STEP_TEXT[s.tone],
                      )}
                    >
                      {s.no}
                    </span>
                    <span className="text-fg text-[13px] font-bold whitespace-nowrap">
                      {s.title}
                    </span>
                  </div>
                  <span className="text-fg-muted text-[11px]">{s.sub}</span>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="text-fg-subtle hidden size-3.5 shrink-0 sm:block" />
              )}
            </Fragment>
          ))}
        </div>
      </section>

      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <span className="text-[13px] font-bold">
          변경 항목 {selected.length} / {TS_CHANGE_ITEMS.length} 선택 · 변경
          사유 {reason.length}자 작성 완료
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold"
          >
            변경 제안 저장 →
          </button>
        </div>
      </div>
    </div>
  )
}
