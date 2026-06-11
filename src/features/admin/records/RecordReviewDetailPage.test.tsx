import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RecordReviewDetailPage from './RecordReviewDetailPage'
import {
  useRecordReviewAction,
  useRecordSubmissionDetail,
} from '../api/records'
import { usePageHeaderStore } from '@/shared/store'
import type { RecordSubmissionDetailView } from './detailMeta'

vi.mock('../api/records')
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    danger: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    show: vi.fn(),
  }),
}))

type Hook = ReturnType<typeof useRecordSubmissionDetail>
type ActionHook = ReturnType<typeof useRecordReviewAction>

// Figma 1515:10927 대표값
const blogDetail: RecordSubmissionDetailView = {
  id: 'rr_blog_minjune',
  category: 'blog',
  student: { name: '김민준', cohort: 'DA 4기' },
  submissionLabel: '5주차 회고',
  statusCaption: '5주차 블로그',
  submittedAt: '2026-05-19 09:42',
  status: 'pending',
  reviewNote: '',
  mileageCandidate: '후보 +2,000',
  externalUrl: 'https://blog.example.com/sql-join-review',
  previewSummary:
    'SQL JOIN 실습에서 INNER JOIN과 LEFT JOIN의 차이를 정리하고, 실습 오류를 해결한 과정을 회고했습니다.',
  urlCheck: { passed: true, label: '정상', note: '응답 200' },
  privacyCheck: { passed: true, label: '없음', note: '자동 검사 통과' },
  certificateCandidates: [
    '학습 성실성',
    '문제 해결 과정',
    '데이터베이스 기초 역량',
  ],
}

// Figma 1515:11144 대표값
const studyDetail: RecordSubmissionDetailView = {
  id: 'rr_study_parkseo',
  category: 'study',
  student: { name: '박서연', cohort: 'FE 7기' },
  submissionLabel: '코테 스터디 3회',
  statusCaption: '이미지 2장',
  submittedAt: '2026-05-18 22:10',
  status: 'changes_requested',
  reviewNote: '',
  activityHours: 2,
  activityTimeRange: '20:00~22:00',
  streakCount: 3,
  evidenceQuality: { level: 'warning', note: '한 장 흐림' },
  evidenceImages: [
    { id: 'ev1', url: '/mock/1.jpg', quality: 'ok' },
    {
      id: 'ev2',
      url: '/mock/2.jpg',
      quality: 'blurry',
      note: '흐림 · 재제출 권장',
    },
    { id: 'ev3', url: '/mock/3.jpg', quality: 'ok' },
  ],
  activityNote:
    '알고리즘 DP 문제 4개 풀이와 코드 리뷰를 진행했습니다. 참석자 4명 중 3명 인증 완료.',
}

// Figma 1515:11361 대표값
const certDetail: RecordSubmissionDetailView = {
  id: 'rr_cert_doyun',
  category: 'certificate',
  student: { name: '정도윤', cohort: 'AI 3기' },
  submissionLabel: 'PCCP Lv.2',
  submittedAt: '2026-05-16 11:24',
  status: 'pending',
  reviewNote: '',
  mileageCandidate: '+15,000',
  evidenceImages: [{ id: 'ev1', url: '/mock/cert.png', quality: 'ok' }],
  ocr: {
    certificateName: 'PCCP',
    grade: 'Lv.2',
    holderName: '정도윤',
    acquiredAt: '2026-05-12',
  },
  policyAllowed: true,
  allowedCertificates: ['PCCE', 'PCCP', 'PCSQL'],
  duplicateSubmission: false,
  policyNote:
    '허용 자격증이며, 중복 제출 이력이 없습니다. 승인 시 기록실과 마일리지 후보에 반영됩니다.',
}

const mutate = vi.fn()

beforeEach(() => {
  mutate.mockClear()
  // 성공 콜백까지 흘려보내 토스트·큐 복귀 흐름을 검증한다.
  mutate.mockImplementation((_vars, opts) => opts?.onSuccess?.())
  vi.mocked(useRecordReviewAction).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ActionHook)
})

function mockDetail(v: Partial<Hook>) {
  vi.mocked(useRecordSubmissionDetail).mockReturnValue(v as unknown as Hook)
}

