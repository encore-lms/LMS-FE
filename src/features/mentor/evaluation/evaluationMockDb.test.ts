import { describe, expect, it } from 'vitest'
import {
  buildEvaluationsData,
  buildRecommendationsData,
  buildTeamEvaluationSheet,
  buildTeamRecommendationSheet,
  mentorDb,
  saveEvaluationDraft,
  saveRecommendationDraft,
  submitEvaluation,
  submitRecommendation,
} from '../mockDb'
import type { MentorEvaluationDraftPayload } from '../types'

// 상태형 mock 검증 — 정책 완화(2026-08-04): 상시 작성(N시간·평가선행 게이트 폐기),
// 전원 5축+줄글 필수 · 제출본 draft 덮어쓰기 409(수정은 재제출) · 재제출 = 마지막 제출본 유효.
// 모듈 상태 공유 — it 순차 실행 전제(M3 logsMockDb 선례).

const teamOf = (teamId: string) =>
  mentorDb.teams.find((t) => t.teamId === teamId)!

/** 데이터마트 팀(4명) 전원 완료 payload — 제출 성공 경로용. */
const completePayload = (): MentorEvaluationDraftPayload => ({
  entries: teamOf('team_dm').members.map((m) => ({
    studentId: m.studentId,
    scores: [5, 4, 5, 4, 5],
    comment: `${m.name} — 역할 수행과 협업 태도 모두 안정적입니다.`,
  })),
})

