import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// 개발 환경 전용 mock 워커. main.tsx에서 import.meta.env.DEV일 때만 start.
export const worker = setupWorker(...handlers)
