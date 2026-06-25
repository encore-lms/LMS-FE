import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import {
  Lock,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { OnlineChapterView } from '../types'

// 중앙 영상 플레이어 — 선택된 차시의 히어로(첫 화면 썸네일 커버 + 커스텀 컨트롤 영상).
// 재생 여부/차시 선택은 부모(OnlineCoursePage)가 소유한다(차시 목록 클릭으로도 전환).
//
// 수강 규칙:
//   · 미완료(completed=false): 시청한 지점(maxWatched)까지만 — 뒤로는 자유, 앞당기기 차단. 시크바에서 못 본 구간은 흐리게 처리.
//   · 완료(completed=true): 자유 탐색.
//   · 잠김(locked=true): 재생 불가(주차 미해제).
// 진행률 동기화: timeupdate 로 시청 위치를 부모에 보고(onProgress), 끝까지(≈95%)/종료 시 onCompleted.
const COMPLETE_THRESHOLD = 0.95 // 이 비율 이상 시청하면 수강 완료로 간주
const SKIP_TOLERANCE = 1 // 앞당기기 판정 허용 오차(초)
const RATES = [1, 1.25, 1.5, 2, 0.5] // 배속 순환
const STRIPE =
  'repeating-linear-gradient(45deg, rgba(255,255,255,0.45) 0 4px, transparent 4px 9px)'
const STATUS_LABEL: Record<OnlineChapterView['status'], string> = {
  done: '복습',
  learning: '학습 중',
  upcoming: '이어 학습',
}

// 초 → "mm:ss"
const fmt = (sec: number) => {
  const s = Math.max(0, Math.floor(sec || 0))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
// "mm:ss" → 초. 종료 시간은 브라우저의 video.duration(임시값으로 흔들림) 대신
// 정확히 아는 차시 길이(durationLabel)를 기준으로 삼는다.
const parseClock = (s: string) => {
  const parts = s.split(':').map(Number)
  if (parts.some(Number.isNaN)) return 0
  return parts.reduce((acc, n) => acc * 60 + n, 0)
}

export function OnlineVideoPlayer({
  chapter,
  courseName,
  playing,
  onPlay,
  initialWatchedSec,
  onProgress,
  onCompleted,
}: {
  chapter: OnlineChapterView
  courseName: string
  playing: boolean
  onPlay: () => void
  initialWatchedSec: number
  onProgress: (watchedSec: number, durationSec: number) => void
  onCompleted: () => void
}) {
  return (
    <section className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black shadow-[0px_8px_22px_0px_rgba(18,23,38,0.12)]">
      {chapter.locked ? (
        <LockedCover chapter={chapter} courseName={courseName} />
      ) : playing ? (
        <VideoStage
          chapter={chapter}
          initialWatchedSec={initialWatchedSec}
          onProgress={onProgress}
          onCompleted={onCompleted}
        />
      ) : (
        <PlayCover chapter={chapter} courseName={courseName} onPlay={onPlay} />
      )}
    </section>
  )
}

// 커스텀 컨트롤 영상 — 네이티브 controls 대신 직접 그린 컨트롤 바(재생/시크/시간/볼륨/배속/전체화면).
function VideoStage({
  chapter,
  initialWatchedSec,
  onProgress,
  onCompleted,
}: {
  chapter: OnlineChapterView
  initialWatchedSec: number
  onProgress: (watchedSec: number, durationSec: number) => void
  onCompleted: () => void
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const maxWatchedRef = useRef(initialWatchedSec) // 앞당기기 차단 기준선
  const completedFiredRef = useRef(false)
  const draggingRef = useRef(false)
  const hideTimer = useRef<number | null>(null)

  const durationSec = parseClock(chapter.durationLabel) // 종료 시간 기준(신뢰값)
  // 이전 시청 기록이 있으면(미완료 + 시청 지점 존재) 이어보기 팝업을 띄우고 자동재생은 보류.
  const needsResume = initialWatchedSec > 0 && !chapter.completed
  const [resumePrompt, setResumePrompt] = useState(needsResume)
  const [current, setCurrent] = useState(initialWatchedSec)
  const [paused, setPaused] = useState(needsResume)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [rate, setRate] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  // 전체화면 상태 동기화.
  useEffect(() => {
    const onFs = () =>
      setFullscreen(document.fullscreenElement === stageRef.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])
  // 언마운트 시 타이머 정리.
  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
  }, [])
  // 마운트 시 플레이어에 포커스 → 키보드 단축키가 바로 동작(페이지 스크롤은 막음).
  useEffect(() => {
    stageRef.current?.focus({ preventScroll: true })
  }, [])

  // 컨트롤 표시(이동/조작 시 깨우고, 재생 중이면 잠시 후 숨김).
  const poke = (autoHide = true) => {
    setShowControls(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    const v = videoRef.current
    if (autoHide && v && !v.paused) {
      hideTimer.current = window.setTimeout(() => setShowControls(false), 2500)
    }
  }

  // 특정 지점으로 이동 후 재생. 시킹은 메타데이터가 있어야 먹으므로 준비됐을 때(또는 loadedmetadata 후) 적용하고,
  // 재생은 항상 호출한다(일부 브라우저는 play() 시점에야 로드를 시작 → 교착 방지).
  const seekAndPlay = (sec: number) => {
    const v = videoRef.current
    if (!v) return
    const doSeek = () => {
      try {
        v.currentTime = sec
      } catch {
        // 시킹 실패는 무시
      }
      maxWatchedRef.current = Math.max(maxWatchedRef.current, sec)
      setCurrent(sec)
    }
    if (v.readyState >= 1 /* HAVE_METADATA */) doSeek()
    else v.addEventListener('loadedmetadata', doSeek, { once: true })
    void v.play()
  }
  // 이어보기 — 이전 시청 지점부터 재생.
  const resumeFromLast = () => {
    setResumePrompt(false)
    seekAndPlay(initialWatchedSec < durationSec ? initialWatchedSec : 0)
  }
  // 처음부터 — 0초부터 재생(이미 본 구간까지는 maxWatched 유지되어 자유 이동 가능).
  const startOver = () => {
    setResumePrompt(false)
    seekAndPlay(0)
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    setCurrent(v.currentTime)
    maxWatchedRef.current = Math.max(maxWatchedRef.current, v.currentTime)
    onProgress(maxWatchedRef.current, durationSec)
    if (
      !completedFiredRef.current &&
      durationSec > 0 &&
      maxWatchedRef.current / durationSec >= COMPLETE_THRESHOLD
    ) {
      completedFiredRef.current = true
      onCompleted()
    }
  }

  // 앞당기기 차단(키보드 등 우회 대비 백스톱). 시크바 자체도 클램프하지만 이중 안전장치.
  const handleSeeking = () => {
    const v = videoRef.current
    if (!v || chapter.completed) return
    if (v.currentTime > maxWatchedRef.current + SKIP_TOLERANCE) {
      v.currentTime = maxWatchedRef.current
    }
  }

  const handleEnded = () => {
    const v = videoRef.current
    if (v?.duration) onProgress(v.duration, v.duration)
    if (!completedFiredRef.current) {
      completedFiredRef.current = true
      onCompleted()
    }
    setPaused(true)
    setShowControls(true)
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play()
    else v.pause()
  }

  // 키보드 단축키 — 플레이어 포커스 시에만(페이지 다른 키 입력은 가로채지 않음).
  //   Space/K: 재생·정지 · ←/→: 5초 뒤로/앞으로(미완료는 앞당기기 차단) · ↑/↓: 볼륨.
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (resumePrompt) return // 이어보기 팝업 중에는 무시
    const t = e.target as HTMLElement
    if (
      t.tagName === 'INPUT' ||
      t.tagName === 'TEXTAREA' ||
      t.tagName === 'SELECT' ||
      t.isContentEditable
    ) {
      return // 볼륨 슬라이더 등 입력 요소는 기본 동작에 맡김
    }
    const v = videoRef.current
    if (!v) return
    const maxSeekable = chapter.completed ? durationSec : maxWatchedRef.current
    switch (e.key) {
      case ' ':
      case 'Spacebar':
      case 'k':
        e.preventDefault()
        if (v.paused) void v.play()
        else v.pause()
        break
      case 'ArrowRight': {
        e.preventDefault()
        const target = Math.min(v.currentTime + 5, maxSeekable)
        v.currentTime = target
        setCurrent(target)
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        const target = Math.max(0, v.currentTime - 5)
        v.currentTime = target
        setCurrent(target)
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const nv =
          Math.round(Math.min(1, (v.muted ? 0 : v.volume) + 0.1) * 100) / 100
        v.volume = nv
        v.muted = false
        setVolume(nv)
        setMuted(false)
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        const nv =
          Math.round(Math.max(0, (v.muted ? 0 : v.volume) - 0.1) * 100) / 100
        v.volume = nv
        v.muted = nv === 0
        setVolume(nv)
        setMuted(nv === 0)
        break
      }
      default:
        return
    }
    poke()
  }

  // 시크바 — 클릭 위치로 이동. 미완료면 시청 지점(maxWatched)을 넘지 못하게 클램프.
  const seekToClientX = (clientX: number) => {
    const el = trackRef.current
    const v = videoRef.current
    if (!el || !v || !durationSec) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const maxSeekable = chapter.completed ? durationSec : maxWatchedRef.current
    const target = Math.min(ratio * durationSec, maxSeekable)
    v.currentTime = target
    setCurrent(target)
  }
  const onTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    seekToClientX(e.clientX)
  }
  const onTrackPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) seekToClientX(e.clientX)
  }
  const onTrackPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }
  const onVolume = (e: ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    const val = Number(e.target.value)
    v.volume = val
    v.muted = val === 0
    setVolume(val)
    setMuted(val === 0)
  }
  const cycleRate = () => {
    const v = videoRef.current
    if (!v) return
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length]
    v.playbackRate = next
    setRate(next)
  }
  const toggleFullscreen = () => {
    const el = stageRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen?.()
  }

  const dur = durationSec || 1
  const playedPct = Math.min(100, (current / dur) * 100)
  const seekablePct = chapter.completed
    ? 100
    : Math.min(100, (maxWatchedRef.current / dur) * 100)

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative size-full bg-black outline-none"
      onPointerMove={() => poke()}
      onMouseLeave={() => {
        if (videoRef.current && !videoRef.current.paused) setShowControls(false)
      }}
    >
      <video
        ref={videoRef}
        src={encodeURI(chapter.videoUrl)}
        poster={encodeURI(chapter.posterUrl)}
        autoPlay={!needsResume}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onEnded={handleEnded}
        onPlay={() => {
          setPaused(false)
          poke()
        }}
        onPause={() => {
          setPaused(true)
          poke(false)
        }}
        className="absolute inset-0 size-full bg-black object-contain"
      >
        <track kind="captions" />
      </video>

      {/* 클릭 영역(컨트롤 바 위쪽) — 클릭 시 재생/일시정지, 일시정지 중엔 큰 재생 버튼 */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={paused ? '재생' : '일시정지'}
        className="absolute inset-x-0 top-0 bottom-16 flex items-center justify-center"
      >
        {paused && (
          <span className="text-brand flex size-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play className="size-7" fill="currentColor" />
          </span>
        )}
      </button>

      {/* 상단 그라데이션 + 차시 제목 */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-5 pt-4 pb-10 transition-opacity',
          showControls ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className="text-[12px] font-semibold text-white/90 drop-shadow">
          {chapter.no}차시 · {chapter.title}
        </span>
      </div>

      {/* 컨트롤 바 */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 pb-3 transition-opacity',
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {/* 시크바 */}
        <div
          ref={trackRef}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={onTrackPointerUp}
          className="group relative h-4 cursor-pointer touch-none"
        >
          {/* 트랙 */}
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
            {/* 미완료: 못 본 구간(시청 지점~끝) 흐리게 + 빗금 */}
            {!chapter.completed && (
              <div
                className="absolute inset-y-0 right-0 bg-black/45"
                style={{
                  left: `${seekablePct}%`,
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 4px, transparent 4px 8px)',
                }}
              />
            )}
            {/* 재생된 구간(초록 줄무늬) */}
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${playedPct}%`,
                backgroundColor: 'var(--color-success)',
                backgroundImage: STRIPE,
              }}
            />
          </div>
          {/* 핸들 */}
          <div
            className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-white shadow"
            style={{
              left: `${playedPct}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        {/* 버튼 행 */}
        <div className="flex items-center gap-3 text-white">
          <CtrlButton onClick={togglePlay} label={paused ? '재생' : '일시정지'}>
            {paused ? (
              <Play className="size-5" fill="currentColor" />
            ) : (
              <Pause className="size-5" fill="currentColor" />
            )}
          </CtrlButton>

          <span className="text-[12px] font-medium text-white/90 tabular-nums">
            {fmt(Math.min(current, durationSec))} / {fmt(durationSec)}
          </span>

          <div className="ml-auto flex items-center gap-3">
            {/* 볼륨 */}
            <div className="flex items-center gap-1.5">
              <CtrlButton onClick={toggleMute} label="음소거">
                {muted || volume === 0 ? (
                  <VolumeX className="size-5" />
                ) : (
                  <Volume2 className="size-5" />
                )}
              </CtrlButton>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={onVolume}
                aria-label="볼륨"
                className="h-1 w-16 cursor-pointer accent-white"
              />
            </div>
            {/* 배속 */}
            <button
              type="button"
              onClick={cycleRate}
              aria-label="재생 속도"
              className="rounded-md bg-white/15 px-2 py-1 text-[12px] font-bold tabular-nums hover:bg-white/25"
            >
              {rate}x
            </button>
            {/* 전체화면 */}
            <CtrlButton onClick={toggleFullscreen} label="전체화면">
              {fullscreen ? (
                <Minimize className="size-5" />
              ) : (
                <Maximize className="size-5" />
              )}
            </CtrlButton>
          </div>
        </div>
      </div>

      {/* 이어보기 팝업 — 이전 시청 기록이 있을 때 */}
      {resumePrompt && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="bg-surface flex w-full max-w-[320px] flex-col gap-4 rounded-2xl p-5 text-center shadow-[0px_12px_32px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col items-center gap-1.5">
              <span className="bg-brand/10 text-brand flex size-11 items-center justify-center rounded-full">
                <RotateCcw className="size-5" />
              </span>
              <span className="text-fg text-[15px] font-bold">
                이어서 볼까요?
              </span>
              <span className="text-fg-muted text-[13px]">
                이전에{' '}
                <b className="text-fg font-semibold">
                  {fmt(initialWatchedSec)}
                </b>
                까지 시청했어요.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startOver}
                className="border-border text-fg hover:bg-surface-muted flex-1 rounded-xl border py-2.5 text-[13px] font-bold transition-colors"
              >
                처음부터
              </button>
              <button
                type="button"
                onClick={resumeFromLast}
                className="bg-brand flex-1 rounded-xl py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
              >
                이어보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 컨트롤 아이콘 버튼.
function CtrlButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
    >
      {children}
    </button>
  )
}

