import { describe, expect, it } from 'vitest'
import type { MenuNode } from '@/components/layout'
import { filterMenuByFeatures } from './courseFeatures'

const menu: MenuNode[] = [
  { label: '대시보드', to: '/student' },
  { label: '기록실', to: '/student/records', featureKey: 'records' },
  { label: '마일리지', to: '/student/mileage', featureKey: 'mileage' },
  { label: 'PLAY', to: '/student/play', featureKey: 'play' },
]

describe('filterMenuByFeatures', () => {
  it('features가 없으면 전부 노출(graceful)', () => {
    expect(filterMenuByFeatures(menu, undefined)).toHaveLength(4)
  })

  it('featureKey가 false인 항목만 숨긴다', () => {
    const result = filterMenuByFeatures(menu, {
      records: true,
      mileage: false,
      play: false,
    })
    const labels = result.map((n) => ('label' in n ? n.label : ''))
    expect(labels).toEqual(['대시보드', '기록실'])
  })

  it('featureKey 없는 항목은 토글과 무관하게 유지', () => {
    const result = filterMenuByFeatures(menu, { mileage: false, play: false })
    expect(result.some((n) => 'to' in n && n.to === '/student')).toBe(true)
  })

  it('features에 키가 없으면(미정의) 노출 유지 — false만 숨김', () => {
    const result = filterMenuByFeatures(menu, {})
    expect(result).toHaveLength(4)
  })
})
