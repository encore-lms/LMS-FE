import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecordDetailBody } from './RecordDetailBody'
import {
  fetchRecordAttachment,
  useCertRecord,
  useStudyRecord,
} from '../../api/records'

vi.mock('../../api/records')

beforeEach(() => {
  // 이미지 미리보기는 원본을 받아 objectURL 로 띄운다 — 테스트에선 빈 blob 으로 충분하다.
  vi.mocked(fetchRecordAttachment).mockResolvedValue(new Blob())
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview')
  globalThis.URL.revokeObjectURL = vi.fn()
})

// QA: "스터디·자격증 상세에 제목·날짜만 나오고 내용이 없다."
// 모달이 목록 카드 데이터만 렌더하고 상세 API 를 부르지 않았다.
function mockQuery(data: unknown) {
  return { data, isPending: false, isError: false } as never
}
function mockIdle() {
  return { data: undefined, isPending: false, isError: false } as never
}

describe('RecordDetailBody', () => {
  it('스터디는 일정·활동 내역·증빙을 보여준다', () => {
    vi.mocked(useStudyRecord).mockReturnValue(
      mockQuery({
        title: '알고리즘 스터디',
        date: '2026-06-03',
        startTime: '20:00',
        endTime: '22:00',
        body: '그래프 탐색 문제 풀이와 리뷰',
        files: [{ id: 'f1', name: '스터디인증.png', size: '2.1MB' }],
      }),
    )
    vi.mocked(useCertRecord).mockReturnValue(mockIdle())

    render(<RecordDetailBody recordId="r1" category="study" />)

    expect(screen.getByText(/20:00~22:00/)).toBeInTheDocument()
    expect(screen.getByText('그래프 탐색 문제 풀이와 리뷰')).toBeInTheDocument()
    expect(screen.getByText('스터디인증.png')).toBeInTheDocument()
  })

  it('자격증은 종류와 증빙을 보여준다', () => {
    vi.mocked(useStudyRecord).mockReturnValue(mockIdle())
    vi.mocked(useCertRecord).mockReturnValue(
      mockQuery({
        certType: 'OTHER',
        title: '정보처리기사 필기 합격',
        otherCertName: '정보처리기사',
        files: [
          { id: 'f1', name: '합격화면.png', size: '1.2MB' },
          { id: 'f2', name: '성적표.pdf', size: '300KB' },
        ],
      }),
    )

    render(<RecordDetailBody recordId="r2" category="cert" />)

    expect(screen.getByText('정보처리기사')).toBeInTheDocument()
    // 증빙을 여러 장 올렸으면 전부 나와야 한다(예전에는 첫 장만 내려왔다).
    expect(screen.getByText('합격화면.png')).toBeInTheDocument()
    expect(screen.getByText('성적표.pdf')).toBeInTheDocument()
  })

  it('활동 내역이 비어 있으면 비었다고 알려준다', () => {
    vi.mocked(useStudyRecord).mockReturnValue(
      mockQuery({
        title: '스터디',
        date: '2026-06-03',
        startTime: '',
        endTime: '',
        body: '',
        files: [],
      }),
    )
    vi.mocked(useCertRecord).mockReturnValue(mockIdle())

    render(<RecordDetailBody recordId="r3" category="study" />)

    expect(screen.getByText('작성한 내용이 없어요')).toBeInTheDocument()
    expect(screen.getByText('첨부한 증빙이 없어요')).toBeInTheDocument()
  })
})
