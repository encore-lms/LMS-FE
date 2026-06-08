import type { ReactNode } from 'react'
import { BrandPanel } from './BrandPanel'

interface AuthLayoutProps {
  children: ReactNode
  /** BrandPanel 소개 문구 자리에 끼워 넣을 노드(데모 빠른 로그인 등). */
  brandSlot?: ReactNode
}

export function AuthLayout({ children, brandSlot }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen">
      <BrandPanel slot={brandSlot} />
      <div className="flex flex-1 items-center justify-center bg-white p-16">
        {children}
      </div>
    </main>
  )
}
