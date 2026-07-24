import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DateTimePicker } from './DateTimePicker'

function rect({
  top,
  left,
  width,
  height,
}: {
  top: number
  left: number
  width: number
  height: number
}): DOMRect {
  return {
    x: left,
    y: top,
    top,
    left,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({}),
  }
}

const originalInnerWidth = window.innerWidth
const originalInnerHeight = window.innerHeight

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  })
}

afterEach(() => {
  setViewport(originalInnerWidth, originalInnerHeight)
})

describe('DateTimePicker popover positioning', () => {
  it('좁은 화면에서는 패널 너비를 뷰포트 안으로 제한한다', () => {
    setViewport(280, 640)
    render(
      <DateTimePicker value="" onChange={() => {}} ariaLabel="희망 날짜" />,
    )
    const trigger = screen.getByRole('button', { name: '희망 날짜' })
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(
      rect({ top: 100, left: 220, width: 40, height: 44 }),
    )

    fireEvent.click(trigger)

    const panel = screen.getByRole('dialog')
    expect(panel).toHaveStyle({
      left: '8px',
      width: '264px',
    })
  })

  it('위아래 공간이 모두 부족하면 더 넓은 쪽에 두고 스크롤 가능하게 제한한다', () => {
    setViewport(280, 320)
    render(
      <DateTimePicker value="" onChange={() => {}} ariaLabel="희망 날짜" />,
    )
    const trigger = screen.getByRole('button', { name: '희망 날짜' })
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(
      rect({ top: 140, left: 20, width: 240, height: 44 }),
    )

    fireEvent.click(trigger)

    const panel = screen.getByRole('dialog')
    expect(panel).toHaveStyle({
      top: '8px',
      maxHeight: '126px',
      overflowY: 'auto',
    })
  })
})
