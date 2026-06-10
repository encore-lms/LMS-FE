import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { usePlayTyping } from '../api/play'

// PLAY 타자 게임 (/student/play/typing) — Figma 428:3015.
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

export default function PlayTypingPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = usePlayTyping()
  const [input, setInput] = useState('')
  usePageHeader(
    '타자 게임',
    '세션을 시작하고 제시문을 입력합니다. 결과는 서버 계산값으로 저장됩니다.',
  )

  if (isPending)
    return <div className="text-fg-muted p-8">세션을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="세션을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.stats.map((s) => (
          <div key={s.label} className={cn(card, 'flex flex-col gap-2')}>
            <span className="text-fg-muted text-[12px]">{s.label}</span>
            <span className="text-brand text-[24px] leading-none font-bold">
              {s.value}
            </span>
            <span className="text-fg-subtle text-[11px]">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-4')}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-fg text-[15px] font-bold">제시문</span>
              <span className="bg-brand/10 text-brand rounded px-2 py-0.5 text-[11px] font-bold">
                {data.level}
              </span>
            </div>
            <p className="bg-surface-muted/50 text-fg rounded-xl p-4 text-[14px] leading-7">
              {data.text}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[15px] font-bold">입력 영역</span>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="제시문을 보고 여기에 입력하세요..."
              className="border-border bg-surface text-fg focus:border-brand min-h-[120px] w-full resize-none rounded-xl border px-4 py-3 text-[14px] leading-6 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="border-border text-fg rounded-lg border px-4 py-2.5 text-[12px] font-semibold"
              >
                일시정지
              </button>
              <button
                type="button"
                onClick={() => navigate('/student/play')}
                className="border-border text-fg rounded-lg border px-4 py-2.5 text-[12px] font-semibold"
              >
                저장하지 않고 나가기
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/student/play/result')}
              className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold text-white"
            >
              결과 제출
            </button>
          </div>
        </section>

        <section className={cn(card, 'flex flex-col gap-3 lg:w-[300px]')}>
          <span className="text-fg text-[15px] font-bold">플레이 정보</span>
          {[
            { label: '세션 ID', value: data.sessionId },
            { label: '제시문', value: data.promptName },
            { label: '계산 기준', value: data.basis },
            { label: '보상', value: data.reward },
          ].map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between text-[12px]"
            >
              <span className="text-fg-subtle">{r.label}</span>
              <span className="text-fg font-semibold">{r.value}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => navigate('/student/play')}
            className="border-border text-fg mt-1 rounded-lg border py-2.5 text-[12px] font-semibold"
          >
            다른 게임 선택
          </button>
        </section>
      </div>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">다른 제시문</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {data.otherPrompts.map((p) => (
            <div
              key={p.title}
              className="border-border flex flex-col gap-2 rounded-[12px] border p-4"
            >
              <span className="text-fg text-[13px] font-bold">{p.title}</span>
              <span className="text-fg-subtle text-[11px]">{p.meta}</span>
              <div className="flex justify-end">
                <span className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold">
                  선택
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
