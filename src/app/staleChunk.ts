// 코드 스플리팅(라우트 lazy import) 청크 로드 실패 감지·복구 유틸.
// 대개 "재배포로 옛 해시 청크가 CDN에서 교체/삭제됨" 상황에서 발생한다(옛 index.html을
// 든 탭이 사라진 청크를 요청 → fetch 실패). 최신 index.html을 받으면 새 청크로 해소되므로
// 1회 전체 새로고침으로 자동 복구한다.
// main.tsx(vite:preloadError 조기 차단)와 RouteErrorBoundary(렌더 단계 백스톱)에서 공용.

const RELOAD_KEY = 'app:stale-chunk-reload-at'
// 이 시간(ms) 내 이미 새로고침했는데 또 청크 실패면 = 새로고침해도 안 되는 상황이므로
// 무한 새로고침을 막고 사용자에게 폴백 UI를 보여준다.
const RELOAD_WINDOW = 10_000

const CHUNK_ERROR_RE =
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i

/** 동적 import(청크) 로드 실패 에러인지 판별 — 일반 렌더 오류와 구분해 자동 새로고침 대상만 가린다. */
export function isChunkLoadError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ''
  return CHUNK_ERROR_RE.test(msg)
}

/**
 * 옛 청크 실패 시 1회만 전체 새로고침해 최신 index.html·청크를 받는다.
 * @returns 새로고침을 트리거했으면 true, 루프 방지로 건너뛰었으면 false.
 */
export function reloadForStaleChunk(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? '0')
    if (Date.now() - last < RELOAD_WINDOW) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // sessionStorage 접근 불가(프라이빗 모드 등) — 그래도 1회는 시도한다.
  }
  window.location.reload()
  return true
}
