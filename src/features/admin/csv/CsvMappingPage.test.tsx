import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import CsvMappingPage from './CsvMappingPage'
import {
  useCsvImport,
  useCsvIngestDatasets,
  useCsvIngestRollback,
  useCsvIngestUpload,
  useCsvIngestUploads,
} from './api'
import type { CsvImportData, CsvImportOverview } from './types'

vi.mock('./api')

// CSV 매핑·업로드 — KPI·매핑 표·검증 항목 표·콜아웃 렌더 + 소스 탭 전환 + 액션 토스트.

const studentProject: CsvImportData = {
  source: 'student-project',
  file: {
    fileName: '수강생 백필_2026-05.csv',
    detail: '2,340행 · UTF-8 · 쉼표 구분 · 헤더 포함',
  },
  summary: {
    uploadFiles: 3,
    uploadFilesHint: 'CSV 2 · XLSX 1',
    mappingConfidence: 87,
    unmappedFields: 6,
    validationErrors: 14,
    requiredValueErrors: 9,
    quarantineCandidates: 5,
    estimatedMinutes: 8,
    totalRows: 2340,
  },
  mappings: [
    {
      id: 'student_name',
      sourceField: 'student_name',
      domainField: 'StudentProfile.name',
      confidence: 98,
      status: 'confirmed',
      action: 'pin',
    },
    {
      id: 'github',
      sourceField: 'github',
      domainField: 'StudentProfile.githubUrl',
      confidence: 74,
      status: 'unmapped',
      action: 'select',
    },
  ],
  validations: [
    {
      id: 'required',
      item: '필수값',
      normal: 2331,
      error: 9,
      handling: 'quarantine',
    },
    {
      id: 'cohort',
      item: '기수 코드',
      normal: 2340,
      error: 0,
      handling: 'pass',
    },
  ],
}

const resume: CsvImportData = {
  source: 'resume',
  file: {
    fileName: '이력서 백필_2026-05.xlsx',
    detail: '640행 · UTF-8 · 쉼표 구분 · 헤더 포함',
  },
  summary: {
    uploadFiles: 1,
    uploadFilesHint: 'XLSX 1',
    mappingConfidence: 83,
    unmappedFields: 1,
    validationErrors: 3,
    requiredValueErrors: 1,
    quarantineCandidates: 1,
    estimatedMinutes: 2,
    totalRows: 640,
  },
  mappings: [
    {
      id: 'resume_title',
      sourceField: 'resume_title',
      domainField: 'Resume.title',
      confidence: 97,
      status: 'confirmed',
      action: 'pin',
    },
  ],
  validations: [
    {
      id: 'required',
      item: '필수값',
      normal: 639,
      error: 1,
      handling: 'quarantine',
    },
  ],
}

const overview: CsvImportOverview = {
  'student-project': studentProject,
  record: studentProject,
  resume,
}

function renderPage() {
  vi.mocked(useCsvImport).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCsvImport>)
  vi.mocked(useCsvIngestDatasets).mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof useCsvIngestDatasets>)
  vi.mocked(useCsvIngestUpload).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCsvIngestUpload>)
  vi.mocked(useCsvIngestUploads).mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof useCsvIngestUploads>)
  vi.mocked(useCsvIngestRollback).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCsvIngestRollback>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <CsvMappingPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('CsvMappingPage (CSV 매핑·업로드)', () => {
  it('KPI + 파일 + 매핑 표 + 검증 항목 + 콜아웃을 렌더한다', () => {
    renderPage()
    expect(screen.getByText('87%')).toBeInTheDocument()
    expect(screen.getByText('수강생 백필_2026-05.csv')).toBeInTheDocument()
    expect(screen.getByText('student_name')).toBeInTheDocument()
    expect(screen.getByText('StudentProfile.githubUrl')).toBeInTheDocument()
    // 매핑 상태 배지 + 검증 처리 배지
    expect(screen.getByText('미매핑')).toBeInTheDocument()
    expect(screen.getByText('필수값')).toBeInTheDocument()
    expect(
      screen.getByText(/검증 오류가 있는 행은 바로 반영하지 않고/),
    ).toBeInTheDocument()
  })

  it('이력서 탭 — 소스 데이터가 바뀐다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '이력서' }))
    expect(screen.getByText('이력서 백필_2026-05.xlsx')).toBeInTheDocument()
    expect(screen.getByText('resume_title')).toBeInTheDocument()
    expect(screen.queryByText('수강생 백필_2026-05.csv')).toBeNull()
  })

  it('업로드 시작 — 파일 미선택 시 선택 안내 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '업로드 시작' }))
    expect(
      await screen.findByText('업로드할 CSV 파일을 먼저 선택해 주세요.'),
    ).toBeInTheDocument()
  })
})
