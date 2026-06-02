import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { queryClient } from '@/app/queryClient'
import { ToastProvider } from '@/components/ui/Toast'
import '@/index.css'

// 개발 환경에서만 MSW mock 활성화 (BE 없이 로그인 등 진행, 이후 실제 API로 교체)
async function enableMocking() {
  if (!import.meta.env.DEV) return
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
