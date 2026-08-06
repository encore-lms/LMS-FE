import type { RouteObject } from 'react-router-dom'

// 외부 검증 라우트 — features/external 소유자만 편집.
//
// 셸 안 '/external' 은 걷어냈다(2026-08-06). 본문이 없는 placeholder 였는데 로그인만 하면
// 역할 무관 열려, 사용자에게 'features/external/ 에 화면을 추가하세요' 라는 개발용 문구가
// 그대로 보였다. 외부 검증의 실제 진입점은 아래 공개 라우트다. 화면이 생기면 다시 넣는다.

// 비로그인 public 라우트 — 외부 검증 URL(/verify/:publicToken).
// 취합층(router.tsx)이 AuthGuard 밖 최상위('/login' 형제)에 마운트한다
// (studentFullscreenRoutes 분리 export 패턴). 이후 외부검증 화면 추가는 이 파일만 수정.
export const externalPublicRoutes: RouteObject[] = [
  {
    path: '/verify/:publicToken',
    // AppShell 밖이라 상위 Suspense 경계가 없음 — route-level lazy(RR7)로
    // 라우터가 모듈 로드를 대기시킨다(외부 공유 링크 하드 로드가 주 경로).
    lazy: async () => ({
      Component: (await import('./verify/VerifyPage')).default,
    }),
  },
]
