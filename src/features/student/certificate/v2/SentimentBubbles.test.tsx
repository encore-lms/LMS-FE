import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Sentiment } from '../ai'
import { ANALYSIS_STUBS } from '../ai/stubs/analysis'
import { SentimentBubbles } from './SentimentBubbles'

const sentiment = ANALYSIS_STUBS['stu-001'].sentiment

const leftPercent = (element: Element | null) =>
  Number((element as HTMLElement | null)?.style.left.replace('%', ''))
const topPx = (element: Element | null) =>
  Number((element as HTMLElement | null)?.style.top.replace('px', ''))

describe('SentimentBubbles', () => {
  it('상담 순서와 감성 위치에 따라 버블을 배치한다', () => {
    const { container } = render(<SentimentBubbles sentiment={sentiment} />)

    expect(screen.getByText('AI 상담 감성·키워드 버블')).toBeInTheDocument()
    const chart = screen.getByRole('group', {
      name:
        sentiment.noteCount +
        '회 상담 순서와 긍정·중립·우려 위치로 배치한 감성 키워드 ' +
        sentiment.bubbles.length +
        '개. 크기는 빈도와 중요도',
    })
    expect(chart).toBeInTheDocument()

    // 축·레인·라벨은 HTML로 그린다 — SVG 좌표계에 글자 크기를 태우지 않는다.
    expect(container.querySelectorAll('svg')).toHaveLength(0)
    expect(container.querySelectorAll('[data-bubble-surface]')).toHaveLength(
      sentiment.bubbles.length,
    )
    expect(container.querySelectorAll('[data-sentiment-rail]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-bubble-label]')).toHaveLength(
      sentiment.bubbles.length,
    )
    expect(
      container.querySelectorAll('[data-consultation-order]'),
    ).toHaveLength(sentiment.bubbles.length)
    expect(container.querySelectorAll('[data-consultation-lane]')).toHaveLength(
      sentiment.noteCount,
    )
    expect(container.querySelectorAll('[data-signal-weight]')).toHaveLength(
      sentiment.bubbles.length,
    )
    expect(container.querySelectorAll('[data-phase]')).toHaveLength(0)
  })

  it('키워드 라벨은 뷰포트 폭과 무관한 고정 px 크기를 쓴다', () => {
    const { container } = render(<SentimentBubbles sentiment={sentiment} />)

    container
      .querySelectorAll<HTMLElement>('[data-bubble-surface]')
      .forEach((bubble) => {
        const fontSize = Number(bubble.style.fontSize.replace('px', ''))
        const diameter = Number(bubble.style.width.replace('px', ''))
        expect(fontSize).toBeGreaterThanOrEqual(10)
        expect(fontSize).toBeLessThanOrEqual(13)
        expect(diameter).toBeGreaterThanOrEqual(46)
        expect(diameter).toBeLessThanOrEqual(68)
        expect(bubble.style.height).toBe(bubble.style.width)
      })
  })

  it('버블은 실제 버튼이라 DOM 순서를 바꾸지 않고 키보드로 순회한다', () => {
    const { container } = render(<SentimentBubbles sentiment={sentiment} />)
    const order = () =>
      [...container.querySelectorAll('[data-bubble-index]')].map(
        (bubble) => (bubble as HTMLElement).dataset.bubbleIndex,
      )
    const before = order()

    const firstBubble = container.querySelector<HTMLButtonElement>(
      '[data-bubble-index]',
    )!
    expect(firstBubble.tagName.toLowerCase()).toBe('button')
    firstBubble.focus()

    expect(document.activeElement).toBe(firstBubble)
    // 포커스로 DOM 순서가 재정렬되면 Tab 순회가 끊긴다 — 순서는 항상 그대로다.
    expect(order()).toEqual(before)
    // 전면 강조는 재정렬 대신 z-index로 처리한다.
    expect(firstBubble.className).toContain('focus-visible:z-30')
    expect(firstBubble.className).toContain('focus-visible:ring-2')
  })

  it('버블을 선택하면 마스킹된 상담 근거를 1~2줄 이유로 안내한다', () => {
    const withEvidence: Sentiment = {
      ...sentiment,
      bubbles: sentiment.bubbles.map((bubble, index) =>
        index === 0
          ? {
              ...bubble,
              evidence: [
                {
                  code: 'counsel-1',
                  at: '2024-04-10T09:00:00',
                  excerpt:
                    '지원 직무를 정하지 못해 준비 방향이 흔들린다고 설명함',
                },
              ],
            }
          : bubble,
      ),
    }
    const { container } = render(<SentimentBubbles sentiment={withEvidence} />)

    expect(screen.getByText(/버블을 선택하면/)).toBeInTheDocument()
    const target = container.querySelector<HTMLButtonElement>(
      '[data-bubble-index="0"]',
    )!
    expect(target).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(target)

    const reason = screen.getByTestId('sentiment-keyword-reason')
    expect(reason).toHaveTextContent(
      `왜 ‘${withEvidence.bubbles[0].label}’ 키워드인가요?`,
    )
    expect(reason).toHaveTextContent(
      '지원 직무를 정하지 못해 준비 방향이 흔들린다고 설명함',
    )
    expect(reason.querySelector('p')).toHaveClass('line-clamp-2')
    expect(container.querySelector('[data-bubble-index="0"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(container.querySelector('[data-bubble-index="0"]')!)
    expect(screen.queryByTestId('sentiment-keyword-reason')).toBeNull()
  })

  it('상담 회차는 가로축으로, 긍정·중립·우려는 레인과 색으로 안내한다', () => {
    const { container } = render(<SentimentBubbles sentiment={sentiment} />)

    expect(screen.queryByText('초기')).not.toBeInTheDocument()
    expect(screen.queryByText('중기')).not.toBeInTheDocument()
    expect(screen.queryByText('후기')).not.toBeInTheDocument()

    const legend = screen.getByTestId('consultation-legend')
    expect(legend.children).toHaveLength(sentiment.noteCount)

    Array.from({ length: sentiment.noteCount }, (_, index) => index).forEach(
      (index) => {
        expect(screen.getAllByText(index + 1 + '차').length).toBeGreaterThan(0)
        const bubbles = container.querySelectorAll(
          '[data-consultation-order="' + (index + 1) + '"]',
        )
        expect(bubbles.length).toBeGreaterThanOrEqual(2)
        expect(bubbles.length).toBeLessThanOrEqual(3)
      },
    )

    expect(
      container.querySelectorAll('[data-sentiment-polarity="POSITIVE"]')[0],
    ).toHaveClass('bg-success')
    expect(
      container.querySelectorAll('[data-sentiment-polarity="NEUTRAL"]')[0],
    ).toHaveClass('bg-fg-muted')
    expect(
      container.querySelectorAll('[data-sentiment-polarity="CONCERN"]')[0],
    ).toHaveClass('bg-danger')

    // 감성은 레인이 결정한다 — 버블은 자기 레인 안에만 있다.
    POLARITY_ORDER_CASES.forEach((polarity) => {
      const rail = container.querySelector(
        `[data-sentiment-rail="${polarity}"]`,
      )!
      const inRail = rail.querySelectorAll(
        `[data-sentiment-polarity="${polarity}"]`,
      )
      const total = container.querySelectorAll(
        `[data-sentiment-polarity="${polarity}"]`,
      )
      expect(inRail.length).toBe(total.length)

      inRail.forEach((bubble) => {
        const diameter = Number(
          (bubble as HTMLElement).style.width.replace('px', ''),
        )
        const center = topPx(bubble)
        // 레인 높이 100px 안에 버블이 완전히 들어간다.
        expect(center - diameter / 2).toBeGreaterThanOrEqual(0)
        expect(center + diameter / 2).toBeLessThanOrEqual(100)
      })
    })

    expect(screen.getByText('크기 = 빈도/중요도')).toBeInTheDocument()
    expect(
      screen.getByText('가로 = 상담 차수 · 세로 = 감성'),
    ).toBeInTheDocument()
    container.querySelectorAll('[data-bubble-surface]').forEach((bubble) => {
      expect(bubble.getAttribute('title')).toMatch(
        /\d+차 상담 .* 상담 근거 \d+문장/,
      )
    })
  })

  it('버블 가로 위치는 배정된 상담 차수 칸 안에 머문다', () => {
    const { container } = render(<SentimentBubbles sentiment={sentiment} />)
    const cellWidth = 100 / sentiment.noteCount

    container
      .querySelectorAll<HTMLElement>('[data-consultation-order]')
      .forEach((bubble) => {
        const order = Number(bubble.dataset.consultationOrder)
        const left = leftPercent(bubble)
        expect(left).toBeGreaterThan((order - 1) * cellWidth)
        expect(left).toBeLessThan(order * cellWidth)
      })
  })

  it('상담 근거 날짜가 있으면 실제 날짜 순서로 배치한다', () => {
    const dated: Sentiment = {
      ...sentiment,
      noteCount: 3,
      bubbles: sentiment.bubbles.slice(0, 3).map((bubble, index) => {
        const evidence = [
          {
            code: 'counsel-2',
            at: '2024-05-10T09:00:00',
            excerpt: '두 번째 상담',
          },
          {
            code: 'counsel-1',
            at: '2024-04-10T09:00:00',
            excerpt: '첫 번째 상담',
          },
          {
            code: 'counsel-3',
            at: '2024-06-10T09:00:00',
            excerpt: '세 번째 상담',
          },
        ][index]
        return { ...bubble, evidence: [evidence] }
      }),
    }
    const { container } = render(<SentimentBubbles sentiment={dated} />)

    expect(screen.getByText('1차')).toBeInTheDocument()
    expect(screen.getByText('· 04.10')).toBeInTheDocument()
    expect(screen.getByText('· 05.10')).toBeInTheDocument()
    expect(screen.getByText('· 06.10')).toBeInTheDocument()

    const xByOrder = [1, 2, 3].map((order) =>
      leftPercent(
        container.querySelector('[data-consultation-order="' + order + '"]'),
      ),
    )
    expect(xByOrder[0]).toBeLessThan(xByOrder[1])
    expect(xByOrder[1]).toBeLessThan(xByOrder[2])
  })

  it('긴 키워드는 글자 크기를 줄이되 판독 하한(10px) 아래로는 내리지 않는다', () => {
    const fontSizeOfFirst = (value: Sentiment) => {
      const { container, unmount } = render(
        <SentimentBubbles sentiment={value} />,
      )
      const size = Number(
        container
          .querySelector<HTMLElement>('[data-bubble-index="0"]')!
          .style.fontSize.replace('px', ''),
      )
      unmount()
      return size
    }
    const longLabelSentiment: Sentiment = {
      ...sentiment,
      bubbles: sentiment.bubbles.map((bubble, index) =>
        index === 0 ? { ...bubble, label: '학습복구부담선행' } : bubble,
      ),
    }

    // 같은 버블(같은 신호 강도)에 긴 키워드가 오면 글자가 줄어든다.
    expect(fontSizeOfFirst(longLabelSentiment)).toBeLessThan(
      fontSizeOfFirst(sentiment),
    )
    // 다만 하한 아래로는 내리지 않고, 원 안에서 줄바꿈으로 담는다.
    expect(fontSizeOfFirst(longLabelSentiment)).toBe(10)

    const { container } = render(
      <SentimentBubbles sentiment={longLabelSentiment} />,
    )
    const long = container.querySelector<HTMLElement>(
      '[data-bubble-index="0"]',
    )!
    expect(long).toHaveTextContent('학습복구부담선행')
    expect(long.className).toContain('[overflow-wrap:anywhere]')
  })

  it('상담 흐름도 회차별 대표 키워드로 구성한다', () => {
    render(<SentimentBubbles sentiment={sentiment} />)

    expect(screen.getByText('상담 흐름')).toBeInTheDocument()
    expect(screen.getByText(/1차 .* → 2차 .* → 3차/)).toBeInTheDocument()
    expect(screen.queryByText(sentiment.trend)).not.toBeInTheDocument()
    expect(screen.queryByTestId('trend-bars')).not.toBeInTheDocument()
    expect(screen.queryByText('키워드 클러스터')).not.toBeInTheDocument()
  })

  it('숫자 감성점수가 이전 응답에 포함되어도 화면에 노출하지 않는다', () => {
    const legacy = {
      ...sentiment,
      bubbles: sentiment.bubbles.map((bubble) => ({
        ...bubble,
        sentimentScore: bubble.polarity === 'CONCERN' ? -90 : 90,
      })),
      phases: sentiment.phases.map((phase) => ({
        ...phase,
        toneScore: -23,
      })),
    } as unknown as Sentiment
    const { container } = render(<SentimentBubbles sentiment={legacy} />)

    expect(container.querySelector('[data-sentiment-score]')).toBeNull()
    expect(container.textContent).not.toContain('-90')
    expect(container.textContent).not.toContain('+90')
    expect(container.textContent).not.toContain('-23')
  })

  it('상담 근거가 없으면 버블을 만들지 않는다', () => {
    const notReady: Sentiment = {
      ...sentiment,
      status: 'NOT_READY',
      noteCount: 0,
      phases: [],
      bubbles: [],
    }
    render(<SentimentBubbles sentiment={notReady} />)

    expect(screen.getByText(/상담 기록이 없어/)).toBeInTheDocument()
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })
})

const POLARITY_ORDER_CASES = ['POSITIVE', 'NEUTRAL', 'CONCERN'] as const
