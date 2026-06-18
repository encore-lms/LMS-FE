import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { queryClient } from '@/app/queryClient'
import { ToastProvider } from '@/components/ui/Toast'
import '@/index.css'

// MSW mock 활성화 조건: 로컬 dev(항상) 또는 VITE_ENABLE_MOCK=true(BE 없는 배포 환경, 1주차 한정).
// BE 합류 시 배포 빌드의 VITE_ENABLE_MOCK 플래그를 제거하면 실제 API로 전환된다.
async function enableMocking() {
  const useMock =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK === 'true'
  if (!useMock) return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
  keepMockAlive()
}

// 브라우저는 백그라운드(다른 탭 전환·최소화·절전) 상태의 서비스워커를 유휴 종료한다.
// MSW의 5초 keepalive는 백그라운드 탭에서 타이머가 throttle 돼 멈추므로 워커가 죽고,
// 워커가 죽으면 활성 클라이언트 목록이 비워져 복귀 후 모든 /api 요청이 mock을 거치지 않고
// 통과한다 — 전 화면이 "불러오지 못했어요"로 뜨는 원인. 탭이 다시 보일 때 MSW 활성화
// 메시지를 재전송해 클라이언트를 재등록하고, 활성화 확인 후 실패했던 쿼리만 다시 가져온다.
function keepMockAlive() {
  const sw = navigator.serviceWorker
  if (!sw) return

  // 재활성화가 끝나면(MOCKING_ENABLED) 에러 상태로 남은 쿼리만 재요청 → 화면 자동 복구.
  sw.addEventListener('message', (event) => {
    if (event.data?.type === 'MOCKING_ENABLED') {
      void queryClient.refetchQueries({
        predicate: (q) => q.state.status === 'error',
      })
    }
  })

  // 워커 내부 프로토콜: 현재 클라이언트를 워커의 활성 목록에 다시 등록시킨다.
  const reactivate = () => {
    if (document.visibilityState === 'visible') {
      sw.controller?.postMessage('MOCK_ACTIVATE')
    }
  }
  document.addEventListener('visibilitychange', reactivate)
  window.addEventListener('focus', reactivate)
}

async function main() {
  await enableMocking()
  // React Query devtools는 DEV에서만 동적 import — 프로덕션 번들에서 완전히 제외된다.
  const Devtools = import.meta.env.DEV
    ? (await import('@tanstack/react-query-devtools')).ReactQueryDevtools
    : null
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
        {Devtools && <Devtools initialIsOpen={false} />}
      </QueryClientProvider>
    </StrictMode>,
  )
}

void main()
