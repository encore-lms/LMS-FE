import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { ResumeDetail } from '../../resume/types'
import { ResumeTab } from './ResumeTab'

const detail: ResumeDetail = {
  id: 'resume-1',
  title: 'AI 엔지니어 이력서',
  status: '작성 완료',
  basicInfo: {
    name: '황수빈',
    phone: '010-0000-0000',
    email: 'subin@example.com',
    birth: '2000-01-01',
    githubUrl: 'github.com/subin',
    blogUrl: '',
  },
  strength: 'LLM 서비스 백엔드를 설계·운영한 경험',
  educations: [],
  careers: [],
  certificates: [],
  awards: [],
  trainings: [],
  activities: [],
  skills: ['Python'],
  projects: [],
  coverLetters: [],
  doneSections: ['기본정보'],
  updatedAt: '2026-08-01T09:00:00+09:00',
}

vi.mock('../../api/resume', () => ({
  useResumes: () => ({
    data: {
      resumes: [
        {
          id: 'resume-1',
          title: 'AI 엔지니어 이력서',
          status: '작성 완료',
          doneSections: ['기본정보'],
          updatedAt: '2026-08-01T09:00:00+09:00',
        },
      ],
      feedbackCount: 0,
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useResume: () => ({
    data: detail,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

describe('ResumeTab', () => {
  it('증명서 탭에서는 편집·관리 진입 버튼을 노출하지 않는다', () => {
    render(
      <MemoryRouter>
        <ResumeTab />
      </MemoryRouter>,
    )

    // 이력서 내용 자체는 그대로 보여 준다.
    expect(screen.getByText('황수빈')).toBeInTheDocument()
    // 증명서는 '보여지는 문서'라 편집 동선을 두지 않는다.
    expect(screen.queryByRole('link', { name: /이력서 편집/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /이력서 관리/ })).toBeNull()
  })
})
