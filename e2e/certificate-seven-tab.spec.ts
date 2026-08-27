import { expect, test, type Page, type Response } from '@playwright/test'

const TAB_KEYS = [
  'summary',
  'tech',
  'projects',
  'problemSolving',
  'growthReputation',
  'resume',
  'aiAnalysis',
].sort()

function required(name: string) {
  return process.env[name] ?? ''
}

async function login(page: Page, userId: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('아이디').fill(userId)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: /^로그인/ }).click()
  await expect(page).not.toHaveURL(/\/login$/)
}

async function analysisBody(response: Response) {
  expect(response.ok()).toBe(true)
  const body = (await response.json()) as { data?: unknown }
  return (body.data ?? body) as {
    dataStatus: string
    analysisStatus: string
    sourceVersion: string | null
    tabs: Record<string, { readinessStatus: string }> | null
  }
}

function expectExactReadyAnalysis(
  view: Awaited<ReturnType<typeof analysisBody>>,
) {
  expect(view.dataStatus).toBe('READY')
  expect(view.analysisStatus).toBe('READY')
  expect(view.sourceVersion).toBeTruthy()
  expect(Object.keys(view.tabs ?? {}).sort()).toEqual(TAB_KEYS)
  expect(
    Object.values(view.tabs ?? {}).every(
      (tab) => tab.readinessStatus === 'READY',
    ),
  ).toBe(true)
}

test.describe('실 API 역량 증명서 7개 탭', () => {
  const studentUserId = required('E2E_STUDENT_USER_ID')
  const studentPassword = required('E2E_STUDENT_PASSWORD')
  const studentTest = studentUserId && studentPassword ? test : test.skip
  studentTest(
    '수강생은 현재 원천의 READY 7개 탭에서만 인증을 요청한다',
    async ({ page }) => {
      await login(page, studentUserId, studentPassword)
      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/student/certificate/analysis'),
      )
      await page.goto('/student/certificate')
      expectExactReadyAnalysis(await analysisBody(await responsePromise))

      for (const label of [
        '종합 요약',
        '기술·검증',
        '프로젝트',
        '문제해결',
        '평가·추천',
        '이력서',
        '✦ AI 분석',
      ]) {
        await expect(page.getByRole('button', { name: label })).toBeVisible()
      }
      await expect(
        page.getByRole('button', { name: '정식 인증 요청' }),
      ).toBeVisible()
    },
  )

  const incompleteUserId = required('E2E_INCOMPLETE_STUDENT_USER_ID')
  const incompletePassword = required('E2E_INCOMPLETE_STUDENT_PASSWORD')
  const incompleteTest =
    incompleteUserId && incompletePassword ? test : test.skip
  incompleteTest(
    '미완성 수강생은 증명서 본문과 인증 요청을 노출하지 않는다',
    async ({ page }) => {
      await login(page, incompleteUserId, incompletePassword)
      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/student/certificate/analysis'),
      )
      await page.goto('/student/certificate')
      const view = await analysisBody(await responsePromise)
      expect(
        view.dataStatus !== 'READY' ||
          view.analysisStatus !== 'READY' ||
          !view.tabs ||
          Object.values(view.tabs).some(
            (tab) => tab.readinessStatus !== 'READY',
          ),
      ).toBe(true)
      await expect(
        page.getByRole('button', { name: '정식 인증 요청' }),
      ).toHaveCount(0)
      await expect(
        page.getByRole('heading', { name: '종합 요약' }),
      ).toHaveCount(0)
    },
  )

  const managerUserId = required('E2E_MANAGER_USER_ID')
  const managerPassword = required('E2E_MANAGER_PASSWORD')
  const certificateStudentId = required('E2E_CERTIFICATE_STUDENT_ID')
  const certificateCourseId = required('E2E_CERTIFICATE_COURSE_ID')
  const certificateCohortId = required('E2E_CERTIFICATE_COHORT_ID')
  const managerTest =
    managerUserId &&
    managerPassword &&
    certificateStudentId &&
    certificateCourseId &&
    certificateCohortId
      ? test
      : test.skip
  managerTest(
    '매니저 상세는 선택한 실제 수강생의 동일한 READY 7개 탭을 표시한다',
    async ({ page }) => {
      await login(page, managerUserId, managerPassword)
      const responsePromise = page.waitForResponse((response) =>
        response
          .url()
          .includes(`/admin/certificates/${certificateStudentId}/analysis`),
      )
      await page.goto(
        `/admin/certificates/${certificateStudentId}?courseId=${encodeURIComponent(certificateCourseId)}&cohortId=${encodeURIComponent(certificateCohortId)}`,
      )
      expectExactReadyAnalysis(await analysisBody(await responsePromise))
      await expect(page.getByRole('button', { name: '이력서' })).toBeVisible()
      await expect(
        page.getByRole('button', { name: '✦ AI 분석' }),
      ).toBeVisible()
      await expect(page.getByText('데이터 준비 완료')).toHaveCount(0)
    },
  )

  const publicToken = required('E2E_CERTIFICATE_PUBLIC_TOKEN')
  const publicTest = publicToken ? test : test.skip
  publicTest(
    '외부 검증은 인증 시점의 공개 Snapshot만으로 7개 탭을 표시한다',
    async ({ page }) => {
      const responsePromise = page.waitForResponse((response) =>
        response.url().includes(`/verify/${publicToken}`),
      )
      await page.goto(`/verify/${publicToken}`)
      const response = await responsePromise
      expect(response.ok()).toBe(true)
      const raw = (await response.json()) as { data?: unknown }
      const body = (raw.data ?? raw) as {
        resultType: string
        publicPayload?: { tabs: Record<string, { readinessStatus: string }> }
      }
      expect(body.resultType).toBe('certified_public')
      expect(
        Object.values(body.publicPayload?.tabs ?? {}).every(
          (tab) => tab.readinessStatus === 'READY',
        ),
      ).toBe(true)
      await expect(page.getByText('정식 인증 완료')).toBeVisible()
      await expect(page.getByRole('button', { name: '이력서' })).toBeVisible()
      await expect(
        page.getByRole('button', { name: '✦ AI 분석' }),
      ).toBeVisible()
    },
  )
})
