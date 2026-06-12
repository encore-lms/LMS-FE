import { describe, expect, it } from 'vitest'
import {
  adminMentoringDb,
  buildAdminLogDetail,
  buildAdminLogsData,
  buildAssignmentsData,
  changeAssignmentMentor,
  createAssignment,
  createLogChangeRequest,
  earlyEndAssignment,
  updateAllocatedHours,
} from './mockDb'

// 상태형 mock 검증 — §29 배정 게이트(같은 반 중복 409 · N시간 422 · 템플릿 422 ·
// 일지 존재 교체 409+보존)와 §30 수정 요청 게이트(초안 불가 · 사유 코드+메모 필수 ·
// 미해결 1건 409 · 기존 유효본 인정 유지).
// 모듈 상태 공유 — it 순차 실행 전제(멘토 mockDb 테스트 선례).

const rowOf = (teamId: string) =>
  buildAssignmentsData().rows.find((r) => r.teamId === teamId)!

describe('admin mentoring mockDb — 배정 (§29)', () => {
  it('보드 — 배정 3건(임수현)·미배정 2팀·KPI 파생', () => {
    const data = buildAssignmentsData()
    expect(data.summary).toEqual({ total: 5, active: 3, unassigned: 2 })
    expect(data.kpis.activeMentors).toBe(1)
    expect(data.kpis.unassignedTeamsHint).toBe('AI 5기 1 · DA 4기 1')
    // 데이터마트 팀 — 10h/10h: 상태는 active, 'N시간 완료'는 보조 라벨 파생
    const dm = rowOf('team_dm')
    expect(dm.status).toBe('active')
    expect(dm.nHoursDone).toBe(true)
    expect(dm.recognizedPct).toBe(100)
    expect(rowOf('team_rec').hasLogs).toBe(true)
  })

  it('배정 생성 — 템플릿 미선택 422 · N시간 0 이하 422', () => {
    const noTemplate = createAssignment({
      teamId: 'team_pub',
      mentorId: 'mentor_kim',
      allocatedHours: 8,
    })
    expect(noTemplate.ok).toBe(false)
    if (!noTemplate.ok) {
      expect(noTemplate.status).toBe(422)
      expect(noTemplate.code).toBe('MENTOR_ASSIGNMENT_TEMPLATE_REQUIRED')
    }
    const zeroHours = createAssignment({
      teamId: 'team_pub',
      mentorId: 'mentor_kim',
      allocatedHours: 0,
      logTemplateId: 'tpl_default_v21',
    })
    expect(zeroHours.ok).toBe(false)
    if (!zeroHours.ok) {
      expect(zeroHours.status).toBe(422)
      expect(zeroHours.code).toBe('MENTOR_ASSIGNMENT_HOURS_INVALID')
    }
    // 차단 시 상태 불변
    expect(rowOf('team_pub').assignmentId).toBeNull()
  })

  it('배정 생성 — 같은 반 중복 409(이상탐지 ML = 추천시스템과 동일 cohort)', () => {
    const result = createAssignment({
      teamId: 'team_ad',
      mentorId: 'mentor_kim',
      allocatedHours: 10,
      logTemplateId: 'tpl_default_v21',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(409)
      expect(result.code).toBe('MENTOR_ASSIGNMENT_DUPLICATED_COHORT')
    }
  })

  it('배정 생성 — 빈 반(공공 데이터 팀) 성공 시 보드·KPI 즉시 반영', () => {
    const result = createAssignment({
      teamId: 'team_pub',
      mentorId: 'mentor_kim',
      allocatedHours: 8,
      logTemplateId: 'tpl_default_v21',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.mentor?.name).toBe('김효원')
      expect(result.data.recognizedHours).toBe(0)
    }
    const data = buildAssignmentsData()
    expect(data.summary.active).toBe(4)
    expect(data.summary.unassigned).toBe(1)
    expect(data.kpis.activeMentors).toBe(2)
  })

  it('멘토 교체 — 일지 존재 시 409 MENTOR_ASSIGNMENT_HAS_LOGS, 일지 작성 전이면 PATCH 허용', () => {
    const blocked = changeAssignmentMentor('asgn_rec', 'mentor_lee')
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.status).toBe(409)
      expect(blocked.code).toBe('MENTOR_ASSIGNMENT_HAS_LOGS')
    }
    expect(rowOf('team_rec').mentor?.name).toBe('임수현')
    // 공공 데이터 팀 새 배정(일지 0건)은 교체 허용
    const allowed = changeAssignmentMentor(
      rowOf('team_pub').assignmentId!,
      'mentor_lee',
    )
    expect(allowed.ok).toBe(true)
    expect(rowOf('team_pub').mentor?.name).toBe('이지훈')
  })

  it('교체(새 배정 생성) — 기존 배정 replaced 보존 + 새 배정 인정 0 으로 시작', () => {
    const before = adminMentoringDb.assignments.find(
      (a) => a.assignmentId === 'asgn_rec',
    )!
    const result = createAssignment({
      teamId: 'team_rec',
      mentorId: 'mentor_park',
      allocatedHours: 12,
      logTemplateId: 'tpl_default_v21',
    })
    expect(result.ok).toBe(true)
    // 기존 배정·인정 시간 보존(덮어쓰기 금지) — 보드에는 새 배정만 노출
    expect(before.status).toBe('replaced')
    expect(before.recognizedHours).toBe(8)
    const row = rowOf('team_rec')
    expect(row.mentor?.name).toBe('박지영')
    expect(row.recognizedHours).toBe(0)
    expect(row.hasLogs).toBe(false) // 일지는 기존 배정 귀속
  })

  it('N시간 수정 — 0 이하 422 · 감소 시 인정 유지(즉시 완료) · 증가 시 유효 일지 기준 재계산', () => {
    const invalid = updateAllocatedHours('asgn_ts', 0)
    expect(invalid.ok).toBe(false)
    if (!invalid.ok)
      expect(invalid.code).toBe('MENTOR_ASSIGNMENT_HOURS_INVALID')

    // 감소: 8h → 3h — 인정 3.5h 유지 + 새 기준 충족(N시간 완료 보조 라벨)
    const decreased = updateAllocatedHours('asgn_ts', 3)
    expect(decreased.ok).toBe(true)
    if (decreased.ok) {
      expect(decreased.data.recognizedHours).toBe(3.5)
      expect(decreased.data.nHoursDone).toBe(true)
    }
    // 증가: 3h → 8h — 유효 일지 실제 시간 합(120+90분=3.5h) 기준 재계산, 진행 중 복귀
    const increased = updateAllocatedHours('asgn_ts', 8)
    expect(increased.ok).toBe(true)
    if (increased.ok) {
      expect(increased.data.recognizedHours).toBe(3.5)
      expect(increased.data.nHoursDone).toBe(false)
    }
  })

  it('조기 종료 — 사유 공백 422 MENTOR_EARLY_END_REASON_REQUIRED · 성공 시 상태 전환', () => {
    const blocked = earlyEndAssignment('asgn_ts', '   ')
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.status).toBe(422)
      expect(blocked.code).toBe('MENTOR_EARLY_END_REASON_REQUIRED')
    }
    expect(rowOf('team_ts').status).toBe('active')

    const ended = earlyEndAssignment(
      'asgn_ts',
      '팀 일정 종료 — 잔여 시간 합의 하에 조기 마감',
    )
    expect(ended.ok).toBe(true)
    if (ended.ok) expect(ended.data.status).toBe('early_ended')
    expect(buildAssignmentsData().kpis.earlyEnded).toBe(1)
  })
})

