// PLAY 플레이 기록 — 기능 로컬. 서버 없이도 "최근 기록"이 실제로 쌓이도록 localStorage에 보관.
// 게임 종료 시 pushPlay 로 적재하고, 결과 화면이 getPlays 로 최근 기록을 읽는다.
export interface PlayHistoryItem {
  when: number // epoch ms
  detail: string // "612CPM · 98.1% · 84,500"
  score: number
}

type PlayGame = 'typing' | 'coding' | 'quiz'
const key = (game: PlayGame) => `lms.play.history.${game}`

export function pushPlay(
  game: PlayGame,
  item: { detail: string; score: number },
) {
  try {
    const list = getPlays(game)
    list.unshift({ ...item, when: Date.now() })
    localStorage.setItem(key(game), JSON.stringify(list.slice(0, 12)))
  } catch {
    // localStorage 불가 환경(프라이빗 모드 등)은 조용히 무시 — 기록은 부가 기능.
  }
}

export function getPlays(game: PlayGame): PlayHistoryItem[] {
  try {
    const raw = localStorage.getItem(key(game))
    return raw ? (JSON.parse(raw) as PlayHistoryItem[]) : []
  } catch {
    return []
  }
}

/** 상대 시각 — "방금 / N분 전 / N시간 전 / N일 전". */
export function relTime(when: number): string {
  const min = Math.floor((Date.now() - when) / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.floor(hr / 24)}일 전`
}

/** 결과 화면 "최근 기록" 카드용 — 최근 3건(최신=강조). 비어 있으면 안내 카드 1건. */
export function recentPlays(
  game: PlayGame,
): { title: string; detail: string; me?: boolean }[] {
  const list = getPlays(game)
    .slice(0, 3)
    .map((h, i) => ({ title: relTime(h.when), detail: h.detail, me: i === 0 }))
  return list.length
    ? list
    : [{ title: '기록 없음', detail: '플레이하면 기록이 여기에 쌓여요' }]
}
