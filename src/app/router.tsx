import { createBrowserRouter } from 'react-router-dom'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { LoginPage } from '@/features/auth/LoginPage'
import { StyleGuidePage } from '@/features/styleguide/StyleGuidePage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/_styleguide', element: <StyleGuidePage /> },
  {
    element: <AuthGuard />,
    children: [{ path: '/', element: <div>홈 (준비 중)</div> }],
  },
])
