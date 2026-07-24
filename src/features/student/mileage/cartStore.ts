import { create } from 'zustand'
import type { Tone } from './types'

export interface CartItem {
  productId: string
  name: string
  price: number // 단가(M) — flexible이면 수강생이 입력한 가격
  icon: 'book' | 'video' | 'cup' | 'gift'
  tone: Tone
  imageUrl?: string | null
  quantity: number
  // 도서·인터넷 강의(수강생 직접 입력) — 가격을 수강생이 정하고 구매 링크를 제출.
  flexible?: boolean
  link?: string
}

interface CartState {
  items: CartItem[]
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  remove: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  clear: () => void
}

// 마일리지 장바구니(세션 메모리). 결제는 실 BE 다품목 주문(POST /student/mileage/orders {items}).
export const useCartStore = create<CartState>((set) => ({
  items: [],
  add: (item, qty = 1) =>
    set((s) => {
      const existing = s.items.find((i) => i.productId === item.productId)
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + qty }
              : i,
          ),
        }
      }
      return { items: [...s.items, { ...item, quantity: qty }] }
    }),
  remove: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
  setQty: (productId, qty) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i,
      ),
    })),
  clear: () => set({ items: [] }),
}))

export const cartCount = (items: CartItem[]) =>
  items.reduce((a, i) => a + i.quantity, 0)
export const cartTotal = (items: CartItem[]) =>
  items.reduce((a, i) => a + i.price * i.quantity, 0)
