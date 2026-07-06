import type { RequestHandler } from 'msw'

// 강사 퀴즈 템플릿(/instructor/quiz-templates)은 learning-service 실 BE로 연동(mock 제거).
// vite.config.ts 프록시(/api/instructor/quiz-templates)로 전달된다.
export const handlers: RequestHandler[] = []
