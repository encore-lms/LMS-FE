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
