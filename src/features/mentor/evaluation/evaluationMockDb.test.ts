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

// 상태형 mock 검증 — 평가 게이트(N시간 완료/조기 종료)·전원 5축+줄글 필수·제출 후 수정
// 불가(409)·추천 잠금 해제(평가 제출 후)·팀당 1명+요약 필수·완료 전이.
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
  it('sheet — N시간 미완료 팀은 잠금(not_eligible), 평가 필요 팀은 초안 병합', () => {
    // 추천시스템 팀 — 인정 8h / 배정 12h → 잠금 + 사유
    const locked = buildTeamEvaluationSheet('team_rec')!
    expect(locked.eligible).toBe(false)
    expect(locked.status).toBe('not_eligible')
    expect(locked.lockReasonLabel).toBe(
      'N시간 완료 후 활성 — 인정 8h / 배정 12h',
    )
    // 데이터마트 팀 — N시간 완료(10/10) + 작성 중 초안 시드(2명 완료)
    const sheet = buildTeamEvaluationSheet('team_dm')!
    expect(sheet.eligible).toBe(true)
    expect(sheet.status).toBe('draft')
    expect(sheet.eligibleLabel).toBe('N시간 완료 · 평가 가능')
    expect(sheet.members[0].comment).not.toBe('')
    expect(sheet.members[2].scores[2]).toBeNull()
    // NLP 분석 팀 — 기제출(수정 불가 안내 분기)
    expect(buildTeamEvaluationSheet('team_nlp')!.status).toBe('submitted')
    expect(buildTeamEvaluationSheet('team_unknown')).toBeNull()
  })

  it('draft 저장 — 잠금 팀 422 · 제출 팀 409 · 평가 가능 팀만 반영', () => {
    const lockedSave = saveEvaluationDraft('team_rec', { entries: [] })
    expect(lockedSave.ok).toBe(false)
    if (!lockedSave.ok) {
      expect(lockedSave.status).toBe(422)
      expect(lockedSave.code).toBe('MENTOR_EVALUATION_NOT_ELIGIBLE')
    }
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

  it('제출 — 줄글 미입력 422 차단, 전원 입력 시 submitted + 목록·24h 라벨 파생', () => {
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
    // 제출 후 수정 불가 — 초안 저장·재제출 모두 409
    expect(saveEvaluationDraft('team_dm', { entries: [] }).ok).toBe(false)
    const resubmit = submitEvaluation('team_dm', completePayload())
    expect(resubmit.ok).toBe(false)
    if (!resubmit.ok) expect(resubmit.status).toBe(409)
    // 추천 제출 전까지 팀 상태는 평가 필요 유지(활동 인정 요건 = 평가 + 추천)
    expect(teamOf('team_dm').status).toBe('evaluation_needed')
    // 제출 요약 — 최신 제출 우선 + 코멘트 전원 작성 + 24시간 수정 마감 라벨
    const { submissions } = buildEvaluationsData()
    expect(submissions[0].teamId).toBe('team_dm')
    expect(submissions[0].targetCount).toBe(4)
    expect(submissions[0].commentsLabel).toBe('4명 모두 작성')
    expect(submissions[0].editDeadlineLabel).toMatch(/까지$/)
    // NLP 기제출 — 축별 평균 파생(기술 4 · 책임감 4.2 …)
    const nlp = submissions.find((s) => s.teamId === 'team_nlp')!
    expect(nlp.axisAverages.map((a) => a.value)).toEqual([
      4, 4.2, 4.4, 4.4, 4.4,
    ])
    expect(nlp.editDeadlineLabel).toBe('2026-05-16(토) 20:40 까지')
  })

  it('추천 — 평가 제출 전 잠금, 단일 선택·요약 필수 검증 후 completed 전이', () => {
    // 평가 미제출 팀 — 잠금 상태 + draft 저장 422
    expect(buildTeamRecommendationSheet('team_ts')!.status).toBe(
      'locked_until_evaluation',
    )
    const lockedDraft = saveRecommendationDraft('team_ts', {
      mode: 'none',
      studentId: null,
      summary: '',
      notify: true,
    })
    expect(lockedDraft.ok).toBe(false)
    if (!lockedDraft.ok)
      expect(lockedDraft.code).toBe(
        'MENTOR_RECOMMENDATION_LOCKED_UNTIL_EVALUATION',
      )

    // 평가 제출 완료 팀(team_dm) — 후보에 평가 평균·5축 점수 파생
    const sheet = buildTeamRecommendationSheet('team_dm')!
    expect(sheet.status).toBe('not_started')
    expect(sheet.candidates[0].average).toBe(4.6) // [5,4,5,4,5]
    expect(sheet.teamAverage).toBe(4.6)

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

    // 제출 성공 — submitted_recommended + 팀 완료 전이 + 재제출 409
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
    const dup = submitRecommendation('team_dm', {
      mode: 'none',
      studentId: null,
      summary: '',
      notify: true,
    })
    expect(dup.ok).toBe(false)
    if (!dup.ok) expect(dup.status).toBe(409)

    // 제출 요약 — 추천 대상 라벨('서지민 (PM)')·증명서 반영 고정 문구
    const { submissions } = buildRecommendationsData()
    expect(submissions[0].teamId).toBe('team_dm')
    expect(submissions[0].targetLabel).toBe('서지민 (PM)')
    expect(submissions[0].recommended).toBe(true)
    expect(submissions[0].summaryLabel).toMatch(/자 · 필수 충족$/)
    expect(submissions[0].certificateLabel).toBe(
      '증명서 전체 공개 + 인증 완료 + 최신화 스냅샷 기준',
    )
  })
})