function renderAt(segment: string, submissionId: string) {
  return render(
    <MemoryRouter
      initialEntries={[`/admin/records/${segment}/${submissionId}`]}
    >
      <Routes>
        <Route path="/admin/records/review" element={<div>큐 화면</div>} />
        <Route
          path="/admin/records/blog/:submissionId"
          element={<RecordReviewDetailPage segment="blog" />}
        />
        <Route
          path="/admin/records/study/:submissionId"
          element={<RecordReviewDetailPage segment="study" />}
        />
        <Route
          path="/admin/records/certificates/:submissionId"
          element={<RecordReviewDetailPage segment="certificates" />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RecordReviewDetailPage', () => {
  it('블로그 상세 — KPI·제출 상세·검토 체크 불릿을 렌더한다', () => {
    mockDetail({ data: blogDetail, isPending: false, isError: false })
    renderAt('blog', blogDetail.id)
    expect(usePageHeaderStore.getState().title).toBe('블로그 검토 상세')
    // KPI 4종
    expect(screen.getByText('제출 상태')).toBeInTheDocument()
    expect(screen.getByText('5주차 블로그')).toBeInTheDocument()
    expect(screen.getByText('URL 점검')).toBeInTheDocument()
    expect(screen.getByText('응답 200')).toBeInTheDocument()
    expect(screen.getByText('개인정보')).toBeInTheDocument()
    expect(screen.getByText('후보 +2,000')).toBeInTheDocument()
    // 좌 패널
    expect(screen.getByText('블로그 제출 상세')).toBeInTheDocument()
    expect(screen.getByText('김민준 · DA 4기 · 5주차 회고')).toBeInTheDocument()
    expect(
      screen.getByText('학습 성실성 · 문제 해결 과정 · 데이터베이스 기초 역량'),
    ).toBeInTheDocument()
    // 우 패널 — 정적 불릿 4항목(체크박스 아님)
    expect(screen.getByText('검토 체크')).toBeInTheDocument()
    expect(screen.getByText('- 본인 작성 여부 확인')).toBeInTheDocument()
    expect(
      screen.getByText('- 코드/이미지 저작권 위험 없음'),
    ).toBeInTheDocument()
    // 새 탭 열기 — 제출 URL 새 탭
    const openLink = screen.getByRole('link', { name: '새 탭 열기' })
    expect(openLink).toHaveAttribute('href', blogDetail.externalUrl)
    expect(openLink).toHaveAttribute('target', '_blank')
    expect(screen.getByPlaceholderText('검토 메모 입력')).toBeInTheDocument()
  })

  it('스터디 상세 — 증빙 썸네일·처리 판단·보완 버튼을 렌더한다', () => {
    mockDetail({ data: studyDetail, isPending: false, isError: false })
    renderAt('study', studyDetail.id)
    expect(usePageHeaderStore.getState().title).toBe('스터디 검토 상세')
    expect(screen.getByText('스터디 증빙 상세')).toBeInTheDocument()
    expect(
      screen.getByText('박서연 · FE 7기 · 코테 스터디 3회'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('스터디 인증 이미지')).toHaveLength(2)
    expect(screen.getByText('흐림 · 재제출 권장')).toBeInTheDocument()
    expect(screen.getByText('처리 판단')).toBeInTheDocument()
    expect(
      screen.getByText(
        '증빙 2번 이미지가 흐려 스터디 참석자 확인이 어렵습니다. 보완 요청 시 수강생 기록실에 상태와 알림이 전달됩니다.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('보완 요청 사유 입력'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '보완' })).toBeInTheDocument()
  })

  it('자격증 상세 — OCR 추출·정책 확인·승인 처리를 렌더한다', () => {
    mockDetail({ data: certDetail, isPending: false, isError: false })
    renderAt('certificates', certDetail.id)
    expect(usePageHeaderStore.getState().title).toBe('자격증 검토 상세')
    expect(screen.getByText('정도윤 · AI 3기 · PCCP Lv.2')).toBeInTheDocument()
    expect(screen.getByText('OCR 추출')).toBeInTheDocument()
    expect(screen.getByText('자격명: PCCP')).toBeInTheDocument()
    expect(screen.getByText('취득일: 2026-05-12')).toBeInTheDocument()
    expect(screen.getByText('정책 확인')).toBeInTheDocument()
    expect(screen.getByText('승인 처리')).toBeInTheDocument()
    expect(screen.getByText('+15,000')).toBeInTheDocument()
    expect(screen.getByText('PCCE/PCCP/PCSQL')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '후보 확인' }),
    ).toBeInTheDocument()
  })

  it('반려·보완은 사유(검토 메모) 없이는 비활성, 승인은 항상 가능하다', async () => {
    mockDetail({ data: blogDetail, isPending: false, isError: false })
    const user = userEvent.setup()
    renderAt('blog', blogDetail.id)
    expect(screen.getByRole('button', { name: '반려' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '보완 요청' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '승인' })).toBeEnabled()

    await user.type(screen.getByLabelText('검토 메모'), 'URL 본문 불일치')
    expect(screen.getByRole('button', { name: '반려' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '보완 요청' })).toBeEnabled()
  })

  it('승인 클릭 시 approve mutation 호출 후 검토 큐로 복귀한다', async () => {
    mockDetail({ data: blogDetail, isPending: false, isError: false })
    const user = userEvent.setup()
    renderAt('blog', blogDetail.id)
    await user.click(screen.getByRole('button', { name: '승인' }))
    expect(mutate).toHaveBeenCalledWith(
      {
        recordId: 'rr_blog_minjune',
        category: 'blog',
        decision: 'approve',
        payload: { studentVisibleComment: '' },
      },
      expect.anything(),
    )
    expect(screen.getByText('큐 화면')).toBeInTheDocument()
  })

  it('반려 클릭 시 사유가 payload로 전달된다', async () => {
    mockDetail({ data: studyDetail, isPending: false, isError: false })
    const user = userEvent.setup()
    renderAt('study', studyDetail.id)
    await user.type(screen.getByLabelText('검토 메모'), '증빙 흐림 재제출 필요')
    await user.click(screen.getByRole('button', { name: '반려' }))
    expect(mutate).toHaveBeenCalledWith(
      {
        recordId: 'rr_study_parkseo',
        category: 'study',
        decision: 'reject',
        payload: { studentVisibleComment: '증빙 흐림 재제출 필요' },
      },
      expect.anything(),
    )
  })

  it('미지원 세그먼트는 Empty 가드를 표시한다', () => {
    mockDetail({ isPending: true })
    render(
      <MemoryRouter initialEntries={['/admin/records/projects/x1']}>
        <Routes>
          <Route
            path="/admin/records/:segment/:submissionId"
            element={<RecordReviewDetailPage segment="projects" />}
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('지원하지 않는 카테고리예요')).toBeInTheDocument()
  })

  it('로딩·에러 상태를 표시한다', () => {
    mockDetail({ isPending: true })
    const { unmount } = renderAt('blog', 'x')
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
    unmount()
    mockDetail({ isPending: false, isError: true, refetch: vi.fn() })
    renderAt('blog', 'x')
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
