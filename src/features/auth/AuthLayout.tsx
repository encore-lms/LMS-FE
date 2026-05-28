import type { ReactNode } from 'react'
import { BrandPanel } from './BrandPanel'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center bg-white p-16">
        {children}
      </div>
    </main>
  )
}
