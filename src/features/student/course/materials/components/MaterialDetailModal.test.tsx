import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MaterialDetailModal } from './MaterialDetailModal'
import { MaterialRow } from './MaterialRow'
import { EditMaterialModal } from './EditMaterialModal'
import { ToastProvider } from '@/components/ui/Toast'
import type { MaterialItem } from '../../types'

// 목록에 버튼이 늘어서 있으면 내용을 보기도 전에 무엇을 누를지 골라야 했다 —
// 행 클릭으로 상세를 열고, 다운로드·링크 열기·삭제는 상세 안에서만 한다.
vi.mock('../../../api/course', () => ({
  downloadCourseMaterialFile: vi.fn().mockResolvedValue(undefined),
  useUpdateMaterial: () => ({ mutate: vi.fn(), isPending: false }),
}))

const base: MaterialItem = {
  id: 'm1',
  fileType: 'DOC',
  title: 'JPA N+1 정리',
  body: '조회 로그와 함께 정리했습니다.',
  author: '박수진',
  timeAgo: '오늘',
  favorited: false,
  canPreview: false,
  isExternalLink: false,
  hasFile: true,
  fileName: 'jpa.txt',
  sizeLabel: '12KB',
  fileUrl: undefined,
  ownedByMe: true,
}

function renderModal(item: MaterialItem, onDelete = vi.fn()) {
  render(
    <ToastProvider>
      <MaterialDetailModal item={item} onClose={vi.fn()} onDelete={onDelete} />
    </ToastProvider>,
  )
  return onDelete
}

describe('MaterialRow', () => {
  it('행에는 다운로드·링크 열기 버튼을 두지 않는다', () => {
    render(
      <MaterialRow item={base} onToggleFavorite={vi.fn()} onOpen={vi.fn()} />,
    )
    expect(screen.queryByRole('button', { name: '다운로드' })).toBeNull()
    expect(screen.queryByRole('button', { name: '링크 열기' })).toBeNull()
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull()
  })

  it('행을 클릭하면 상세 대상으로 넘긴다', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<MaterialRow item={base} onToggleFavorite={vi.fn()} onOpen={onOpen} />)

    await user.click(screen.getByText('JPA N+1 정리'))

    expect(onOpen).toHaveBeenCalledWith(base)
  })

  it('즐겨찾기는 행 클릭과 겹치지 않는다', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const onToggleFavorite = vi.fn()
    render(
      <MaterialRow
        item={base}
        onToggleFavorite={onToggleFavorite}
        onOpen={onOpen}
      />,
    )

    await user.click(screen.getByRole('button', { name: '즐겨찾기' }))

    expect(onToggleFavorite).toHaveBeenCalledWith('m1')
    expect(onOpen).not.toHaveBeenCalled()
  })
})

describe('MaterialDetailModal', () => {
  it('상세 내용과 파일 정보를 보여준다', () => {
    renderModal(base)
    expect(screen.getByText('조회 로그와 함께 정리했습니다.')).toBeInTheDocument()
    expect(screen.getByText('박수진')).toBeInTheDocument()
    expect(screen.getByText('jpa.txt')).toBeInTheDocument()
    expect(screen.getByText('12KB')).toBeInTheDocument()
  })

  it('파일 자료는 다운로드, 링크 자료는 링크 열기를 노출한다', () => {
    const { unmount } = render(
      <ToastProvider>
        <MaterialDetailModal item={base} onClose={vi.fn()} />
      </ToastProvider>,
    )
    expect(screen.getByRole('button', { name: '다운로드' })).toBeInTheDocument()
    unmount()

    renderModal({
      ...base,
      fileType: 'LINK',
      isExternalLink: true,
      hasFile: false,
      fileUrl: 'https://example.com/doc',
    })
    expect(screen.getByRole('button', { name: '링크 열기' })).toBeInTheDocument()
  })

  it('본인 자료가 아니면 수정·삭제를 노출하지 않는다', () => {
    render(
      <ToastProvider>
        <MaterialDetailModal
          item={{ ...base, ownedByMe: false }}
          onClose={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
        />
      </ToastProvider>,
    )
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull()
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull()
  })

  it('본인 자료면 수정을 열 수 있다', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <ToastProvider>
        <MaterialDetailModal item={base} onClose={vi.fn()} onEdit={onEdit} />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(onEdit).toHaveBeenCalledWith(base)
  })

  it('설명을 상세에 보여준다', () => {
    renderModal(base)
    // 공유 폼의 설명이 서버에 저장되지 않아 늘 비어 있던 자리다.
    expect(screen.getByText('조회 로그와 함께 정리했습니다.')).toBeInTheDocument()
  })
})

describe('EditMaterialModal', () => {
  it('파일 자료는 첨부 교체만, 링크 입력은 보이지 않는다', () => {
    render(
      <ToastProvider>
        <EditMaterialModal item={base} onClose={vi.fn()} />
      </ToastProvider>,
    )
    // 형식 전환을 허용하면 목록 배지·아이콘·다운로드 경로와 어긋난다.
    expect(screen.getByText('파일 업로드')).toBeInTheDocument()
    expect(screen.getByText('공유 형식은 바꿀 수 없어요')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/github.com/)).toBeNull()
  })

  it('링크 자료는 링크 입력만, 파일 드롭존은 보이지 않는다', () => {
    render(
      <ToastProvider>
        <EditMaterialModal
          item={{
            ...base,
            fileType: 'LINK',
            isExternalLink: true,
            hasFile: false,
            fileUrl: 'https://example.com/doc',
          }}
          onClose={vi.fn()}
        />
      </ToastProvider>,
    )
    expect(screen.getByText('링크 공유')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/github.com/)).toBeInTheDocument()
    expect(screen.queryByText(/드래그하거나 클릭/)).toBeNull()
  })

  it('현재 첨부를 보여주고 바꾸지 않으면 유지된다고 알린다', () => {
    render(
      <ToastProvider>
        <EditMaterialModal item={base} onClose={vi.fn()} />
      </ToastProvider>,
    )
    expect(screen.getByText('jpa.txt')).toBeInTheDocument()
    expect(
      screen.getByText(/바꾸지 않으면 그대로 유지/),
    ).toBeInTheDocument()
  })
})
