import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 수강생 라우트 — features/student 소유자만 편집(결합 해소: 공유 router.tsx를 건드리지 않는다).
const StudentHome = lazy(() => import('./StudentHome'))
const QuizListPage = lazy(() => import('./quiz/QuizListPage'))

export const studentRoutes: RouteObject[] = [
  {
    path: 'student',
    children: [
      { index: true, element: <StudentHome /> },
      { path: 'quizzes', element: <QuizListPage /> },
      // 다음 PR(응시·결과):
      // { path: 'quizzes/:quizId/take', element: <QuizTakePage /> },
      // { path: 'quizzes/:quizId/result', element: <QuizResultPage /> },
    ],
  },
]
