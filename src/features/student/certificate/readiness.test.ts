import { describe, expect, it } from 'vitest'
import type { MenuNode } from '@/components/layout'
import type { CertificateAnalysisView } from './analysis'
import { filterCertificateMenu, isCertificateReady } from './readiness'

const readyView = {
  dataStatus: 'READY',
  analysisStatus: 'READY',
  resultSchemaVersion: '2026.08.26-certificate-seven-tab-result-v1',
  tabs: {},
  mode: 'PREVIEW',
  snapshot: null,
} as CertificateAnalysisView

describe('isCertificateReady', () => {
  it('Gold와 분석 결과 및 7개 탭이 모두 준비된 미리보기만 노출한다', () => {
    expect(isCertificateReady(readyView)).toBe(true)
  })

  it.each([
    ['Gold 미준비', { ...readyView, dataStatus: 'NOT_READY' }],
    ['분석 생성 중', { ...readyView, analysisStatus: 'GENERATING' }],
    ['7개 탭 누락', { ...readyView, tabs: null }],
    ['스키마 누락', { ...readyView, resultSchemaVersion: null }],
  ])('%s 상태에서는 증명서를 노출하지 않는다', (_label, view) => {
    expect(isCertificateReady(view as CertificateAnalysisView)).toBe(false)
  })

  it('인증 완료 상태라도 동결 Snapshot이 없으면 노출하지 않는다', () => {
    expect(
      isCertificateReady({
        ...readyView,
        mode: 'CERTIFIED',
        snapshot: null,
      }),
    ).toBe(false)
  })
})

describe('filterCertificateMenu', () => {
  const menu: MenuNode[] = [
    { label: '대시보드', to: '/student' },
    { label: '역량 증명서', to: '/student/certificate' },
    {
      label: '기타',
      children: [
        { label: '공개 설정', to: '/student/certificate/publication' },
        { label: '마일리지', to: '/student/mileage' },
      ],
    },
  ]

  it('준비되지 않으면 증명서와 하위 경로 메뉴를 모두 숨긴다', () => {
    const filtered = filterCertificateMenu(menu, false)

    expect(JSON.stringify(filtered)).not.toContain('/student/certificate')
    expect(JSON.stringify(filtered)).toContain('/student/mileage')
  })

  it('준비되면 기존 메뉴 구성을 그대로 유지한다', () => {
    expect(filterCertificateMenu(menu, true)).toBe(menu)
  })
})
