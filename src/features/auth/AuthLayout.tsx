import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">LMS 역량증명서</h1>
        </header>
        {children}
      </section>
    </main>
  )
}
