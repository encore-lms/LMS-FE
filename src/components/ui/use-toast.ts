import { createContext, useContext, type ReactNode } from 'react'

export type ToastTone = 'success' | 'danger' | 'info' | 'warning'

export interface ToastShowOptions {
  tone?: ToastTone
  /** 자동 닫힘까지 ms (기본 3000) */
  duration?: number
}

export interface ToastContextValue {
  show: (message: ReactNode, opts?: ToastShowOptions) => void
  success: (message: ReactNode, duration?: number) => void
  danger: (message: ReactNode, duration?: number) => void
  info: (message: ReactNode, duration?: number) => void
  warning: (message: ReactNode, duration?: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

/** 앱이 <ToastProvider>로 감싸져 있어야 한다. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
