import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CERTIFICATE_DEMO_STUDENTS } from '../demoStudents'
import { CertificateDemoStudentFab } from './CertificateDemoStudentFab'

describe('CertificateDemoStudentFab', () => {
  it('원형 버튼에서 5명 선택 패널을 열고 수강생을 선택한다', () => {
    const onSelect = vi.fn()
    render(
      <CertificateDemoStudentFab
        students={CERTIFICATE_DEMO_STUDENTS}
        selectedStudentId={CERTIFICATE_DEMO_STUDENTS[0].id}
        onSelect={onSelect}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: '시연 수강생 선택 · 현재 박준서',
      }),
    )

    expect(
      screen.getByRole('region', { name: '시연 수강생 선택 패널' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(4)

    fireEvent.click(screen.getByText('박채원').closest('button')!)
    expect(onSelect).toHaveBeenCalledWith(CERTIFICATE_DEMO_STUDENTS[1].id)
    expect(
      screen.queryByRole('region', { name: '시연 수강생 선택 패널' }),
    ).not.toBeInTheDocument()
  })

  it('원형 버튼을 잡고 빈 화면의 다른 위치로 옮길 수 있다', () => {
    const { getByRole } = render(
      <CertificateDemoStudentFab
        students={CERTIFICATE_DEMO_STUDENTS}
        selectedStudentId={CERTIFICATE_DEMO_STUDENTS[0].id}
        onSelect={vi.fn()}
      />,
    )
    const button = getByRole('button', {
      name: '시연 수강생 선택 · 현재 박준서',
    })
    const beforeLeft = button.style.left
    const beforeTop = button.style.top

    fireEvent(
      button,
      new MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 900,
        clientY: 700,
      }),
    )
    fireEvent(
      button,
      new MouseEvent('pointermove', {
        bubbles: true,
        clientX: 700,
        clientY: 500,
      }),
    )
    fireEvent(
      button,
      new MouseEvent('pointerup', {
        bubbles: true,
        clientX: 700,
        clientY: 500,
      }),
    )

    expect(button.style.left).not.toBe(beforeLeft)
    expect(button.style.top).not.toBe(beforeTop)
  })
})