describe('admin mentoring mockDb — 일지 수정 요청 (§30)', () => {
  it('목록 — 유효 10 · 수정 요청 1 · 초안 1, 상세는 스냅샷 6항목·이력 포함', () => {
    const data = buildAdminLogsData()
    expect(data.kpis).toEqual({
      valid: 10,
      changeRequested: 1,
      draft: 1,
      resubmitted: 0,
    })
    expect(data.monthlySubmitted).toBe(11)
    const detail = buildAdminLogDetail('log_rec_4')!
    expect(detail.roundLabel).toBe('4회차')
    expect(detail.snapshotItems).toHaveLength(6)
    expect(detail.history[0].actionLabel).toBe('제출 (유효)')
    expect(buildAdminLogDetail('log_unknown')).toBeNull()
  })

  it('수정 요청 — 초안 대상 422 · 미해결 요청 존재 409', () => {
    const draft = createLogChangeRequest('log_rec_5d', {
      reasonCode: 'other',
      note: '보강 필요',
    })
    expect(draft.ok).toBe(false)
    if (!draft.ok) expect(draft.status).toBe(422)

    const exists = createLogChangeRequest('log_ts_3', {
      reasonCode: 'other',
      note: '보강 필요',
    })
    expect(exists.ok).toBe(false)
    if (!exists.ok) {
      expect(exists.status).toBe(409)
      expect(exists.code).toBe('MENTORING_LOG_CHANGE_REQUEST_EXISTS')
    }
  })

  it('수정 요청 — 사유 코드·상세 메모 필수(422 사유 필수 게이트)', () => {
    const noCode = createLogChangeRequest('log_rec_4', {
      note: '시간이 실제와 다릅니다',
    })
    expect(noCode.ok).toBe(false)
    if (!noCode.ok) {
      expect(noCode.status).toBe(422)
      expect(noCode.code).toBe('MENTORING_LOG_CHANGE_REQUEST_REASON_REQUIRED')
    }
    const blankNote = createLogChangeRequest('log_rec_4', {
      reasonCode: 'time_mismatch',
      note: '   ',
    })
    expect(blankNote.ok).toBe(false)
    if (!blankNote.ok) expect(blankNote.status).toBe(422)
    // 차단 시 상태 불변
    expect(buildAdminLogDetail('log_rec_4')!.status).toBe('valid')
  })

  it('수정 요청 성공 — 상태 전환 + 사유 보존 + 이력 추가 + 기존 유효본 인정 유지', () => {
    const result = createLogChangeRequest('log_rec_4', {
      reasonCode: 'time_mismatch',
      note: '진행 일시와 실제 시간이 캘린더 기록과 다릅니다. 확인 후 재제출해 주세요.',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.status).toBe('change_requested')
      expect(result.data.changeRequest?.reasonLabel).toBe('시간 불일치')
      expect(result.data.history[0]).toMatchObject({
        actionLabel: '수정 요청',
        actor: '운영자',
      })
      // 수정 요청 중에도 기존 유효본 인정 시간 유지(05-31)
      expect(result.data.recognizedHours).toBe(1.5)
    }
    const data = buildAdminLogsData()
    expect(data.kpis.changeRequested).toBe(2)
    expect(data.pendingCount).toBe(2)
  })
})
