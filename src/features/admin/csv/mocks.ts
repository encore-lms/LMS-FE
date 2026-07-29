import { http, HttpResponse } from 'msw'
import type { CsvImportData, CsvImportOverview } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 학생/프로젝트 인입 (Figma 1521:10678 정본) ──
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
      id: 'email',
      sourceField: 'email',
      domainField: 'User.email',
      confidence: 96,
      status: 'confirmed',
      action: 'pin',
    },
    {
      id: 'hrd_id',
      sourceField: 'hrd_id',
      domainField: 'StudentProfile.hrdId',
      confidence: 91,
      status: 'check',
      action: 'edit',
    },
    {
      id: 'project_title',
      sourceField: 'project_title',
      domainField: 'Project.title',
      confidence: 82,
      status: 'candidate',
      action: 'review',
    },
    {
      id: 'github',
      sourceField: 'github',
      domainField: 'StudentProfile.githubUrl',
      confidence: 74,
      status: 'unmapped',
      action: 'select',
    },
    {
      id: 'cohort_code',
      sourceField: 'cohort_code',
      domainField: 'Cohort.code',
      confidence: 99,
      status: 'confirmed',
      action: 'pin',
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
      id: 'email',
      item: '이메일 형식',
      normal: 2338,
      error: 2,
      handling: 'fix_needed',
    },
    {
      id: 'cohort',
      item: '기수 코드',
      normal: 2340,
      error: 0,
      handling: 'pass',
    },
    {
      id: 'duplicate',
      item: '중복 계정',
      normal: 2337,
      error: 3,
      handling: 'ops_check',
    },
  ],
}

// ── 기록실 인입 (소스 변형 — mock 가정) ──
const record: CsvImportData = {
  source: 'record',
  file: {
    fileName: '기록실 백필_2026-05.csv',
    detail: '1,120행 · UTF-8 · 쉼표 구분 · 헤더 포함',
  },
  summary: {
    uploadFiles: 1,
    uploadFilesHint: 'CSV 1',
    mappingConfidence: 84,
    unmappedFields: 2,
    validationErrors: 8,
    requiredValueErrors: 3,
    quarantineCandidates: 3,
    estimatedMinutes: 4,
    totalRows: 1120,
  },
  mappings: [
    {
      id: 'blog_url',
      sourceField: 'blog_url',
      domainField: 'RecordRoom.blogUrl',
      confidence: 95,
      status: 'confirmed',
      action: 'pin',
    },
    {
      id: 'week_no',
      sourceField: 'week_no',
      domainField: 'RecordRoom.week',
      confidence: 88,
      status: 'check',
      action: 'edit',
    },
    {
      id: 'record_type',
      sourceField: 'record_type',
      domainField: 'RecordRoom.type',
      confidence: 70,
      status: 'candidate',
      action: 'review',
    },
  ],
  validations: [
    {
      id: 'required',
      item: '필수값',
      normal: 1117,
      error: 3,
      handling: 'quarantine',
    },
    {
      id: 'url',
      item: 'URL 형식',
      normal: 1115,
      error: 5,
      handling: 'fix_needed',
    },
    { id: 'week', item: '주차 범위', normal: 1120, error: 0, handling: 'pass' },
  ],
}

// ── 이력서 인입 (소스 변형 — mock 가정) ──
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
    {
      id: 'target_job',
      sourceField: 'target_job',
      domainField: 'Resume.targetJob',
      confidence: 80,
      status: 'candidate',
      action: 'review',
    },
    {
      id: 'portfolio_url',
      sourceField: 'portfolio_url',
      domainField: 'Resume.portfolioUrl',
      confidence: 72,
      status: 'unmapped',
      action: 'select',
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
    {
      id: 'duplicate',
      item: '중복 제출',
      normal: 638,
      error: 2,
      handling: 'ops_check',
    },
  ],
}

const overview: CsvImportOverview = {
  'student-project': studentProject,
  record,
  resume,
}

export const handlers = [
  http.get('/api/admin/csv-mapping', () => ok<CsvImportOverview>(overview)),
]
