import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { usePlayTyping, useSubmitTypingResult } from '../api/play'
import { CharCompare } from './CharCompare'
import { PlayResultModal } from './PlayResultModal'
import { StatStrip } from './StatStrip'
import { pushPlay } from './history'
import { card, computeMetrics, fmtTime } from './shared'
import type { TypingResult } from './types'

// PLAY 타자 게임 (/student/play/typing) — Figma 428:3015 · 결과 4925:7266.
// 제시문을 그대로 입력 → 현재 타수·정확도·예상 점수 실시간 계산 → 결과 페이지로 제출.
type SessionStatus = 'running' | 'paused' | 'finished'

export default function PlayTypingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = usePlayTyping()
  const submitResult = useSubmitTypingResult()
  usePageHeader('타자 게임', '제시문을 정확하고 빠르게 입력해 점수를 겨룹니다.')

  // 현재 제시문 + 다른 제시문을 하나의 목록으로 다룬다.
  const prompts = useMemo(() => {
    if (!data) return []
    return [
      { title: data.promptName, level: data.level, text: data.text },
      ...data.otherPrompts.map((p) => ({
        title: p.title,
        level: p.meta,
        text: p.text,
      })),
    ]
  }, [data])

  const [selected, setSelected] = useState(0)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<SessionStatus>('running')
  // null = 아직 미초기화 — 0으로 시작하면 마운트 직후 "시간 종료"로 오인되므로 null로 둔다.
  const [remaining, setRemaining] = useState<number | null>(null)
  const [leaveTo, setLeaveTo] = useState<string | null>(null)
  // 종료 시 결과를 담아 결과 모달을 띄운다(서버 계산 결과 상태). null = 모달 닫힘.
  const [result, setResult] = useState<TypingResult | null>(null)
  const backspacesRef = useRef(0)
  const submittedRef = useRef(false)

  const active = prompts[selected]

  // 세션 로드 시 타이머 초기화(매 진입 시 전체 시간으로 fresh 시작).
  useEffect(() => {
    if (data) setRemaining(data.durationSec)
  }, [data])

  // 타이머 — 진행 중이고 나가기 모달이 닫혀 있을 때만 카운트다운(미초기화 null은 건너뜀).
  useEffect(() => {
    if (status !== 'running' || leaveTo) return
    const id = setInterval(() => {
      setRemaining((r) => (r === null ? r : r <= 1 ? 0 : r - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [status, leaveTo])

  // 시간 종료 → 종료 처리(아래 제출 effect가 결과로 보냄). null일 땐 발동하지 않는다.
  useEffect(() => {
    if (remaining === 0 && status === 'running' && data) {
      setStatus('finished')
      toast.warning('시간이 종료되어 결과를 제출합니다.')
    }
  }, [remaining, status, data, toast])

  const elapsedSec =
    data && remaining !== null ? data.durationSec - remaining : 0
  const m = useMemo(
    () => computeMetrics(input, active?.text ?? '', elapsedSec),
    [input, active, elapsedSec],
  )

  // 제시문을 끝까지 정확히 입력하면 자동 종료(완주).
  useEffect(() => {
    if (status === 'running' && active && input === active.text) {
      setStatus('finished')
      toast.success('완주했어요! 결과를 제출합니다.')
    }
  }, [input, active, status, toast])

  // 종료되면 결과를 1회 계산해 서버에 제출하고 결과 모달을 띄운다.
  // best 판정은 서버 응답이 정본 — 제출 실패 시에만 클라 판정으로 폴백(기록은 남지 않음).
  useEffect(() => {
    if (status !== 'finished' || submittedRef.current || !data || !active)
      return
    submittedRef.current = true
    const payload: TypingResult = {
      sessionId: data.sessionId,
      promptName: active.title,
      durationSec: data.durationSec,
      elapsedSec,
      correctChars: m.correct,
      cpm: m.cpm,
      wpm: m.wpm,
      accuracy: Math.round(m.accuracy * 10) / 10,
      typos: m.typos,
      backspaces: backspacesRef.current,
      comboBonus: m.comboBonus,
      score: m.score,
      best: m.score >= data.personalBest,
    }
    pushPlay('typing', {
      detail: `${payload.cpm}타 · ${payload.accuracy.toFixed(1)}% · ${payload.score.toLocaleString()}`,
      score: payload.score,
    })
    submitResult.mutate(
      {
        promptName: payload.promptName,
        durationSec: payload.durationSec,
        elapsedSec: payload.elapsedSec,
        cpm: payload.cpm,
        wpm: payload.wpm,
        accuracy: payload.accuracy,
        typos: payload.typos,
        backspaces: payload.backspaces,
        comboBonus: payload.comboBonus,
        score: payload.score,
      },
      {
        onSuccess: (receipt) => setResult({ ...payload, best: receipt.best }),
        onError: () => {
          toast.danger('기록 저장에 실패했어요 — 이번 결과는 랭킹에 반영되지 않아요.')
          setResult(payload)
        },
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, data, active, elapsedSec, m])

  const others = prompts
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.i !== selected)

  const selectPrompt = (i: number) => {
    setSelected(i)
    setInput('')
    setRemaining(data?.durationSec ?? 0)
    setStatus('running')
    backspacesRef.current = 0
    submittedRef.current = false
    toast.info(`제시문을 "${prompts[i].title}"(으)로 변경했어요.`)
  }

  // 결과 모달의 "다시 플레이" — 현재 제시문 그대로 새 세션 시작.
  const restart = () => {
    setResult(null)
    setInput('')
    setRemaining(data?.durationSec ?? 0)
    setStatus('running')
    backspacesRef.current = 0
    submittedRef.current = false
  }

  const togglePause = () => {
    if (status === 'finished') return
    setStatus((s) => (s === 'paused' ? 'running' : 'paused'))
  }

  const stats = [
    {
      label: '남은 시간',
      value: fmtTime(remaining ?? data?.durationSec ?? 0),
      sub:
        status === 'paused'
          ? '일시정지됨'
          : status === 'finished'
            ? '세션 종료'
            : '세션 진행 중',
    },
    { label: '현재 타수', value: `${m.cpm}타`, sub: '실시간 입력 기준' },
    {
      label: '정확도',
      value: `${m.accuracy.toFixed(1)}%`,
      sub: `오타 ${m.typos}회`,
    },
    {
      label: '예상 점수',
      value: m.score.toLocaleString(),
      sub: '제출 시 서버 재계산',
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data || !active}
      onRetry={refetch}
      loadingText="세션을 불러오는 중…"
      errorTitle="세션을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && active && (
        <div className="flex flex-col gap-5 p-8">
          <StatStrip stats={stats} />

          <div className="flex flex-col gap-4 lg:flex-row">
            <section className={cn(card, 'flex flex-1 flex-col gap-4')}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-fg text-[15px] font-bold">제시문</span>
                  <span className="bg-brand/10 text-brand rounded px-2 py-0.5 text-[11px] font-bold">
                    {active.level}
                  </span>
                </div>
                <CharCompare target={active.text} input={input} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-fg text-[15px] font-bold">
                    입력 영역
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-bold',
                      m.typos > 0
                        ? 'bg-danger-bg text-danger'
                        : input.length > 0
                          ? 'bg-success-bg text-success'
                          : 'bg-surface-muted text-fg-subtle',
                    )}
                  >
                    {m.typos > 0
                      ? `오타 ${m.typos}자`
                      : input.length > 0
                        ? '정확하게 입력 중'
                        : '입력을 시작하세요'}
                  </span>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' || e.key === 'Delete')
                      backspacesRef.current += 1
                  }}
                  disabled={status !== 'running'}
                  placeholder={
                    status === 'paused'
                      ? '일시정지 상태입니다. 이어하기를 누르면 입력할 수 있어요.'
                      : status === 'finished'
                        ? '세션이 종료되었습니다.'
                        : '제시문을 보고 여기에 입력하세요. 글자가 맞으면 초록, 틀리면 빨강으로 표시됩니다.'
                  }
                  className={cn(
                    'bg-surface text-fg min-h-[120px] w-full resize-none rounded-xl border px-4 py-3 text-[14px] leading-6 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
                    m.typos > 0
                      ? 'border-danger focus:border-danger'
                      : input.length > 0
                        ? 'border-success focus:border-success'
                        : 'border-border focus:border-brand',
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePause}
                    disabled={status === 'finished'}
                    className="border-border text-fg rounded-lg border px-4 py-2.5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === 'paused' ? '이어하기' : '일시정지'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaveTo('/student/play')}
                    className="border-border text-fg rounded-lg border px-4 py-2.5 text-[12px] font-semibold"
                  >
                    저장하지 않고 나가기
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus('finished')}
                  disabled={status === 'finished' || input.length === 0}
                  className={buttonClass({ size: 'md' })}
                >
                  결과 제출
                </button>
              </div>
            </section>

            <section className={cn(card, 'flex flex-col gap-3 lg:w-[300px]')}>
              <span className="text-fg text-[15px] font-bold">플레이 정보</span>
              {[
                { label: '세션 ID', value: data.sessionId },
                { label: '제시문', value: active.title },
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
                onClick={() => setLeaveTo('/student/play')}
                className="border-border text-fg mt-1 rounded-lg border py-2.5 text-[12px] font-semibold"
              >
                다른 게임 선택
              </button>
            </section>
          </div>

          <section className={cn(card, 'flex flex-col gap-3')}>
            <span className="text-fg text-[15px] font-bold">다른 제시문</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {others.map((p) => (
                <div
                  key={p.title}
                  className="border-border flex flex-col gap-2 rounded-[12px] border p-4"
                >
                  <span className="text-fg text-[13px] font-bold">
                    {p.title}
                  </span>
                  <span className="text-fg-subtle text-[11px]">{p.level}</span>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => selectPrompt(p.i)}
                      className="border-border text-fg hover:border-brand hover:text-brand rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors"
                    >
                      선택
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Modal
            open={leaveTo !== null}
            onClose={() => setLeaveTo(null)}
            title="게임을 나갈까요?"
            size="sm"
            footer={
              <>
                <Button variant="secondary" onClick={() => setLeaveTo(null)}>
                  계속하기
                </Button>
                <Button
                  onClick={() => {
                    const to = leaveTo
                    setLeaveTo(null)
                    if (to) navigate(to)
                  }}
                >
                  나가기
                </Button>
              </>
            }
          >
            지금 나가면 현재 입력과 진행 시간은 저장되지 않습니다.
          </Modal>

          <PlayResultModal
            open={result !== null}
            onClose={() => setResult(null)}
            metrics={
              result
                ? [
                    { label: 'WPM', value: String(result.wpm) },
                    { label: 'CPM', value: String(result.cpm) },
                    {
                      label: '정확도',
                      value: `${result.accuracy.toFixed(1)}%`,
                    },
                    { label: 'Score', value: result.score.toLocaleString() },
                  ]
                : []
            }
            onReplay={restart}
            detailTo="/student/play/typing/result"
            detailState={result ? { result } : undefined}
          />
        </div>
      )}
    </DataBoundary>
  )
}
