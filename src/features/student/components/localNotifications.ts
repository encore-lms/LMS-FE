import { create } from 'zustand'
import type { DashboardNotification } from '../dashboard/types'

// 클라이언트 로컬 알림 — 멘션 등 FE에서 발생시킨 알림을 헤더 벨에 합성한다.
// NOTE(프로토타입): 단일 브라우저 mock이라 수신자별 라우팅은 불가. 멘션→알림 생성·표시
// 흐름을 데모하는 수준이며, 실 수신자 분배·영속화는 BE 알림 API가 필요하다.
interface LocalNotificationState {
  items: DashboardNotification[]
  add: (input: { title: string; source: string }) => void
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
    clear: () => set({ items: [] }),
  }),
)

/** 어디서든 로컬 알림 추가(컴포넌트 밖에서도 호출 가능). */
export function addLocalNotification(input: { title: string; source: string }) {
  useLocalNotificationStore.getState().add(input)
}
