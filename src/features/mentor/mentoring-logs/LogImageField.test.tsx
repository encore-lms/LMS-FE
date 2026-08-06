import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/Toast'
import { LogImageField } from './LogImageField'
import { useDeleteLogImage, useUploadLogImage } from '../api/logs'

vi.mock('../api/logs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/logs')>()),
  useUploadLogImage: vi.fn(),
  useDeleteLogImage: vi.fn(),
}))

// 첨부 이미지는 인증이 필요해 토큰 실린 요청으로 받아 그린다 — 테스트에선 그리기만 확인한다.
vi.mock('./LogImage', () => ({
  LogImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

// 이미지 항목 — 올린 즉시 서버에 저장하고 받은 id 를 답변 값으로 들고 있는다.
// 제출 전에 업로드가 끝나야 서버가 일지에 이을 수 있다(2026-08-06 QA).

// 값은 서버가 준 이미지 id(UUID) 목록이다 — 형식이 아닌 토큰은 첨부로 세지 않는다.
const ID1 = '1cbb2c73-1c7e-4b65-8227-851f1aa6ae0f'
const ID2 = '40e04744-7f02-4b29-842c-096d2776ef9d'
const ID_NEW = 'c91de82f-64f6-4b50-8522-9351c9bed970'

const deleteMutate = vi.fn()

function renderField(value: string, onChange = vi.fn()) {
  vi.mocked(useDeleteLogImage).mockReturnValue({
    mutate: deleteMutate,
  } as unknown as ReturnType<typeof useDeleteLogImage>)
  render(
    <ToastProvider>
      <LogImageField value={value} onChange={onChange} label="멘토링 사진" />
    </ToastProvider>,
  )
  return onChange
}

describe('LogImageField', () => {
  it('올린 이미지를 썸네일로 보여준다', () => {
    vi.mocked(useUploadLogImage).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useUploadLogImage>)

    renderField(`${ID1},${ID2}`)

    expect(screen.getAllByAltText('멘토링 사진 첨부')).toHaveLength(2)
  })

  it('업로드 성공 시 받은 id 를 값에 이어 붙인다', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      imageId: ID_NEW,
      fileName: 'a.png',
      contentType: 'image/png',
      sizeBytes: 10,
    })
    vi.mocked(useUploadLogImage).mockReturnValue({
      mutateAsync,
    } as unknown as ReturnType<typeof useUploadLogImage>)
    const onChange = renderField(ID1)

    const user = userEvent.setup()
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('멘토링 사진 이미지 선택'), file)

    expect(mutateAsync).toHaveBeenCalledWith(file)
    expect(onChange).toHaveBeenCalledWith(`${ID1},${ID_NEW}`)
  })

  // 폐기한 'text_image' 시절 첨부 대신 적어 둔 메모가 값에 남아 있다.
  it('옛 텍스트는 첨부로 세지 않고 값에서도 지우지 않는다', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      imageId: ID_NEW,
      fileName: 'a.png',
      contentType: 'image/png',
      sizeBytes: 10,
    })
    vi.mocked(useUploadLogImage).mockReturnValue({
      mutateAsync,
    } as unknown as ReturnType<typeof useUploadLogImage>)
    const onChange = renderField('증빙자료 첨부 불가능')

    expect(screen.queryByAltText('멘토링 사진 첨부')).toBeNull()
    expect(screen.getByText(/증빙자료 첨부 불가능/)).toBeInTheDocument()

    const user = userEvent.setup()
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('멘토링 사진 이미지 선택'), file)

    expect(onChange).toHaveBeenCalledWith(`${ID_NEW},증빙자료 첨부 불가능`)
  })

  it('삭제 버튼은 그 id만 값에서 뺀다', async () => {
    vi.mocked(useUploadLogImage).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useUploadLogImage>)
    const onChange = renderField(`${ID1},${ID2}`)

    const user = userEvent.setup()
    await user.click(screen.getAllByLabelText('멘토링 사진 첨부 삭제')[0])

    expect(onChange).toHaveBeenCalledWith(ID2)
    // 값에서만 빼면 업로드한 파일이 서버에 남는다(2026-08-06).
    expect(deleteMutate).toHaveBeenCalledWith(ID1, expect.anything())
  })
})
