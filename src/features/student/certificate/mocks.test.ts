import { afterEach, describe, expect, it, vi } from 'vitest'
import { setupServer } from 'msw/node'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('수강역량증명서 배포 mock 경로', () => {
  it('배포의 절대 API 주소에서도 증명서 overview를 반환한다', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/')
    vi.resetModules()
    const { CERTIFICATE_MOCK_ENDPOINTS, handlers } = await import('./mocks')
    const server = setupServer(...handlers)
    server.listen({ onUnhandledRequest: 'error' })

    try {
      const response = await fetch(
        'https://api.example.com/student/certificate',
      )
      const body = (await response.json()) as {
        data: { header: { studentName: string } }
      }

      expect(response.ok).toBe(true)
      expect(body.data.header.studentName).toBeTruthy()
      expect(CERTIFICATE_MOCK_ENDPOINTS.overview).toBe(
        'https://api.example.com/student/certificate',
      )
    } finally {
      server.close()
    }
  })

  it('이력서 API를 증명서 mock 대상에 포함하지 않는다', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
    vi.resetModules()
    const { CERTIFICATE_MOCK_ENDPOINTS } = await import('./mocks')

    expect(Object.values(CERTIFICATE_MOCK_ENDPOINTS)).toHaveLength(5)
    expect(CERTIFICATE_MOCK_ENDPOINTS.projects).toBe(
      'https://api.example.com/student/certificate/projects',
    )
    expect(
      Object.values(CERTIFICATE_MOCK_ENDPOINTS).some((endpoint) =>
        endpoint.includes('/student/resume'),
      ),
    ).toBe(false)
  })
})