describe('evaluation mockDb', () => {
  it('sheet — N시간 미완료 팀도 상시 평가 가능, 평가 필요 팀은 초안 병합', () => {
    // 추천시스템 팀 — 인정 8h / 배정 12h 여도 상시 작성 가능(잠금 없음)
    const anytime = buildTeamEvaluationSheet('team_rec')!
    expect(anytime.eligible).toBe(true)
    expect(anytime.status).toBe('draft')
    expect(anytime.eligibleLabel).toBe('상시 평가 가능')
    expect(anytime.lockReasonLabel).toBeNull()
    // 데이터마트 팀 — N시간 완료(10/10) + 작성 중 초안 시드(2명 완료)
    const sheet = buildTeamEvaluationSheet('team_dm')!
    expect(sheet.eligible).toBe(true)
    expect(sheet.status).toBe('draft')
    expect(sheet.eligibleLabel).toBe('N시간 완료 · 평가 가능')
    expect(sheet.members[0].comment).not.toBe('')
    expect(sheet.members[2].scores[2]).toBeNull()
    // NLP 분석 팀 — 기제출(값 채워진 폼으로 재진입)
    expect(buildTeamEvaluationSheet('team_nlp')!.status).toBe('submitted')
    expect(buildTeamEvaluationSheet('team_unknown')).toBeNull()
  })

  it('draft 저장 — 미충족 팀도 저장 가능 · 제출 팀만 409(재제출로 수정)', () => {
    // N시간 미완료 팀 — 상시 작성이라 초안 저장도 허용
    const anytimeSave = saveEvaluationDraft('team_rec', { entries: [] })
    expect(anytimeSave.ok).toBe(true)
    const submittedSave = saveEvaluationDraft('team_nlp', { entries: [] })
    expect(submittedSave.ok).toBe(false)
    if (!submittedSave.ok) {
      expect(submittedSave.status).toBe(409)
      expect(submittedSave.code).toBe('MENTOR_EVALUATION_ALREADY_SUBMITTED')
    }
    const saved = saveEvaluationDraft('team_dm', {
      entries: [
        {
          studentId: 'stu_kim_n',
          scores: [5, 4, 4, 4, 4],
          comment: '백엔드 안정화 기여',
        },
      ],
    })
    expect(saved.ok).toBe(true)
    if (saved.ok) {
      const kim = saved.sheet.members.find((m) => m.studentId === 'stu_kim_n')!
      expect(kim.comment).toBe('백엔드 안정화 기여')
      // payload 에 없는 팀원은 빈 입력으로 정규화(부분 저장 허용)
      expect(
        saved.sheet.members.find((m) => m.studentId === 'stu_seo')!.comment,
      ).toBe('')
    }
  })

  it('제출 — 줄글 미입력 422 차단, 재제출 허용(마지막 제출본 유효) + 상시 수정 라벨', () => {
    const incomplete = completePayload()
    incomplete.entries[3].comment = '   '
    const blocked = submitEvaluation('team_dm', incomplete)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.status).toBe(422)
      expect(blocked.code).toBe('MENTOR_EVALUATION_REQUIRED_FIELD_MISSING')
      expect(blocked.message).toContain('1명 미완료')
    }
    expect(mentorDb.evaluations).toHaveLength(1) // NLP 1건 그대로

    const submitted = submitEvaluation('team_dm', completePayload())
    expect(submitted.ok).toBe(true)
    if (submitted.ok) expect(submitted.sheet.status).toBe('submitted')
    // 제출본 draft 덮어쓰기는 409 — 수정은 재제출로만
    expect(saveEvaluationDraft('team_dm', { entries: [] }).ok).toBe(false)
    // 재제출 허용 — 점수 수정본이 마지막 제출본으로 교체(팀당 1건 유지)
    const revised = completePayload()
    revised.entries[0].scores = [3, 3, 3, 3, 3]
    const resubmit = submitEvaluation('team_dm', revised)
    expect(resubmit.ok).toBe(true)
    if (resubmit.ok) {
      expect(resubmit.sheet.status).toBe('submitted')
      expect(resubmit.sheet.members[0].scores).toEqual([3, 3, 3, 3, 3])
    }
    expect(
      mentorDb.evaluations.filter((e) => e.teamId === 'team_dm'),
    ).toHaveLength(1)
    // 추천 제출 전까지 팀 상태는 평가 필요 유지(활동 인정 요건 = 평가 + 추천)
    expect(teamOf('team_dm').status).toBe('evaluation_needed')
    // 제출 요약 — 최신 제출 우선 + 코멘트 전원 작성 + 상시 수정 라벨(24h 마감 폐기)
    const { submissions } = buildEvaluationsData()
    expect(submissions[0].teamId).toBe('team_dm')
    expect(submissions[0].targetCount).toBe(4)
    expect(submissions[0].commentsLabel).toBe('4명 모두 작성')
    expect(submissions[0].editDeadlineLabel).toBe('상시 수정 가능')
    // NLP 기제출 — 축별 평균 파생(기술 4 · 책임감 4.2 …)
    const nlp = submissions.find((s) => s.teamId === 'team_nlp')!
    expect(nlp.axisAverages.map((a) => a.value)).toEqual([
      4, 4.2, 4.4, 4.4, 4.4,
    ])
  })

  it('추천 — 평가와 독립(상시), 단일 선택·요약 필수 검증, 재제출 = 마지막 제출본 유효', () => {
    // 평가 미제출 팀 — 잠금 없이 폼 상태 + draft 저장 허용, 후보 점수는 미작성(null)
    const tsSheet = buildTeamRecommendationSheet('team_ts')!
    expect(tsSheet.status).toBe('not_started')
    expect(tsSheet.candidates[0].average).toBeNull()
    expect(tsSheet.teamAverage).toBeNull()
    const anytimeDraft = saveRecommendationDraft('team_ts', {
      mode: 'none',
      studentId: null,
      summary: '',
      notify: true,
    })
    expect(anytimeDraft.ok).toBe(true)

    // 평가 제출 완료 팀(team_dm) — 후보에 평가 평균·5축 점수 파생(재제출 반영본)
    const sheet = buildTeamRecommendationSheet('team_dm')!
    expect(sheet.status).toBe('not_started')
    expect(sheet.candidates[0].average).toBe(3) // 재제출본 [3,3,3,3,3]
    expect(sheet.candidates[1].average).toBe(4.6) // [5,4,5,4,5]

    // 검증 — 모드 미선택 / 대상 미선택 / 요약 미입력(명세 코드)
    const noMode = submitRecommendation('team_dm', {
      mode: null,
      studentId: null,
      summary: '',
      notify: true,
    })
    expect(noMode.ok).toBe(false)
    if (!noMode.ok)
      expect(noMode.code).toBe('MENTOR_RECOMMENDATION_MODE_REQUIRED')
    const noTarget = submitRecommendation('team_dm', {
      mode: 'recommend',
      studentId: null,
      summary: '요약',
      notify: true,
    })
    expect(noTarget.ok).toBe(false)
    if (!noTarget.ok)
      expect(noTarget.code).toBe('MENTOR_RECOMMENDATION_TARGET_REQUIRED')
    const noSummary = submitRecommendation('team_dm', {
      mode: 'recommend',
      studentId: 'stu_seo',
      summary: '  ',
      notify: true,
    })
    expect(noSummary.ok).toBe(false)
    if (!noSummary.ok)
      expect(noSummary.code).toBe('MENTOR_RECOMMENDATION_SUMMARY_REQUIRED')

    // 제출 성공 — submitted_recommended + 팀 완료 전이
    const ok = submitRecommendation('team_dm', {
      mode: 'recommend',
      studentId: 'stu_seo',
      summary:
        '집계 마트 성능 점검과 지표 정의 검토를 주도한 핵심 기여자입니다.',
      notify: true,
    })
    expect(ok.ok).toBe(true)
    if (ok.ok) expect(ok.sheet.status).toBe('submitted_recommended')
    expect(teamOf('team_dm').status).toBe('completed')
    // 제출본 draft 덮어쓰기는 409 — 수정은 재제출로만
    const draftOnSubmitted = saveRecommendationDraft('team_dm', {
      mode: 'none',
      studentId: null,
      summary: '',
      notify: true,
    })
    expect(draftOnSubmitted.ok).toBe(false)
    if (!draftOnSubmitted.ok) expect(draftOnSubmitted.status).toBe(409)
    // 재제출 허용 — '추천하지 않음'으로 교체(팀당 1건 · 마지막 제출본 유효)
    const resubmit = submitRecommendation('team_dm', {
      mode: 'none',
      studentId: null,
      summary: '',
      notify: true,
    })
    expect(resubmit.ok).toBe(true)
    if (resubmit.ok)
      expect(resubmit.sheet.status).toBe('submitted_not_recommended')
    expect(
      mentorDb.recommendations.filter((r) => r.teamId === 'team_dm'),
    ).toHaveLength(1)

    // 제출 요약 — 마지막 제출본(추천하지 않음) 기준으로 파생
    const { submissions } = buildRecommendationsData()
    expect(submissions[0].teamId).toBe('team_dm')
    expect(submissions[0].recommended).toBe(false)
    expect(submissions[0].targetLabel).toBe('추천하지 않음')
    expect(submissions[0].certificateLabel).toBe(
      '증명서 전체 공개 + 인증 완료 + 최신화 스냅샷 기준',
    )
  })
})
