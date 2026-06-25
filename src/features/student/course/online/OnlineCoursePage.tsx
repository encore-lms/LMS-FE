import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useOnlineCourse } from '../../api/course'
import { OnlineCourseInfoCard } from './components/OnlineCourseInfoCard'
import { OnlineVideoPlayer } from './components/OnlineVideoPlayer'
import { OnlineChapterProgress } from './components/OnlineChapterProgress'
import { OnlineCompletionPanel } from './components/OnlineCompletionPanel'
import { OnlineNoticePanel } from './components/OnlineNoticePanel'
import { useOnlineWeekStore } from './store'
import type {
  OnlineChapter,
  OnlineChapterView,
  OnlineCompletion,
} from './types'

// "mm:ss" → 초. 잘못된 값은 0.
const parseClock = (s: string) => {
  const parts = s.split(':').map(Number)
  if (parts.some(Number.isNaN)) return 0
  return parts.reduce((acc, n) => acc * 60 + n, 0)
}
// 초 → "mm:ss".
const formatClock = (sec: number) => {
  const s = Math.max(0, Math.round(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
// 초 → "H시간 MM분" | "MM분".
const formatDurationKo = (sec: number) => {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  return h > 0 ? `${h}시간 ${String(m).padStart(2, '0')}분` : `${m}분`
}

/** 차시별 런타임 시청 상태 — 실제 재생으로 갱신(목 데이터 위에 덮어쓴다). */
interface ChapterRuntime {
  watchedSec: number // 지금까지 시청한 최대 지점(초)
  completed: boolean // 끝까지(≈95%) 시청해 수강 완료
}

// 시청 진행률을 localStorage 에 보관 — 새로고침/재방문해도 "이전 기록"이 남아 이어보기 가능.
// (FE 목: 단일 과정 기준 단일 키. BE 연동 시 서버 진도로 대체.)
const PROGRESS_KEY = 'lms:online-progress'
function loadProgress(): Record<string, ChapterRuntime> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (raw) return JSON.parse(raw) as Record<string, ChapterRuntime>
  } catch {
    // 파싱 실패는 무시하고 빈 기록으로
  }
  return {}
}

/**
 * 온라인 교육 (KDC: K-디지털 기초역량훈련) — /student/course 진입 시 교육 타입이 KDC인 수강생에게 노출.
 * 자기주도 온라인 학습 대시보드(3단). 좌: 과정/차시 · 중: 플레이어/진도 · 우: 수료/공지.
 *
 * 수강 규칙(요구사항):
 *   1) 미완료 강의는 시청 지점까지만 — 뒤로는 가능, 앞당기기 차단(플레이어 seeking 클램프).
 *   2) 완료 강의는 앞뒤 자유 탐색.
 *   3) 주차별 1강 해제 — currentWeek 보다 뒤(no > week) 차시는 잠금(테스트는 OnlineWeekTestNav FAB).
 *   4) 실제 재생 진행률을 실시간 동기화 — 진도카드·수료현황·완료(✓) 가 시청에 따라 갱신.
 */
export function OnlineCoursePage() {
  usePageHeader('온라인 교육')
  const toast = useToast()
  const { data, isPending, isError, refetch } = useOnlineCourse()
  // 선택 차시(미선택이면 현재 학습 중 차시로 폴백) + 재생 여부 + 차시별 시청 런타임.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [runtime, setRuntime] =
    useState<Record<string, ChapterRuntime>>(loadProgress)
  // 현재 주차(테스트 오버라이드 우선) — Hooks 규칙상 early return 이전에 호출.
  const weekOverride = useOnlineWeekStore((s) => s.week)

  // 진행률을 localStorage 에 저장(이전 기록 보존).
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(runtime))
    } catch {
      // 저장 실패는 무시
    }
  }, [runtime])

  if (isPending) {
    return <div className="text-fg-muted p-8">온라인 교육을 불러오는 중…</div>
  }
  if (isError) {
    return (
      <div className="p-8">
        <Empty
          title="온라인 교육을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const currentWeek = weekOverride ?? data.currentWeek

  // 차시별 파생값 — 런타임(있으면) 위에 목 기본값을 합쳐 완료/시청/진도/잠금을 계산.
  const rawWatchedFor = (ch: OnlineChapter) =>
    runtime[ch.id]?.watchedSec ?? parseClock(ch.watchedLabel)
  const completedFor = (ch: OnlineChapter) =>
    (runtime[ch.id]?.completed ?? false) ||
    ch.status === 'done' ||
    ch.progressPct >= 100

  const views: OnlineChapterView[] = data.chapters.map((ch) => {
    const durationSec = parseClock(ch.durationLabel)
    const completed = completedFor(ch)
    const watchedSec = Math.min(rawWatchedFor(ch), durationSec || Infinity)
    const progressPct = completed
      ? 100
      : durationSec
        ? Math.min(100, Math.round((watchedSec / durationSec) * 10000) / 100)
        : ch.progressPct
    return {
      ...ch,
      completed,
      locked: ch.no > currentWeek,
      progressPct,
      watchedLabel: completed ? ch.durationLabel : formatClock(watchedSec),
    }
  })

  // 진입 시(미선택)에는 항상 첫 차시(views[0]). 이후엔 사용자가 고른 차시.
  const selected = views.find((v) => v.id === selectedId) ?? views[0]
  const selectedOriginal =
    data.chapters.find((c) => c.id === selected.id) ?? data.chapters[0]
  // 이어보기 위치 — 완료 강의는 처음부터(자유 탐색), 미완료는 시청 지점부터.
  const initialWatchedSec = selected.completed
    ? 0
    : (runtime[selected.id]?.watchedSec ??
      parseClock(selectedOriginal.watchedLabel))

  // 차시 선택 = 플레이어 전환 + 즉시 재생(사용자 클릭이라 autoplay 허용). 잠긴 차시는 차단.
  const selectChapter = (id: string) => {
    const ch = views.find((v) => v.id === id)
    if (!ch) return
    if (ch.locked) {
      toast.info(`${ch.no}차시는 ${ch.no}주차에 열려요`)
      return
    }
    setSelectedId(id)
    setPlaying(true)
  }

  // 실제 재생 진행률 보고 — 최대 시청 지점만 누적(되돌아가도 줄지 않음).
  const handleProgress = (chapterId: string) => (watchedSec: number) => {
    const w = Math.floor(watchedSec)
    setRuntime((prev) => {
      const cur = prev[chapterId]
      const prevW = cur?.watchedSec ?? 0
      if (cur && w <= prevW) return prev
      return {
        ...prev,
        [chapterId]: {
          watchedSec: Math.max(prevW, w),
          completed: cur?.completed ?? false,
        },
      }
    })
  }
  const handleCompleted = (chapterId: string) => () => {
    setRuntime((prev) => ({
      ...prev,
      [chapterId]: {
        watchedSec: prev[chapterId]?.watchedSec ?? 0,
        completed: true,
      },
    }))
  }

  // 수료 현황 — 실제 시청에서 실시간 계산(요구사항 4).
  let watchedTotal = 0
  let durationTotal = 0
  let completedCount = 0
  for (const ch of data.chapters) {
    const d = parseClock(ch.durationLabel)
    durationTotal += d
    if (completedFor(ch)) {
      watchedTotal += d
      completedCount += 1
    } else {
      watchedTotal += Math.min(rawWatchedFor(ch), d)
    }
  }
  const overallPct = durationTotal
    ? Math.round((watchedTotal / durationTotal) * 100)
    : 0
  const remaining = Math.max(0, data.completion.requiredPct - overallPct)
  const completion: OnlineCompletion = {
    overallPct,
    requiredPct: data.completion.requiredPct,
    completedChapters: completedCount,
    totalChapters: data.chapters.length,
    totalDurationLabel: formatDurationKo(durationTotal),
    watchedDurationLabel: formatDurationKo(watchedTotal),
    statusLabel:
      remaining > 0
        ? `수료 기준까지 진도율 ${remaining}% 남았어요`
        : '수료 기준 진도율을 충족했어요',
    metStandard: overallPct >= data.completion.requiredPct,
  }

  // 중앙 진도율 카드 — 아직 완료되지 않은 차시(학습 중 + 예정)만, 최대 4개.
  const progressChapters = views.filter((v) => v.status !== 'done').slice(0, 4)

  return (
    <div className="grid grid-cols-1 items-start gap-5 p-8 xl:grid-cols-[320px_minmax(0,1fr)_330px]">
      {/* 좌: 과정 정보 + 차시 목록 */}
      <OnlineCourseInfoCard
        trackLabel={data.trackLabel}
        courseName={data.courseName}
        mentor={data.mentor}
        description={data.description}
        chapters={views}
        selectedChapterId={selected.id}
        onSelectChapter={selectChapter}
      />

      {/* 중: 영상 플레이어 + 차시별 진도율 */}
      <div className="flex flex-col gap-5">
        <OnlineVideoPlayer
          key={selected.id}
          chapter={selected}
          courseName={data.courseName}
          playing={playing}
          onPlay={() => setPlaying(true)}
          initialWatchedSec={initialWatchedSec}
          onProgress={handleProgress(selected.id)}
          onCompleted={handleCompleted(selected.id)}
        />
        {progressChapters.map((ch) => (
          <OnlineChapterProgress
            key={ch.id}
            chapter={ch}
            active={ch.id === selected.id}
            onSelect={() => selectChapter(ch.id)}
          />
        ))}
      </div>

      {/* 우: 수료 현황 + 학습 공지 */}
      <div className="flex flex-col gap-5">
        <OnlineCompletionPanel completion={completion} />
        <OnlineNoticePanel notices={data.notices} />
      </div>
    </div>
  )
}
