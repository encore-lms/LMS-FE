import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/Toast'
import { NoticeAttachmentList } from './NoticeAttachmentList'
import { downloadNoticeAttachment } from '@/shared/api'

vi.mock('@/shared/api', async (orig) => ({
  ...(await orig<typeof import('@/shared/api')>()),
  downloadNoticeAttachment: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => vi.mocked(downloadNoticeAttachment).mockClear())

const links = [{ id: 'l1', url: 'https://playdata.io/guide' }]
const files = [{ id: 'f1', fileName: '안내문.pdf', fileSize: 3145728 }]

function renderList(props: Partial<Parameters<typeof NoticeAttachmentList>[0]>) {
  render(
    <ToastProvider>
      <NoticeAttachmentList links={[]} files={[]} {...props} />
    </ToastProvider>,
  )
}

describe('NoticeAttachmentList', () => {
  it('붙은 게 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(
      <ToastProvider>
        <NoticeAttachmentList links={[]} files={[]} />
      </ToastProvider>,
    )
    expect(container.textContent).toBe('')
  })

  it('링크는 새 탭으로 여는 주소가 된다', () => {
    renderList({ links })
    const anchor = screen.getByRole('link', { name: 'https://playdata.io/guide' })
    expect(anchor).toHaveAttribute('href', 'https://playdata.io/guide')
    expect(anchor).toHaveAttribute('target', '_blank')
  })

  it('파일 크기를 읽기 쉬운 단위로 보여준다', () => {
    renderList({ files })
    expect(screen.getByText('3.0MB')).toBeInTheDocument()
  })

  it('수강생은 수강생 경로로 내려받는다', async () => {
    const user = userEvent.setup()
    renderList({ files })

    await user.click(screen.getByRole('button', { name: '안내문.pdf 내려받기' }))

    expect(downloadNoticeAttachment).toHaveBeenCalledWith(
      'f1',
      '안내문.pdf',
      'student',
    )
  })

  // 같은 파일이라도 경로가 갈린다 — BE 가 /student/** 를 STUDENT 로 잠가 둔다.
  it('강사·매니저는 운영 경로로 내려받는다', async () => {
    const user = userEvent.setup()
    renderList({ files, scope: 'staff' })

    await user.click(screen.getByRole('button', { name: '안내문.pdf 내려받기' }))

    expect(downloadNoticeAttachment).toHaveBeenCalledWith(
      'f1',
      '안내문.pdf',
      'staff',
    )
  })

  it('지울 수 있을 때만 삭제 버튼이 붙는다', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    renderList({ links, files, onRemove })

    await user.click(screen.getByRole('button', { name: '안내문.pdf 첨부 삭제' }))
    expect(onRemove).toHaveBeenCalledWith('f1')

    await user.click(
      screen.getByRole('button', { name: 'https://playdata.io/guide 첨부 삭제' }),
    )
    expect(onRemove).toHaveBeenCalledWith('l1')
  })
})
