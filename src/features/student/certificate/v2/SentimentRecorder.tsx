import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { useAnalyzeSentiment } from '../../api/certificate'
import type { CertSentiment } from '../types'
import { AiAnalysisPanel } from './AiAnalysisPanel'
import { SentimentBubblesView } from './SentimentBubbles'

// 증명서 v2 — AI 상담 감성 분석 레코더.
// 페이지에서 직접 녹음 → 자동 저장(목) → 자동 분석(목) → 키워드 버블 + 확인 게이트.
// 실제 STT/LLM은 BE 연동 후. 지금은 useAnalyzeSentiment가 MSW 목을 호출한다.
type Status = 'idle' | 'recording' | 'processing' | 'done' | 'error'

function fmt(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function SentimentRecorder({
  initial,
  className,
}: {
  initial?: CertSentiment
  className?: string
}) {
  const analyze = useAnalyzeSentiment()
  const [status, setStatus] = useState<Status>('idle')
  const [consent, setConsent] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [result, setResult] = useState<CertSentiment | null>(null)
  const [removed, setRemoved] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const secRef = useRef(0)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const startRecording = async () => {
    setErrorMsg('')
    setSaved(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || 'audio/webm',
        })
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return URL.createObjectURL(blob)
        })
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        // 자동 저장 + 자동 분석 (목). 실제론 blob을 FormData로 업로드.
        setStatus('processing')
        analyze.mutate(
          { durationSec: secRef.current },
          {
            onSuccess: (data) => {
              setResult(data)
              setRemoved([])
              setStatus('done')
            },
            onError: () => {
              setErrorMsg('분석에 실패했어요. 잠시 후 다시 시도해 주세요.')
              setStatus('error')
            },
          },
        )
      }
      recorderRef.current = rec
      secRef.current = 0
      setSeconds(0)
      setResult(null)
      rec.start()
      setStatus('recording')
      timerRef.current = setInterval(() => {
        secRef.current += 1
        setSeconds(secRef.current)
      }, 1000)
    } catch {
      setErrorMsg(
        '마이크를 사용할 수 없어요. 브라우저 마이크 권한을 허용했는지 확인해 주세요.',
      )
      setStatus('error')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    recorderRef.current?.stop()
  }

  const reset = () => {
    setStatus('idle')
    setResult(null)
    setRemoved([])
    setSeconds(0)
    setSaved(false)
    setErrorMsg('')
  }

  const shown = result ?? initial ?? null
  const visible: CertSentiment | null = shown
    ? {
        ...shown,
        bubbles: shown.bubbles.filter((b) => !removed.includes(b.label)),
      }
    : null

  return (
    <AiAnalysisPanel title="AI 상담 감성·키워드 버블" className={className}>
      {/* 컨트롤 영역 — 상태별 */}
      <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4">
        {status === 'idle' && (
          <div className="flex flex-col gap-3">
            <p className="text-fg-muted text-[12px] leading-5">
              매니저와의 상담을 녹음하면 음성을 텍스트로 변환해 감성·키워드를
              자동 추출합니다. 녹음·분석 전 상담 양측의 사전 동의가 필요합니다.
            </p>
            <label className="text-fg-muted flex cursor-pointer items-start gap-2 text-[12px]">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="accent-brand mt-0.5 size-4"
              />
              <span>
                상담 내용의 녹음·분석에 동의합니다.{' '}
                <span className="text-fg-subtle">
                  (녹음은 본인 확인용이며, 키워드만 증명서에 반영)
                </span>
              </span>
            </label>
            <button
              type="button"
              disabled={!consent}
              onClick={startRecording}
              className="bg-brand w-fit rounded-lg px-4 py-2.5 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              ● 상담 녹음 시작
            </button>
          </div>
        )}

        {status === 'recording' && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="bg-danger size-2.5 animate-pulse rounded-full" />
              <span className="text-fg text-[15px] font-bold tabular-nums">
                {fmt(seconds)}
              </span>
              <span className="text-fg-subtle text-[12px]">
                녹음 중 · 끝나면 정지를 누르면 자동으로 분석돼요
              </span>
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
            >
              ■ 정지
            </button>
          </div>
        )}

        {status === 'processing' && (
          <div className="flex items-center gap-3 py-1">
            <span className="border-brand size-4 animate-spin rounded-full border-2 border-t-transparent" />
            <div className="flex flex-col">
              <span className="text-fg text-[13px] font-semibold">
                녹음 저장 후 분석 중이에요…
              </span>
              <span className="text-fg-subtle text-[11px]">
                음성 → 텍스트 변환 → 키워드·감성 추출 ({fmt(seconds)} 녹음)
              </span>
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-success text-[13px] font-bold">
                ✓ 분석 완료 · 키워드 {visible?.bubbles.length ?? 0}개 추출
              </span>
              <button
                type="button"
                onClick={reset}
                className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
              >
                다시 녹음
              </button>
            </div>
            {audioUrl && (
              <audio src={audioUrl} controls className="h-9 w-full" />
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-danger text-[12px]">{errorMsg}</span>
            <button
              type="button"
              onClick={reset}
              className="border-border text-fg rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>

      {/* 버블 시각화 */}
      {visible && visible.bubbles.length > 0 ? (
        <SentimentBubblesView sentiment={visible} />
      ) : (
        status === 'idle' &&
        !initial && (
          <div className="text-fg-subtle flex h-[160px] items-center justify-center text-[12px]">
            아직 분석된 상담이 없어요. 녹음을 시작해 보세요.
          </div>
        )
      )}

      {/* 결과 확인 게이트 — 분석 직후에만(자동 추출 결과 큐레이션) */}
      {status === 'done' && result && (
        <div className="flex flex-col gap-2">
          <span className="text-fg-subtle text-[11px]">
            추출된 키워드가 맞지 않으면 ✕로 제거한 뒤 저장하세요. 저장한
            키워드만 증명서에 반영됩니다.
          </span>
          <div className="flex flex-wrap gap-1.5">
            {result.bubbles.map((b) => {
              const off = removed.includes(b.label)
              return (
                <button
                  key={b.label}
                  type="button"
                  onClick={() =>
                    setRemoved((prev) =>
                      off
                        ? prev.filter((x) => x !== b.label)
                        : [...prev, b.label],
                    )
                  }
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                    off
                      ? 'border-border text-fg-subtle line-through opacity-50'
                      : 'border-brand/40 text-brand',
                  )}
                >
                  {b.label} {off ? '＋' : '✕'}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSaved(true)}
              className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white"
            >
              키워드 저장
            </button>
            {saved && (
              <span className="text-success text-[12px] font-semibold">
                ✓ 저장됐어요
              </span>
            )}
          </div>
        </div>
      )}
    </AiAnalysisPanel>
  )
}
