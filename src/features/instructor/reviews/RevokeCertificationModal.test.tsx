import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  REVOKE_PHRASE,
  RevokeCertificationModal,
} from './RevokeCertificationModal'

// 인증 취소는 되돌릴 수 없다 — 수강생 쪽에서 인증이 사라지고 인증 이력도 지워진다.
// 버튼 한 번으로 처리되면 실수로 누른 것과 구분되지 않으므로 확인 문구를 요구한다.
function renderModal(onConfirm = vi.fn()) {
  render(
    <RevokeCertificationModal
      open
      targetName="팀 Nexus · 데이터 파이프라인"
      onClose={vi.fn()}
      onConfirm={onConfirm}
    />,
  )
  return onConfirm
}

const submitButton = () =>
  screen.getAllByRole('button', { name: '인증 취소' }).at(-1)!

describe('RevokeCertificationModal', () => {
  it('무엇을 취소하는지 이름으로 보여준다', () => {
    renderModal()
    expect(screen.getByText('팀 Nexus · 데이터 파이프라인')).toBeInTheDocument()
  })

  it('사유와 확인 문구가 모두 채워져야 진행할 수 있다', async () => {
    const user = userEvent.setup()
    renderModal()
    expect(submitButton()).toBeDisabled()

    await user.type(
      screen.getByPlaceholderText(/왜 취소하는지/),
      '산출물 링크가 깨졌습니다',
    )
    expect(submitButton()).toBeDisabled() // 사유만으로는 부족

    await user.type(screen.getByPlaceholderText(REVOKE_PHRASE), REVOKE_PHRASE)
    expect(submitButton()).toBeEnabled()
  })

  it('문구가 다르면 오류를 알리고 막는다', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByPlaceholderText(/왜 취소하는지/), '사유')
    await user.type(screen.getByPlaceholderText(REVOKE_PHRASE), '인증 취소')

    expect(screen.getByText('문구가 일치하지 않습니다.')).toBeInTheDocument()
    expect(submitButton()).toBeDisabled()
  })

  it('확인하면 사유를 넘긴다', async () => {
    const user = userEvent.setup()
    const onConfirm = renderModal()
    await user.type(screen.getByPlaceholderText(/왜 취소하는지/), '재확인 필요')
    await user.type(screen.getByPlaceholderText(REVOKE_PHRASE), REVOKE_PHRASE)
    await user.click(submitButton())

    expect(onConfirm).toHaveBeenCalledWith('재확인 필요')
  })
})
