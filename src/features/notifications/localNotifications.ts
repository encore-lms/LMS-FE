import { create } from 'zustand'
import { useAuthStore } from '@/shared/store'
import type { AppNotification } from '@/shared/types'

// 클라이언트 로컬 알림 — 멘션 등 FE에서 발생시킨 알림을 헤더 벨에 합성한다.
// NOTE(프로토타입): 단일 브라우저 mock이라 수신자별 라우팅은 불가. 멘션→알림 생성·표시
// 흐름을 데모하는 수준이며, 실 수신자 분배·영속화는 BE 알림 API가 필요하다.
interface LocalNotificationState {
  items: AppNotification[]
  add: (input: { title: string; source: string }) => void
  markAllRead: () => void
  clear: () => void
}

let localSeq = 0

export const useLocalNotificationStore = create<LocalNotificationState>(
  (set) => ({
    items: [],
    add: ({ title, source }) =>
      set((s) => ({
        items: [
          {
            id: `local_${++localSeq}`,
            title,
            source,
            relativeTime: '방금',
            unread: true,
          },
          ...s.items,
        ],
      })),
    markAllRead: () =>
      set((s) => ({ items: s.items.map((n) => ({ ...n, unread: false })) })),
    clear: () => set({ items: [] }),
  }),
)

/** 어디서든 로컬 알림 추가(컴포넌트 밖에서도 호출 가능). */
export function addLocalNotification(input: { title: string; source: string }) {
  useLocalNotificationStore.getState().add(input)
}

// 세션 종료(로그아웃·401 만료) 시 로컬 알림도 함께 비운다 —
// 같은 브라우저에서 다른 사용자/역할로 재로그인할 때 이전 세션 알림이 잔존 노출되는 것을 방지.
useAuthStore.subscribe((state, prev) => {
  if (prev.token && !state.token) useLocalNotificationStore.getState().clear()
})
