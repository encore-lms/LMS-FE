import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import BulkUploadPage from './BulkUploadPage'
import { useBulkCreatePassages } from './api'
import { usePlayTypingTexts } from '../api'

vi.mock('./api')
vi.mock('../api')
// 샘플 다운로드 helper는 실제 anchor click(jsdom 미지원) → 모킹해 토스트만 검증.
vi.mock('../sampleCsv')

// 타자 일괄 업로드 — CSV 파일 파싱·검증 미리보기·정상 행 일괄 등록.

const CSV =
  'language,level,title,content,sortOrder\n' +
  'Python,쉬움,정상 제목,정상 본문,10\n' +
  'Java,보통,,본문만 있음,20\n'

const bulkMutateSpy = vi.fn(
  (
    items: unknown[],
    opts?: { onSuccess?: (r: { created: number }) => void },
  ) => opts?.onSuccess?.({ created: (items as unknown[]).length }),
)

function renderPage() {
  vi.mocked(usePlayTypingTexts).mockReturnValue({
    data: {
      summary: { active: 0, inactive: 0, error: 0, disabledCourses: 0 },
      passages: [],
      uploadValidation: [],
      uploadErrorRows: 0,
    },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof usePlayTypingTexts>)
  vi.mocked(useBulkCreatePassages).mockReturnValue({
    mutate: bulkMutateSpy,
    isPending: false,
  } as unknown as ReturnType<typeof useBulkCreatePassages>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <BulkUploadPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

async function uploadCsv(text: string) {
  const user = userEvent.setup()
  const file = new File([text], 'passages.csv', { type: 'text/csv' })
  await user.upload(screen.getByLabelText('CSV 파일 선택'), file)
  return user
}

describe('BulkUploadPage (타자 일괄 업로드)', () => {
  it('파일 선택 전 — 등록 버튼 비활성 + 대기 상태를 렌더한다', () => {
    renderPage()
    expect(
      screen.getByRole('button', { name: '정상 행 0건 등록' }),
    ).toBeDisabled()
    expect(screen.getByText('선택된 파일 없음')).toBeInTheDocument()
  })

  it('CSV 업로드 — 정상·오류 행을 검증해 요약과 오류 사유를 보여준다', async () => {
    renderPage()
    await uploadCsv(CSV)
    // 토스트와 결과 배너 양쪽에 표시된다.
    expect(await screen.findAllByText(/정상 1행 · 오류 1행/)).not.toHaveLength(
      0,
    )
    // 오류 행 상세 — 행 번호와 사유
    expect(screen.getByText(/3행/)).toBeInTheDocument()
    expect(screen.getByText(/title 필수/)).toBeInTheDocument()
    expect(screen.getByText(/language는 Python·한글·영문/)).toBeInTheDocument()
  })

  it('정상 행 등록 — 정상 행만 일괄 등록을 호출한다', async () => {
    renderPage()
    const user = await uploadCsv(CSV)
    // 파일 읽기(FileReader)가 비동기라 파싱 반영을 기다린다.
    await user.click(
      await screen.findByRole('button', { name: '정상 행 1건 등록' }),
    )
    expect(bulkMutateSpy).toHaveBeenCalledWith(
      [
        {
          title: '정상 제목',
          content: '정상 본문',
          language: 'Python',
          level: '쉬움',
          order: 10,
          active: true,
        },
      ],
      expect.anything(),
    )
    expect(
      await screen.findByText('제시문 1건을 등록했습니다.'),
    ).toBeInTheDocument()
  })

  it('필수 열 누락 파일 — 파일 수준 오류를 보여주고 등록을 막는다', async () => {
    renderPage()
    await uploadCsv('title,content\nA,B\n')
    expect(await screen.findAllByText(/필수 열이 없어요/)).not.toHaveLength(0)
    expect(
      screen.getByRole('button', { name: '정상 행 0건 등록' }),
    ).toBeDisabled()
  })
})
