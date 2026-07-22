import { http, HttpResponse } from 'msw'
import type {
  GithubConnectionStart,
  StudentGithubIdentity,
} from './githubTypes'

// 수강생 개인 GitHub 계정 연결 MSW 경계 — 실제 BE API로 교체 가능하도록 계약만 흉내낸다.
// 자동 수집 규약: features/**/mocks.ts 는 `handlers`를 내보낸다(mocks/handlers.ts가 glob으로 등록).
// { data } 래핑은 ApiResponse<T> 형태 준수.
const ok = <T,>(data: T) => HttpResponse.json({ data })

// 세션 내 연결 상태(모듈 스코프). start → 연결됨, delete → 해제됨으로 전이해 전체 흐름을 재현.
// 실 BE 전환 시 이 파일 전체를 삭제하면 되고, FE 호출부는 바뀌지 않는다.
const DISCONNECTED: StudentGithubIdentity = {
  status: 'DISCONNECTED',
  githubUserId: null,
  githubLogin: null,
  avatarUrl: null,
  profileUrl: null,
  connectedAt: null,
  verifiedAt: null,
}

const CONNECTED: StudentGithubIdentity = {
  status: 'CONNECTED',
  githubUserId: 20481079,
  githubLogin: 'suzin-park',
  avatarUrl: 'https://avatars.githubusercontent.com/u/20481079?v=4',
  profileUrl: 'https://github.com/suzin-park',
  connectedAt: '2026-07-22T09:40:00+09:00',
  verifiedAt: '2026-07-22T09:40:00+09:00',
}

// 전체 리다이렉트는 full page reload라 모듈 변수가 초기화되므로, 실 BE(서버 영속)처럼
// sessionStorage에 상태를 보관해 리로드 후에도 연결 상태가 유지되게 한다.
const KEY = 'mock-github-identity'
const load = (): StudentGithubIdentity => {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StudentGithubIdentity) : { ...DISCONNECTED }
  } catch {
    return { ...DISCONNECTED }
  }
}
const save = (v: StudentGithubIdentity) =>
  sessionStorage.setItem(KEY, JSON.stringify(v))

export const handlers = [
  http.get('/api/student/profile/github-identity', () =>
    ok<StudentGithubIdentity>(load()),
  ),
  // 인증 시작 — 실 BE면 authorizeUrl이 github.com/login/oauth/authorize?...
  // mock은 실제 GitHub로 갈 수 없으므로 앱 내부 복귀 경로를 반환해 콜백 성공을 시뮬레이션한다.
  // (전이: 다음 조회부터 CONNECTED). state는 일회성 토큰 자리표시자.
  http.post('/api/student/profile/github/start', () => {
    save({ ...CONNECTED })
    return ok<GithubConnectionStart>({
      authorizeUrl: '/student/profile?github=connected',
      state: 'mock-state-' + CONNECTED.githubUserId,
    })
  }),
  http.delete('/api/student/profile/github-identity', () => {
    save({ ...DISCONNECTED })
    return ok<StudentGithubIdentity>({ ...DISCONNECTED })
  }),
]
