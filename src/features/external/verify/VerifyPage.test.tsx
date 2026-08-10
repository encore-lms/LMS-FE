import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import VerifyPage from './VerifyPage'
import { useVerifyCertificate } from '../api/verify'
import { externalPublicRoutes } from '../routes'
import type { ExternalCertificateVerificationResponse } from './types'

vi.mock('../api/verify')

type Hook = ReturnType<typeof useVerifyCertificate>

function mockHook(v: Partial<Hook>) {
  vi.mocked(useVerifyCertificate).mockReturnValue(v as unknown as Hook)
}

function mockResult(data: ExternalCertificateVerificationResponse) {
  mockHook({ data, isPending: false, isError: false })
}

function renderPage(token = 'vfy_kp9q4r2nx0') {
  // 공개 검증도 증명서 탭(useQuery 사용)을 재사용하므로 QueryClient 가 필요하다.
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/verify/${token}`]}>
        <Routes>
          <Route path="/verify/:publicToken" element={<VerifyPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const publicResult: ExternalCertificateVerificationResponse = {
  resultType: 'certified_public',
  verificationId: 'ver_2026Q2_512',
  snapshotVersion: '2026.05',
  snapshotHash: 'sha256:a3f9…07e',
  publicSchemaVersion: '2026.06',
  publicPayload: {
    issuer: 'PLAYDATA',
    certifiedDate: '2026-05-19',
    issuedAt: '2026-05-19 11:24 KST',
    student: {
      nameKo: '이서연',
      nameEn: 'Lee Seoyeon',
      cohort: 'DA 5기',
      courseSummary: 'PLAYDATA 데이터 분석 과정 · 480h · 2025-12 ~ 2026-05',
    },
    stats: {
      coreCompetencyGrade: 'A',
      attendanceRate: '96.2%',
      examAverage: '84.7',
      submissionRate: '91%',
    },
    skills: [
      { label: '기술', score: 82 },
      { label: '책임감', score: 76 },
      { label: '소통', score: 88 },
      { label: '성장', score: 79 },
      { label: '팀워크', score: 84 },
      { label: '문제해결', score: 81 },
    ],
    skillAvg: 81.7,
    evidenceSummary: '프로젝트 1 · 트러블슈팅 1 · 기록실 12',
    evidence: [
      {
        category: '프로젝트',
        title: 'LLM 추천 시스템 v0.3',
        description: 'DA 5기 · 강사 김지훈 승인',
      },
    ],
  },
}

describe('VerifyPage — 진입 로딩(pending)', () => {
  it('query pending 동안 로딩 셸을 렌더하고 실데이터를 노출하지 않는다', () => {
    mockHook({ isPending: true })
    renderPage()
    expect(screen.getByText('PLAYDATA — 외부 검증')).toBeInTheDocument()
    expect(screen.getByText('VERIFYING TOKEN · 자동 분기')).toBeInTheDocument()
    expect(
      screen.getByText('검증 정보를 확인하고 있습니다'),
    ).toBeInTheDocument()
    expect(screen.getByText('분기 완료 전 표시 없음')).toBeInTheDocument()
    // 명세: 분기 완료 전 어떤 상세 정보도 렌더링하지 않음.
    expect(screen.queryByText('이서연')).not.toBeInTheDocument()
    expect(screen.queryByText(/sha256:/)).not.toBeInTheDocument()
  })
})

describe('VerifyPage — 평가·추천 공개 토글', () => {
  // 동료 평판·코멘트는 남의 평가다 — 수강생이 켠 경우에만 외부에 보인다.
  it('토글이 꺼져 있으면 평가·추천 탭을 노출하지 않는다', () => {
    mockResult(publicResult)
    renderPage()
    expect(screen.queryByRole('button', { name: '평가·추천' })).toBeNull()
  })

  it('토글이 켜져 있으면 평가·추천 탭이 나타난다', () => {
    mockResult({
      ...publicResult,
      publicPayload: {
        ...publicResult.publicPayload,
        peerReputationPublic: true,
      },
    })
    renderPage()
    expect(
      screen.getByRole('button', { name: '평가·추천' }),
    ).toBeInTheDocument()
  })
})

describe('VerifyPage — certified_public(공개 증명서)', () => {
  it('Hero 진본 배너·증명서 본문·무결성 필드를 렌더한다', () => {
    mockResult(publicResult)
    renderPage()
    expect(
      screen.getByText('이 증명서는 정식으로 발급된 진본입니다'),
    ).toBeInTheDocument()
    expect(screen.getByText('certified · 진본 검증 완료')).toBeInTheDocument()
    // 증명서 본문 — 수강생 미리보기의 히어로를 그대로 쓴다(인증 완료 칩 + 검증 ID).
    expect(screen.getByText('이서연')).toBeInTheDocument()
    expect(screen.getByText('정식 인증 완료')).toBeInTheDocument()
    expect(screen.getByText(/ver_2026Q2_512/)).toBeInTheDocument()
    // 탭은 미리보기와 같은 컴포넌트(CertTabs). 종합 요약이 기본이다.
    expect(screen.getByRole('button', { name: '종합 요약' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '기술·검증' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '프로젝트' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이력서' })).toBeNull()
    // 종합 요약 본문(도넛·6축)은 미리보기의 SummaryTab 이 그대로 그린다.
    // 점수 조회가 끝나기 전에는 골격이 뜬다 — 탭이 선택돼 있는 것으로 확인한다.
    expect(screen.getByRole('button', { name: '종합 요약' })).toHaveClass(
      'text-brand',
    )
    // 대표 근거.
    expect(screen.getByText('LLM 추천 시스템 v0.3')).toBeInTheDocument()
    // 검증 정보 — 무결성(해시는 Hero 칩과 필드 박스 2곳).
    expect(screen.getAllByText(/sha256:a3f9…07e/)).toHaveLength(2)
    expect(screen.getByText('vfy_kp9q4r2nx0')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /공개 JSON 다운로드/ }),
    ).toBeInTheDocument()
    // 본문 폭은 수강생 미리보기와 같아야 한다(1240 - 패딩 64 = 1176px).
    // 예전 880px 그대로 두면 4열 지표 카드가 눌려 글자가 깨졌다.
    expect(document.querySelector('main')?.className).toContain(
      'max-w-[1240px]',
    )
  })
})

describe('VerifyPage — certified_private(비공개 안내)', () => {
  it('비공개 안내를 렌더하고 상세를 일절 노출하지 않는다', () => {
    mockResult({
      resultType: 'certified_private',
      verificationIdMasked: 'CERT-****-0012',
      messageCode: 'CERTIFICATE_PRIVATE',
    })
    renderPage('vfy_private_demo')
    expect(screen.getByText('비공개 증명서')).toBeInTheDocument()
    expect(
      screen.getByText('이 증명서는 비공개 상태입니다'),
    ).toBeInTheDocument()
    // 내부 표현(isPublic·payload)은 외부 검증자에게 보여 주지 않는다.
    expect(screen.queryByText(/isPublic/)).not.toBeInTheDocument()
    expect(screen.queryByText(/외부 검증 페이지 정책/)).not.toBeInTheDocument()
    // 수강생 이름·점수 등 상세 비노출(명세).
    expect(screen.queryByText('이서연')).not.toBeInTheDocument()
  })
})

describe('VerifyPage — not_certified(미인증 안내)', () => {
  it('미인증 안내를 렌더한다 — status != certified 문구는 pill과 카드 행 2곳', () => {
    mockResult({
      resultType: 'not_certified',
      messageCode: 'CERTIFICATE_NOT_CERTIFIED',
    })
    renderPage('vfy_uncert_demo')
    expect(
      screen.getByText('아직 인증이 완료되지 않았습니다'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('status != certified')).toHaveLength(2)
    expect(
      screen.getByText('정식 인증 전 · 검토 중 · 보완 요청 중'),
    ).toBeInTheDocument()
    expect(screen.queryByText('이서연')).not.toBeInTheDocument()
  })
})

describe('VerifyPage — invalid_token·expired_token(잘못된 링크)', () => {
  it('invalid_token이면 잘못된 링크 dead-end(버튼 없음)를 렌더한다', () => {
    mockResult({
      resultType: 'invalid_token',
      messageCode: 'CERTIFICATE_TOKEN_INVALID',
    })
    renderPage('no-such-token')
    expect(screen.getByText('INVALID LINK · 검증 실패')).toBeInTheDocument()
    expect(screen.getByText('잘못된 검증 링크입니다')).toBeInTheDocument()
    expect(screen.getByText('이런 경우에 표시됩니다')).toBeInTheDocument()
    // Figma 그대로 dead-end — 인터랙션 요소 없음.
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('expired_token은 잘못된 링크 화면을 재사용한다(문서 명시)', () => {
    mockResult({
      resultType: 'expired_token',
      messageCode: 'CERTIFICATE_TOKEN_EXPIRED',
    })
    renderPage('vfy_expired_demo')
    expect(screen.getByText('잘못된 검증 링크입니다')).toBeInTheDocument()
  })
})

describe('VerifyPage — 비공개 안내 변형 2종(문서 기반, Figma 변형 프레임 부재)', () => {
  it('public_preparing이면 공개 준비 중 안내를 렌더한다', () => {
    mockResult({
      resultType: 'public_preparing',
      verificationIdMasked: 'CERT-****-0012',
      messageCode: 'CERTIFICATE_PUBLIC_PAYLOAD_NOT_READY',
    })
    renderPage('vfy_preparing_demo')
    expect(
      screen.getByText('증명서 공개를 준비하고 있습니다'),
    ).toBeInTheDocument()
    expect(screen.getByText('공개 준비 중')).toBeInTheDocument()
  })

  it('verification_disabled이면 검증 불가 안내를 렌더한다', () => {
    mockResult({
      resultType: 'verification_disabled',
      messageCode: 'CERTIFICATE_TOKEN_DISABLED',
    })
    renderPage('vfy_disabled_demo')
    expect(
      screen.getByText('이 증명서는 검증이 불가합니다'),
    ).toBeInTheDocument()
    expect(screen.getByText('검증 불가')).toBeInTheDocument()
  })
})

describe('externalPublicRoutes (public 마운트 계약)', () => {
  it('AuthGuard 밖 최상위 마운트용 /verify/:publicToken 라우트를 route-level lazy로 내보낸다', () => {
    expect(externalPublicRoutes).toHaveLength(1)
    const route = externalPublicRoutes[0]
    expect(route.path).toBe('/verify/:publicToken')
    // AppShell 밖(상위 Suspense 없음)이라 element+lazy() 대신 route-level lazy 필수.
    expect(route.lazy).toBeTypeOf('function')
    expect(route.element).toBeUndefined()
  })
})
