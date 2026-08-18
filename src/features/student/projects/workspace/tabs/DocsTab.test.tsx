import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { mockWorkspace } from '../../mocks'
import type { WorkspaceData, WsDoc } from '../../types'
import { DocsTab } from './DocsTab'

vi.mock('../../../api/projects')

/**
 * 산출물 열람 — 등록된 링크로 실제로 갈 수 있어야 한다.
 *
 * <p>예전에는 링크 산출물에도 '다운로드'가 문서 메타로 만든 데모 txt 를 내려줬고, 정작
 * 등록된 URL 은 상세 어디에도 없었다. 검토자는 수정 버튼도 없어 링크에 닿을 길이 없었다.</p>
 */
const linkDoc: WsDoc = {
  id: 'a1',
  title: 'GitHub 저장소',
  meta: 'https://github.com/skn34-team1/job-stack-map',
  status: { label: '등록', tone: 'info' },
  category: 'API 명세',
  url: 'https://github.com/skn34-team1/job-stack-map',
  downloadUrl: null,
}
const fileDoc: WsDoc = {
  ...linkDoc,
  id: 'a2',
  title: '중간 발표자료',
  meta: 'PDF · 1.2MB',
  url: '',
  downloadUrl: '/student/projects/p1/artifacts/a2/file',
}

function renderTab(docs: WsDoc[], readOnly = false) {
  const d: WorkspaceData = { ...mockWorkspace, docs }
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ToastProvider>
        <DocsTab d={d} readOnly={readOnly} />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('DocsTab 산출물 상세', () => {
  it('링크 산출물은 링크로 연다 — 가짜 다운로드가 아니다', async () => {
    const user = userEvent.setup()
    renderTab([linkDoc])

    await user.click(screen.getByRole('button', { name: '열기' }))

    const link = screen.getByRole('link', { name: '링크 열기' })
    expect(link).toHaveAttribute('href', linkDoc.url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.queryByRole('button', { name: /다운로드/ })).toBeNull()
  })

  it('파일 산출물은 검토자에게 다운로드를 막고 이유를 말한다', async () => {
    const user = userEvent.setup()
    renderTab([fileDoc], true)

    await user.click(screen.getByRole('button', { name: '열기' }))

    const button = screen.getByRole('button', { name: /다운로드/ })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute(
      'title',
      '파일 본문은 수강생 화면에서만 내려받을 수 있어요.',
    )
  })
})
