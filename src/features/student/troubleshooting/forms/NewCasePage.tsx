import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { TS_CATEGORIES } from '../types'

// 트러블슈팅 새 사례 작성 (/student/troubleshooting/new) — Figma 394:1500. 정적 폼(프리필 예시).
const card = 'border-border bg-surface rounded-2xl border p-6'
const input =
  'border-border bg-surface text-fg focus:border-brand w-full rounded-[10px] border px-4 py-3 text-[14px] focus:outline-none'

const STAR = [
  { key: 'situation', label: '상황 (Situation)', icon: '🧭', tone: 'info' },
  { key: 'resolution', label: '해결 (Resolution)', icon: '🛠', tone: 'accent' },
  { key: 'result', label: '결과 (Result)', icon: '✅', tone: 'success' },
] as const

export default function NewCasePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState(
    'Kafka 컨슈머 리밸런싱으로 메시지 중복 처리',
  )
  const [category, setCategory] = useState('DB')
  const [date, setDate] = useState('2026-04-22')
  const [days, setDays] = useState('3일')
  const [independent, setIndependent] = useState(true)
  const [star, setStar] = useState<Record<string, string>>({
    situation:
      '스케일아웃 시 컨슈머 리밸런싱이 발생하면서 동일 주문 이벤트가 두 번 처리되어 멱등성이 깨졌습니다.',
    resolution:
      '멱등성 보장키 + ack 처리 패턴을 재설계하고, 외부 키 기반 dedup 테이블을 적용했습니다.',
    result:
      '중복 처리 0건/주, 결제 실패율 8% → 0.4%. 같은 이벤트 그룹 중복도 제거.',
  })
  const tags = ['#Kafka', '#이벤트소싱', '#멱등성']
  const files = ['kafka-consumer-config.yml', 'dedup-table-schema.png']
  const filled = STAR.filter((s) => star[s.key]?.trim()).length

  return (
    <div className="flex flex-col gap-5 p-8 pb-28">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-[22px] font-bold">새 트러블슈팅 사례</h1>
        <p className="text-fg-muted text-[12px]">
          학습 과정에서 겪은 문제를 상황·해결·결과로 기록하고 팀별 인증을
          준비해요.
        </p>
      </div>

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
          <span className="text-fg font-semibold">새 사례 작성</span>
        </nav>
        <span className="text-fg-subtle text-[11px]">✎ 자동 저장 · 방금</span>
      </div>

      <div className="bg-brand flex flex-col gap-1 rounded-2xl p-6">
        <span className="text-[11px] font-bold tracking-wider text-white/70">
          TROUBLESHOOTING · 새 사례
        </span>
        <span className="text-[20px] font-bold text-white">
          상황·해결·결과를 기록하세요
        </span>
        <span className="text-[12px] text-white/80">
          상황·해결·결과 3개 항목을 채우면 사례를 작성할 수 있습니다. 발표
          연결과 인증 요청은 다음 단계에서 진행해요.
        </span>
      </div>

      <section className={cn(card, 'flex flex-col gap-4')}>
        <span className="text-fg text-[15px] font-bold">기본 정보</span>
        <div className="flex flex-col gap-2">
          <span className="text-fg text-[13px] font-bold">
            제목 <span className="text-danger">*</span>
          </span>
          <input
            className={input}
            value={title}
            maxLength={90}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-fg text-[13px] font-bold">
            카테고리 <span className="text-danger">*</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {TS_CATEGORIES.map((c) => {
              const on = c.key === category
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-[12px] font-semibold',
                    on
                      ? 'border-brand bg-brand text-white'
                      : 'border-border text-fg-muted hover:border-brand/50',
                  )}
                >
                  {on && '✓ '}
                  {c.key}
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[13px] font-bold">
              발생일 <span className="text-danger">*</span>
            </span>
            <input
              type="date"
              className={input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[13px] font-bold">소요 일수</span>
            <input
              className={input}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIndependent((v) => !v)}
          className="bg-surface-muted/50 flex items-center justify-between rounded-xl p-3.5"
        >
          <div className="flex flex-col text-left">
            <span className="text-fg text-[13px] font-bold">🚩 독립 해결</span>
            <span className="text-fg-subtle text-[11px]">
              동료 도움 없이 스스로 해결한 사례인지 표시
            </span>
          </div>
          <span
            className={cn(
              'flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
              independent ? 'bg-brand' : 'bg-border',
            )}
          >
            <span
              className={cn(
                'size-5 rounded-full bg-white transition-transform',
                independent && 'translate-x-5',
              )}
            />
          </span>
        </button>
      </section>

      {STAR.map((s) => (
        <section key={s.key} className={cn(card, 'flex flex-col gap-3')}>
          <div className="flex items-center justify-between">
            <span className="text-fg flex items-center gap-2 text-[14px] font-bold">
              <span>{s.icon}</span>
              {s.label}
            </span>
            {star[s.key]?.trim() && (
              <span className="bg-success-bg text-success rounded px-2 py-0.5 text-[11px] font-bold">
                작성됨
              </span>
            )}
          </div>
          <textarea
            className={cn(input, 'min-h-[120px] resize-none leading-6')}
            value={star[s.key]}
            maxLength={800}
            onChange={(e) =>
              setStar((p) => ({ ...p, [s.key]: e.target.value }))
            }
          />
          <div className="flex items-center justify-between">
            <span className="text-fg-subtle text-[11px]">Markdown 지원</span>
            <span className="text-fg-subtle text-[11px]">
              {star[s.key]?.length ?? 0} / 800
            </span>
          </div>
        </section>
      ))}

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">태그 · 첨부</span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="bg-brand/10 text-brand rounded-full px-2.5 py-1 text-[12px] font-semibold"
            >
              {t}
            </span>
          ))}
          <span className="border-border text-fg-subtle rounded-full border border-dashed px-2.5 py-1 text-[12px]">
            + 태그 추가
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map((f) => (
            <span
              key={f}
              className="border-border text-fg-muted flex items-center gap-2 rounded-[10px] border px-3 py-2.5 text-[12px]"
            >
              📄 {f}
            </span>
          ))}
          <span className="border-border text-fg-subtle flex items-center justify-center gap-1 rounded-[10px] border border-dashed px-3 py-2.5 text-[12px]">
            + 파일 추가
          </span>
        </div>
      </section>

      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <span className="text-[13px] font-bold">
          상황·해결·결과 {filled} / 3 작성 완료 · 태그 {tags.length}개 · 첨부{' '}
          {files.length}개
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/student/troubleshooting')}
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/troubleshooting')}
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold"
          >
            사례 저장 →
          </button>
        </div>
      </div>
    </div>
  )
}
