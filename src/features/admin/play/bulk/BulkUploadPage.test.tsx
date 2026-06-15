import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import BulkUploadPage from './BulkUploadPage'
import { usePlayBulkPreview } from './api'
import type { BulkUploadData } from './types'

vi.mock('./api')
// 샘플 다운로드 helper는 실제 anchor click(jsdom 미지원) → 모킹해 토스트만 검증.
vi.mock('../sampleCsv')

// 타자 일괄 업로드 — KPI·필드 표·검증 항목·처리 기준 렌더 + 액션 토스트.

const overview: BulkUploadData = {
  file: {
    fileName: 'typing_texts_2026-05.csv',
    detail: 'UTF-8 · comma · header 포함',
  },
  summary: {
    uploadFiles: 2,
    uploadFilesHint: 'CSV 1 · XLSX 1',
    normalRows: 238,
    normalHint: '등록 가능',
    errorRows: 7,
    errorHint: '필수 열 누락',
    dupCandidates: 13,
    dupHint: '기존 제목',
    estimated: 225,
    estimatedHint: '활성 등록',
  },
  fields: [
    {
      id: 'language',
      field: 'language',
      sample: 'ko',
      validation: 'normal',
      action: 'pin',
    },
    {
      id: 'sortOrder',
      field: 'sortOrder',
      sample: '12',
      validation: 'dup_candidate',
      action: 'edit',
    },
  ],
  validations: [
    {
      id: 'required',
      item: '필수 열',
      normal: 238,
      error: 0,
      handling: 'pass',
    },
    {
      id: 'level',
      item: '난이도 값',
      normal: 236,
      error: 2,
      handling: 'map_needed',
    },
  ],
}

function renderPage() {
  vi.mocked(usePlayBulkPreview).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof usePlayBulkPreview>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <BulkUploadPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('BulkUploadPage (타자 일괄 업로드)', () => {
  it('KPI·파일·필드 표·검증 항목·처리 기준을 렌더한다', () => {
    renderPage()
    // '238'은 KPI(정상 행)·검증 표(필수 열) 양쪽 등장 → KPI 힌트로 조회
    expect(screen.getByText('등록 가능')).toBeInTheDocument()
    expect(screen.getByText('typing_texts_2026-05.csv')).toBeInTheDocument()
    expect(screen.getByText('sortOrder')).toBeInTheDocument()
    // '중복 후보'는 KPI 라벨·필드 배지 양쪽 등장
    expect(screen.getAllByText('중복 후보').length).toBeGreaterThan(0)
    expect(screen.getByText('매핑 필요')).toBeInTheDocument()
    expect(
      screen.getByText(
        /필수 열은 language, level, title, content, sortOrder입니다/,
      ),
    ).toBeInTheDocument()
  })

  it('검증 실행 — 결과 배너·성공 토스트 노출 후 버튼이 재검증으로 전환', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '검증 실행' }))
    expect(
      await screen.findByText('검증 완료 — 정상 238행 · 오류 7행'),
    ).toBeInTheDocument()
    // 결과 배너(중복 후보·예상 반영 카운트)
    expect(
      screen.getByText(/중복 후보 13건 · 예상 반영 225행/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '재검증' })).toBeInTheDocument()
  })

  it('샘플 다운로드 — 성공 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '샘플 다운로드' }))
    expect(
      await screen.findByText('샘플 CSV 양식을 내려받았습니다.'),
    ).toBeInTheDocument()
  })
})
