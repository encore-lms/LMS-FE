import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/Toast'
import { LogImageField } from './LogImageField'
import { useUploadLogImage } from '../api/logs'

vi.mock('../api/logs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/logs')>()),
  useUploadLogImage: vi.fn(),
}))

// 첨부 이미지는 인증이 필요해 토큰 실린 요청으로 받아 그린다 — 테스트에선 그리기만 확인한다.
vi.mock('./LogImage', () => ({
  LogImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

// 이미지 항목 — 올린 즉시 서버에 저장하고 받은 id 를 답변 값으로 들고 있는다.
// 제출 전에 업로드가 끝나야 서버가 일지에 이을 수 있다(2026-08-06 QA).

function renderField(value: string, onChange = vi.fn()) {
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

    renderField('img-1,img-2')

    expect(screen.getAllByAltText('멘토링 사진 첨부')).toHaveLength(2)
  })

  it('업로드 성공 시 받은 id 를 값에 이어 붙인다', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      imageId: 'img-new',
      fileName: 'a.png',
      contentType: 'image/png',
      sizeBytes: 10,
    })
    vi.mocked(useUploadLogImage).mockReturnValue({
      mutateAsync,
    } as unknown as ReturnType<typeof useUploadLogImage>)
    const onChange = renderField('img-1')

    const user = userEvent.setup()
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('멘토링 사진 이미지 선택'), file)

    expect(mutateAsync).toHaveBeenCalledWith(file)
    expect(onChange).toHaveBeenCalledWith('img-1,img-new')
  })

  it('삭제 버튼은 그 id만 값에서 뺀다', async () => {
    vi.mocked(useUploadLogImage).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useUploadLogImage>)
    const onChange = renderField('img-1,img-2')

    const user = userEvent.setup()
    await user.click(screen.getAllByLabelText('멘토링 사진 첨부 삭제')[0])

    expect(onChange).toHaveBeenCalledWith('img-2')
  })
})
