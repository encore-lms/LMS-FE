import { describe, expect, it, beforeEach } from 'vitest'
import { useAuthStore } from '@/shared/store'
import { queryClient } from '@/app/queryClient'
import {
  addLocalNotification,
  useLocalNotificationStore,
} from './localNotifications'

// 세션 종료(로그아웃·401) 시 알림 관련 상태가 정리되는지 — 같은 브라우저에서
// 다른 사용자/역할로 재로그인할 때 이전 세션 데이터가 잔존 노출되지 않아야 한다.
describe('세션 종료 시 알림 데이터 정리', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('tok', {
      id: 'u1',
      email: 'a@b.com',
      name: '김수강',
      role: 'STUDENT',
    })
    useLocalNotificationStore.getState().clear()
    queryClient.clear()
  })

  it('로그아웃(토큰 소멸) 시 로컬 알림이 비워진다', () => {
    addLocalNotification({ title: '멘션 알림', source: 'QnA' })
    expect(useLocalNotificationStore.getState().items).toHaveLength(1)
    useAuthStore.getState().clearSession()
    expect(useLocalNotificationStore.getState().items).toHaveLength(0)
  })

  it('로그아웃 시 쿼리 캐시가 비워져 다음 사용자에게 남지 않는다', () => {
    queryClient.setQueryData(
      ['notifications', 'STUDENT'],
      [{ id: 'n1', title: '이전 사용자 알림' }],
    )
    useAuthStore.getState().clearSession()
    expect(
      queryClient.getQueryData(['notifications', 'STUDENT']),
    ).toBeUndefined()
  })
})
