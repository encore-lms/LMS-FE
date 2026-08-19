import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { projectKeys } from '../../projects/queryKeys'
import { CaseContentForm } from './CaseContentForm'

const createMutate = vi.fn()
vi.mock('../../api/troubleshooting', () => ({
  useCreateTsCase: () => ({ mutate: createMutate, isPending: false }),
  useUpdateTsCase: () => ({ mutate: vi.fn(), isPending: false }),
  useUploadTsAttachment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTsAttachment: () => ({ mutate: vi.fn(), isPending: false }),
  useRequestTsCertification: () => ({ mutate: vi.fn(), isPending: false }),
  useTsCase: () => ({ data: undefined, isPending: false, isError: false }),
}))

/**
 * 저장 후 프로젝트 이슈 탭 갱신.
 *
 * <p>사례를 저장하면 그 프로젝트의 이슈 탭 목록이 달라진다. 워크스페이스 캐시를 그대로 두면
 * 저장하고 돌아간 이슈 탭에 방금 쓴 사례가 없다 — 팀원과 검토자 화면에는 보이는데
 * 정작 작성자만 못 보는 상태가 된다.</p>
 */
describe('CaseContentForm 저장', () => {
  it('저장하면 연결된 프로젝트의 워크스페이스 캐시를 비운다', async () => {
    const user = userEvent.setup()
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const spy = vi.spyOn(client, 'invalidateQueries')
    createMutate.mockImplementation((_body, opts) =>
      opts?.onSuccess?.({ id: 'ts-real-1' }),
    )

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ToastProvider>
            <CaseContentForm
              caseId="ts_abc12"
              projectLink={{ projectId: 'p1', projectTitle: '구독 서비스' }}
              projectLocked
              returnTo="/student/projects/p1?tab=issues"
              onConnectProject={vi.fn()}
            />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: /작성 완료/ }))

    expect(spy).toHaveBeenCalledWith({
      queryKey: projectKeys.workspace('p1'),
    })
  })
})
