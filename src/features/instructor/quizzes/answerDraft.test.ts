import { describe, expect, it } from 'vitest'
import {
  buildAnswerPayload,
  distributeBlankScores,
  parseAnswerDraft,
  emptyAnswer,
} from './answerDraft'

// 유형별 정답 페이로드 빌더 — §7 퀴즈·§10 템플릿 공용 검증 규칙.
describe('buildAnswerPayload', () => {
  it('객관식: 빈 보기를 걸러내고 정답 index를 전송 목록 기준으로 다시 센다', () => {
    const r = buildAnswerPayload('multiple_choice', '문항', 10, {
      ...emptyAnswer(),
      choices: ['스택', '', '큐'],
      answerIndex: 2,
    })
    expect(r).toEqual({
      ok: true,
      fields: { choices: ['스택', '큐'], answerIndex: 1 },
    })
  })

  it('객관식: 보기 2개 미만·빈 정답 보기는 거부한다', () => {
    expect(
      buildAnswerPayload('multiple_choice', '문항', 10, {
        ...emptyAnswer(),
        choices: ['스택', ''],
        answerIndex: 0,
      }),
    ).toEqual({ ok: false, error: '보기를 2개 이상 입력해 주세요' })
    expect(
      buildAnswerPayload('multiple_choice', '문항', 10, {
        ...emptyAnswer(),
        choices: ['스택', '큐', ''],
        answerIndex: 2,
      }),
    ).toEqual({
      ok: false,
      error: '정답으로 선택한 보기의 내용을 입력해 주세요',
    })
  })

  it('단답형: 정답 필수, 서술형: 채점 기준 선택', () => {
    expect(
      buildAnswerPayload('short_answer', '문항', 10, {
        ...emptyAnswer(),
        answerText: ' ',
      }),
    ).toEqual({ ok: false, error: '정답을 입력해 주세요' })
    expect(buildAnswerPayload('essay', '문항', 10, emptyAnswer())).toEqual({
      ok: true,
      fields: { answerText: '' },
    })
  })

  it('빈칸: ___ 개수만큼 정답·배점을 요구하고 배점 합=배점을 검증한다', () => {
    const draft = {
      ...emptyAnswer(),
      answers: ['스택', '큐'],
      blankScores: [3, 7],
    }
    expect(buildAnswerPayload('fill_blank', '___와 ___', 10, draft)).toEqual({
      ok: true,
      fields: { answers: ['스택', '큐'], blankScores: [3, 7] },
    })
    expect(buildAnswerPayload('fill_blank', '빈칸 없음', 10, draft)).toEqual({
      ok: false,
      error: '문항 내용에 빈칸(___)을 넣어 주세요',
    })
    expect(
      buildAnswerPayload('fill_blank', '___와 ___', 10, {
        ...draft,
        blankScores: [3, 3],
      }),
    ).toEqual({ ok: false, error: '빈칸 배점 합(6)이 배점(10)과 달라요' })
    expect(
      buildAnswerPayload('fill_blank', '___와 ___', 10, {
        ...draft,
        answers: ['스택'],
      }),
    ).toEqual({ ok: false, error: '빈칸 2 정답을 입력해 주세요' })
  })
})

describe('parseAnswerDraft', () => {
  it('저장된 문항의 choices/answerKey를 편집 상태로 복원한다', () => {
    expect(
      parseAnswerDraft('multiple_choice', ['스택', '큐'], '1'),
    ).toMatchObject({ choices: ['스택', '큐'], answerIndex: 1 })
    expect(parseAnswerDraft('short_answer', undefined, 'LIFO')).toMatchObject({
      answerText: 'LIFO',
    })
    expect(
      parseAnswerDraft(
        'fill_blank',
        undefined,
        '{"answers":["스택","큐"],"scores":[3,7]}',
      ),
    ).toMatchObject({ answers: ['스택', '큐'], blankScores: [3, 7] })
  })
})

describe('distributeBlankScores', () => {
  it('균등 분배 + 나머지는 뒤 칸에 +1', () => {
    expect(distributeBlankScores(10, 3)).toEqual([3, 3, 4])
    expect(distributeBlankScores(2, 3)).toEqual([1, 1, 1])
  })
})
