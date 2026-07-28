import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TsCaseCard } from './TsCaseCard'
import type { TsCase } from '../types'

// 인증 완료 사례는 서버가 409로 막는다. 버튼을 숨기면 "왜 못 지우지"를 알 수 없고,
// 그대로 두면 눌러 보고 실패한다 — 비활성 + 이유가 정답.
const base: TsCase = {
  id: 'ts1',
  title: 'N+1 추적',
  category: 'DB',
  categoryTone: 'info',
  status: 'draft',
  statusLabel: '작성 중',
  completed: false,
  independent: true,
  days: '1일',
  situation: '상황',
  resolution: '해결',
  result: '결과',
  tags: [],
} as unknown as TsCase

describe('TsCaseCard 삭제 버튼', () => {
  it('사유가 없으면 눌러서 삭제할 수 있다', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(
      <TsCaseCard
        c={base}
        onOpen={vi.fn()}
        onRemove={onRemove}
        removeLabel="삭제"
      />,
    )

    await user.click(screen.getByRole('button', { name: /삭제/ }))

    expect(onRemove).toHaveBeenCalled()
  })

  it('사유가 있으면 비활성이고 이유를 알린다', () => {
    const onRemove = vi.fn()
    const reason = '인증 완료된 사례는 삭제할 수 없어요 — 변경 제안을 이용하세요'
    render(
      <TsCaseCard
        c={{ ...base, status: 'certified', statusLabel: '인증 완료' }}
        onOpen={vi.fn()}
        onRemove={onRemove}
        removeLabel="삭제"
        removeDisabledReason={reason}
      />,
    )

    const btn = screen.getByRole('button', { name: /삭제/ })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('title', reason)

    // disabled 버튼은 클릭 이벤트가 발생하지 않는다 — 핸들러가 불리지 않는 것만 확인한다.
    expect(onRemove).not.toHaveBeenCalled()
  })
})
