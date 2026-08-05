import { describe, expect, it } from 'vitest'
import {
  buildMenteeDetail,
  buildMentoringLogDetail,
  buildMentoringLogTargets,
  buildMentoringLogsData,
  buildMentoringRequestsData,
  mentorDb,
  saveMentoringLogDraft,
  submitMentoringLog,
  updateMentoringLogDraft,
} from '../mockDb'

// 상태형 mock 검증 — 초안 저장(인정 미반영)·제출/재제출(필수 검증 + 인정 시간 재계산이
// M1 팀 누적·완료 예약 파생에 실반영)·학생 상세 파생. 모듈 상태 공유 — it 순차 실행 전제.

const teamOf = (teamId: string) =>
  mentorDb.teams.find((t) => t.teamId === teamId)!

describe('mentoring logs mockDb', () => {
  it('초기 목록 — 16건(유효 14 + 수정 요청 1 + 작성 중 1), 진행 일시 내림차순', () => {
    const { logs } = buildMentoringLogsData()
    expect(logs).toHaveLength(16)
    const count = (s: string) => logs.filter((l) => l.status === s).length
    expect(count('valid')).toBe(14)
    expect(count('change_requested')).toBe(1)
    expect(count('draft')).toBe(1)
    // 내림차순 정렬
    const stamps = logs.map((l) => l.performedAt)
    expect([...stamps].sort().reverse()).toEqual(stamps)
    // 초과 멘토링 보조 라벨 — NLP 4회차(180분 · 인정 1.5h → 초과 1.5h)
    const nlp4 = logs.find((l) => l.logId === 'log_nlp_4')
    expect(nlp4?.excessHours).toBe(1.5)
  })

  it('상세 — 대표 일지(log_rec_4): 회차·템플릿 답변·사진·팀 시간 집계', () => {
    const detail = buildMentoringLogDetail('log_rec_4')!
    expect(detail.round).toBe(4)
    expect(detail.status).toBe('valid')
    expect(detail.sessionLabel).toBe('2026-05-26(화) 14:00 → 15:30')
    expect(detail.teamHours).toEqual({
      accumulatedHours: 8,
      allocatedHours: 12,
      remainingHours: 4,
    })
    expect(detail.attendedCount).toBe(5) // 참석 미지정 → 팀원 전원
    const agenda = detail.answers.find(
      (a) => a.field.fieldSnapshotId === 'fld_agenda',
    )
    expect(agenda?.field.required).toBe(true)
    expect(agenda?.value).toContain('프로젝트 전체 진행 현황')
    expect(detail.photos).toHaveLength(2)
    expect(buildMentoringLogDetail('log_unknown')).toBeNull()
  })

  it('작성 대상 — 팀별 다음 회차·잔여 시간(N시간 완료 팀 포함)', () => {
    const { targets } = buildMentoringLogTargets()
    const rec = targets.find((t) => t.teamId === 'team_rec')!
    expect(rec.nextRound).toBe(5) // 제출 일지 4건 + 1 (초안 미산입)
    expect(rec.remainingHours).toBe(4)
    // N시간 완료 팀도 작성 대상(초과 멘토링 허용)
    expect(targets.some((t) => t.teamId === 'team_dm')).toBe(true)
  })

  it('필수 항목 검증 — 미작성 제출은 422, 상태·팀 누적 불변', () => {
    // 초안(log_rec_5d)은 필수 답변(수행 내용·멘토 의견) 미작성 상태
    const invalid = submitMentoringLog('log_rec_5d', 'submit')
    expect(invalid.ok).toBe(false)
    if (!invalid.ok) {
      expect(invalid.status).toBe(422)
      expect(invalid.code).toBe('MENTOR_LOG_REQUIRED_FIELD_MISSING')
    }
    expect(buildMentoringLogDetail('log_rec_5d')?.status).toBe('draft')
    expect(teamOf('team_rec').recognizedHours).toBe(8)
  })

  it('초안 제출 — 인정 시간 재계산이 팀 누적·완료 예약 파생에 즉시 반영된다', () => {
    const before = buildMentoringRequestsData().requests.filter(
      (r) => r.status === 'completed',
    ).length

    const result = submitMentoringLog('log_rec_5d', 'submit', {
      teamId: 'team_rec',
      answers: [
        {
          fieldSnapshotId: 'fld_agenda',
          value: '콜드 스타트 사용자 처리 로직 자문',
        },
        {
          fieldSnapshotId: 'fld_progress',
          value: '● 진행 내용\n- 신규 사용자 추천 fallback 전략 검토',
        },
        {
          fieldSnapshotId: 'fld_opinion',
          value: '인기도 기반 fallback 을 우선 적용해 주세요.',
        },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      // 90분 → 인정 1.5h(잔여 4h 내), 초과 0
      expect(result.log.status).toBe('valid')
      expect(result.log.recognizedHours).toBe(1.5)
      expect(result.log.excessHours).toBe(0)
      expect(result.log.submittedAtLabel).toBeTruthy()
    }
    // M1 팀 누적 상태 실변경(상태형 mock)
    const team = teamOf('team_rec')
    expect(team.accumulatedHours).toBe(9.5)
    expect(team.recognizedHours).toBe(9.5)
    expect(team.status).toBe('in_progress') // N시간 미완료 — 평가 게이트 잠금 유지
    // 일지 제출 = 예약 COMPLETED 파생 동기화(M2 결합면)
    const after = buildMentoringRequestsData().requests.filter(
      (r) => r.status === 'completed',
    ).length
    expect(after).toBe(before + 1)
  })

  it('초안 저장·갱신 — 자유 입력 보관, 인정 시간·팀 누적 미반영', () => {
    const created = saveMentoringLogDraft({
      teamId: 'team_dm',
      sessionDate: '2026-05-30',
      startTime: '19:00',
      endTime: '21:00',
      placeType: 'online',
      placeDetail: 'Zoom',
      attendedIds: ['stu_seo', 'stu_lee_d'],
      answers: [
        { fieldSnapshotId: 'fld_agenda', value: '마트 적재 성능 회고' },
      ],
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const draftId = created.log.logId
    expect(created.log.status).toBe('draft')
    expect(created.log.actualMinutes).toBe(120)
    expect(created.log.recognizedHours).toBeNull()
    expect(created.log.summary).toBe('마트 적재 성능 회고')
    expect(teamOf('team_dm').accumulatedHours).toBe(10) // 미반영

    const updated = updateMentoringLogDraft(draftId, {
      teamId: 'team_dm',
      startTime: '19:00',
      endTime: '20:00',
    })
    expect(updated.ok).toBe(true)
    if (updated.ok) expect(updated.log.actualMinutes).toBe(60)

    // N시간 완료 팀 제출 — 인정 0 · 초과 기록 보존('초과 멘토링 · 활동 인정 시간 없음')
    const submitted = submitMentoringLog(draftId, 'submit', {
      teamId: 'team_dm',
      answers: [
        { fieldSnapshotId: 'fld_agenda', value: '마트 적재 성능 회고' },
        { fieldSnapshotId: 'fld_progress', value: '● 적재 지연 구간 분석' },
        { fieldSnapshotId: 'fld_opinion', value: '배치 윈도 재조정 권장' },
      ],
    })
    expect(submitted.ok).toBe(true)
    if (submitted.ok) {
      expect(submitted.log.recognizedHours).toBe(0)
      expect(submitted.log.excessHours).toBe(1)
    }
    const dm = teamOf('team_dm')
    expect(dm.accumulatedHours).toBe(11)
    expect(dm.recognizedHours).toBe(10) // 잔여까지만 인정
  })

  it('재제출 — 수정 요청 해소: 즉시 자동 유효 + 재계산 + 팀 상태 복귀', () => {
    const result = submitMentoringLog('log_ts_3', 'resubmit', {
      teamId: 'team_ts',
      answers: [
        { fieldSnapshotId: 'fld_agenda', value: '장애 재현 시나리오 점검' },
        {
          fieldSnapshotId: 'fld_progress',
          value: '● 장애 재현\n- 타임아웃 케이스 3종 재현 및 로그 첨부',
        },
        {
          fieldSnapshotId: 'fld_opinion',
          value: '재현 스크립트를 레포에 보존해 주세요.',
        },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.log.status).toBe('valid')
      expect(result.log.recognizedHours).toBe(1) // 60분 — 잔여 4.5h 내
      expect(result.log.changeRequest).toBeNull()
      expect(result.log.statusNote).toBeUndefined()
    }
    const ts = teamOf('team_ts')
    expect(ts.recognizedHours).toBe(4.5)
    expect(ts.status).toBe('in_progress') // change_requested 해소
  })

  it('상태 전이 guard — 유효 일지 submit·초안 resubmit 409, 미존재 404', () => {
    const already = submitMentoringLog('log_rec_4', 'submit')
    expect(already.ok).toBe(false)
    if (!already.ok) expect(already.status).toBe(409)

    const draftGuard = updateMentoringLogDraft('log_rec_4', {
      teamId: 'team_rec',
    })
    expect(draftGuard.ok).toBe(false)
    if (!draftGuard.ok)
      expect(draftGuard.code).toBe('MENTOR_LOG_DIRECT_EDIT_FORBIDDEN')

    const missing = submitMentoringLog('log_unknown', 'submit')
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.status).toBe(404)
  })

  it('학생 상세 — 완료 팀은 평가·추천 정본, 참석 이력은 제출 일지에서 파생', () => {
    const detail = buildMenteeDetail('stu_han_y')!
    expect(detail.student.name).toBe('한예린')
    expect(detail.student.teamName).toBe('NLP 분석 팀')
    // 2026-08-05 4축 개편 — 시드 [5,4,5,5] 평균 4.8.
    expect(detail.evaluation?.average).toBe(4.8)
    expect(detail.evaluation?.axes.map((a) => a.label)).toEqual([
      '기술/기술기여',
      '소통·협업·팀워크',
      '문제해결',
      '책임감',
    ])
    expect(detail.recommendation?.recommended).toBe(true)
    expect(detail.attendance.attended).toBe(4)
    expect(detail.attendance.total).toBe(4)
    // 추천 비대상 팀원 — 추천 카드 없음, 평가는 존재
    const other = buildMenteeDetail('stu_kim_d')!
    expect(other.recommendation).toBeNull()
    expect(other.evaluation).not.toBeNull()
    // 평가 전 진행 중 팀원 — 평가·추천 null
    const inProgress = buildMenteeDetail('stu_kim')!
    expect(inProgress.evaluation).toBeNull()
    // 미배정 학생 — null(403)
    expect(buildMenteeDetail('stu_unknown')).toBeNull()
  })
})