// 재생 전 커버 — 영상 첫 화면 썸네일 + 차시 정보. 커버 전체가 클릭 영역(어디를 눌러도 재생).
function PlayCover({
  chapter,
  courseName,
  onPlay,
}: {
  chapter: OnlineChapterView
  courseName: string
  onPlay: () => void
}) {
  return (
    <>
      <img
        src={encodeURI(chapter.posterUrl)}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/30" />

      <span className="absolute top-4 left-4 rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
        {courseName}
      </span>

      {/* 차시 정보(좌하단) — 클릭은 위의 전체 버튼이 받도록 비대화 */}
      <div className="pointer-events-none absolute right-24 bottom-6 left-6 flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-white/85">
          {chapter.no}차시 · {STATUS_LABEL[chapter.status]}
        </span>
        <h2 className="text-[28px] leading-tight font-bold text-white drop-shadow-lg">
          {chapter.title}
        </h2>
        <span className="text-[12px] font-medium text-white/85">
          진도율 {Math.round(chapter.progressPct)}% · {chapter.watchedLabel} /{' '}
          {chapter.durationLabel}
        </span>
      </div>

      {/* 커버 전체 클릭 영역 — 어디를 눌러도 재생, ▶ 는 우하단 표시(호버 시 확대) */}
      <button
        type="button"
        onClick={onPlay}
        aria-label={`${chapter.title} 재생`}
        className="group absolute inset-0 flex items-end justify-end p-6"
      >
        <span className="text-brand flex size-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform group-hover:scale-105">
          <Play className="size-7" fill="currentColor" />
        </span>
      </button>
    </>
  )
}

// 잠김 커버 — 주차 미해제 차시. 재생 불가(첫 화면 노출 없이 브랜드 배경).
function LockedCover({
  chapter,
  courseName,
}: {
  chapter: OnlineChapterView
  courseName: string
}) {
  return (
    <>
      <div className="from-brand-deep to-brand absolute inset-0 bg-gradient-to-br opacity-90" />
      <div className="absolute inset-0 bg-black/35" />
      <span className="absolute top-4 left-4 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
        {courseName}
      </span>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-white/15 text-white">
          <Lock className="size-7" />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-[16px] font-bold text-white">
            {chapter.no}차시 · {chapter.title}
          </span>
          <span className="text-[12px] font-medium text-white/80">
            {chapter.no}주차에 열리는 강의예요
          </span>
        </div>
      </div>
    </>
  )
}
