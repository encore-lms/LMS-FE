import { describe, expect, it } from 'vitest'
import {
  buildAdminLogDetail,
  buildAssignmentsData,
  buildLogTemplatesData,
  buildMentoringStatistics,
  buildTeamLogFields,
  createLogTemplate,
  duplicateLogTemplate,
  earlyEndAssignment,
  resetTeamLogFields,
  saveTeamLogFields,
  setTemplateStatus,
  updateTemplateFields,
} from './mockDb'
import { countFieldDiffs, fieldDiffStatus, restoredField } from './fieldDiff'
import type { AdminTemplateFieldType } from './types'

// A2 상태형 mock 검증 — §31 템플릿(비활성화 게이트·복제·항목 편집·스냅샷 보존),
// §32 팀별 오버라이드(diff 파생·저장·되돌리기), §33 통계(A1 배정·일지 상태 공유 파생).
// 모듈 상태 공유 — it 순차 실행 전제(mentoringMockDb.test 선례).

describe('admin mentoring mockDb — 일지 템플릿 (§31)', () => {
  it('목록 — 5종 · 기본 1 · 적용 팀 수는 배정 파생 · 배정 선택지는 활성만', () => {
    const data = buildLogTemplatesData()
    expect(data.summary).toEqual({ total: 5, defaults: 1 })
    const base = data.templates.find((t) => t.templateId === 'tpl_default_v21')!
    expect(base.name).toBe('AI 캠프 기본 v2.1')
    expect(base.appliedTeamCount).toBe(3) // asgn_rec·asgn_dm·asgn_ts
    expect(base.fields).toHaveLength(6)
    expect(base.updatedAtLabel).toBe('05-19')
    const legacy = data.templates.find(
      (t) => t.templateId === 'tpl_legacy_v10',
    )!
    expect(legacy.isActive).toBe(false)
    expect(legacy.appliedTeamCount).toBe(0)
    // 배정 폼 선택지 — 비활성(레거시) 제외 4종
    const options = buildAssignmentsData().templates
    expect(options).toHaveLength(4)
    expect(options.some((o) => o.templateId === 'tpl_legacy_v10')).toBe(false)
  })

  it('비활성화 — 기본 템플릿 422 차단 · 일반 템플릿은 선택지 제외 · 복원 시 재노출', () => {
    const blocked = setTemplateStatus('tpl_default_v21', false)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.status).toBe(422)
      expect(blocked.code).toBe(
        'MENTORING_TEMPLATE_DEFAULT_DEACTIVATE_FORBIDDEN',
      )
    }

    const deactivated = setTemplateStatus('tpl_da5_data', false)
    expect(deactivated.ok).toBe(true)
    if (deactivated.ok) expect(deactivated.data.isActive).toBe(false)
    expect(
      buildAssignmentsData().templates.some(
        (o) => o.templateId === 'tpl_da5_data',
      ),
    ).toBe(false)
    // 비활성화는 목록에서 제거되지 않음(보존 — '비활성 포함' 토글 노출)
    expect(buildLogTemplatesData().summary.total).toBe(5)

    const restored = setTemplateStatus('tpl_da5_data', true)
    expect(restored.ok).toBe(true)
    expect(
      buildAssignmentsData().templates.some(
        (o) => o.templateId === 'tpl_da5_data',
      ),
    ).toBe(true)
  })

  it('항목 편집 — 항목명 필수 422 · 타입 2종 게이트 422 · 순서 정규화 · 기존 일지 스냅샷 보존', () => {
    const base = buildLogTemplatesData().templates.find(
      (t) => t.templateId === 'tpl_default_v21',
    )!
    const blankName = updateTemplateFields('tpl_default_v21', [
      { ...base.fields[0], name: '  ' },
    ])
    expect(blankName.ok).toBe(false)
    if (!blankName.ok) {
      expect(blankName.code).toBe('MENTORING_TEMPLATE_FIELD_NAME_REQUIRED')
    }

    const badType = updateTemplateFields('tpl_default_v21', [
      { ...base.fields[0], type: 'select' as AdminTemplateFieldType },
    ])
    expect(badType.ok).toBe(false)
    if (!badType.ok) {
      expect(badType.status).toBe(422)
      expect(badType.code).toBe('MENTORING_TEMPLATE_FIELD_TYPE_NOT_ALLOWED')
    }

    // 1↔2 순서 변경 — 저장 시 1..N 재부여
    const swapped = [base.fields[1], base.fields[0], ...base.fields.slice(2)]
    const updated = updateTemplateFields('tpl_default_v21', swapped)
    expect(updated.ok).toBe(true)
    if (updated.ok) {
      expect(updated.data.fields.map((f) => f.name).slice(0, 2)).toEqual([
        '수행 내용',
        '주요 아젠다',
      ])
      expect(updated.data.fields.map((f) => f.order)).toEqual([
        1, 2, 3, 4, 5, 6,
      ])
    }
    // 기존 일지는 작성 당시 스냅샷 보존 — 템플릿 변경의 소급 적용 없음(§31)
    const detail = buildAdminLogDetail('log_rec_4')!
    expect(detail.snapshotItems[0].title).toBe('주요 아젠다')
    expect(detail.snapshotItems[4].title).toBe('작성 산출물')
  })

  it('복제·생성 — 복제는 항목 포함 새 id·기본 OFF, 생성은 이름 필수 422', () => {
    const duplicated = duplicateLogTemplate('tpl_default_v21')
    expect(duplicated.ok).toBe(true)
    if (duplicated.ok) {
      expect(duplicated.data.name).toBe('AI 캠프 기본 v2.1 (복제)')
      expect(duplicated.data.isDefault).toBe(false)
      expect(duplicated.data.fields).toHaveLength(6)
      expect(
        duplicated.data.fields.some((f) => f.fieldId === 'tf_agenda'),
      ).toBe(false)
    }

    const noName = createLogTemplate({ name: '  ', description: '' })
    expect(noName.ok).toBe(false)
    if (!noName.ok) expect(noName.code).toBe('MENTORING_TEMPLATE_NAME_REQUIRED')

    const created = createLogTemplate({ name: 'DE 4기 신규', description: '' })
    expect(created.ok).toBe(true)
    if (created.ok) expect(created.data.fields).toHaveLength(0)
    expect(buildLogTemplatesData().summary.total).toBe(7)
  })
})

describe('admin mentoring mockDb — 팀별 일지 항목 (§32)', () => {
  it('조회 — 오버라이드 팀은 7항목(변경 3·비활성 1) diff 파생, 미오버라이드 팀은 템플릿 동일', () => {
    const rec = buildTeamLogFields('asgn_rec')!
    expect(rec.teamName).toBe('추천시스템 팀')
    expect(rec.baseTemplateName).toBe('AI 캠프 기본 v2.1')
    expect(rec.fields).toHaveLength(7)
    expect(countFieldDiffs(rec.fields, rec.templateFields)).toEqual({
      total: 7,
      active: 6,
      inactive: 1,
      changed: 3,
    })
    const statusOf = (fieldId: string) =>
      fieldDiffStatus(
        rec.fields.find((f) => f.fieldId === fieldId)!,
        rec.templateFields,
      )
    expect(statusOf('tf_opinion')).toBe('desc_changed')
    expect(statusOf('fld_rec_llm')).toBe('added')
    expect(statusOf('tf_next')).toBe('required_changed')
    expect(statusOf('tf_memo')).toBe('disabled')
    expect(statusOf('tf_agenda')).toBe('same')

    // 오버라이드 없는 팀 — 템플릿 항목 그대로(전부 활성·동일)
    const dm = buildTeamLogFields('asgn_dm')!
    expect(dm.fields).toHaveLength(6)
    expect(countFieldDiffs(dm.fields, dm.templateFields).changed).toBe(0)
  })

  it('템플릿 값 복원 헬퍼 — 템플릿 항목은 원본 값·활성, 신규 추가 항목은 제거(null)', () => {
    const rec = buildTeamLogFields('asgn_rec')!
    const next = restoredField(
      rec.fields.find((f) => f.fieldId === 'tf_next')!,
      rec.templateFields,
    )!
    expect(next.required).toBe(false) // 선택으로 복원
    const memo = restoredField(
      rec.fields.find((f) => f.fieldId === 'tf_memo')!,
      rec.templateFields,
    )!
    expect(memo.isActive).toBe(true) // 비활성 → 복원 시 활성
    expect(
      restoredField(
        rec.fields.find((f) => f.fieldId === 'fld_rec_llm')!,
        rec.templateFields,
      ),
    ).toBeNull()
  })

  it('저장 — 활성 항목 0개 422 · 저장 즉시 diff 반영(다음 일지부터 적용)', () => {
    const dm = buildTeamLogFields('asgn_dm')!
    const allInactive = saveTeamLogFields(
      'asgn_dm',
      dm.fields.map((f) => ({ ...f, isActive: false })),
    )
    expect(allInactive.ok).toBe(false)
    if (!allInactive.ok) {
      expect(allInactive.status).toBe(422)
      expect(allInactive.code).toBe('MENTORING_TEAM_FIELD_ACTIVE_REQUIRED')
    }

    // 필수 변경(선택→필수) 1건 저장
    const saved = saveTeamLogFields(
      'asgn_dm',
      dm.fields.map((f) =>
        f.fieldId === 'tf_next' ? { ...f, required: true } : f,
      ),
    )
    expect(saved.ok).toBe(true)
    const after = buildTeamLogFields('asgn_dm')!
    expect(countFieldDiffs(after.fields, after.templateFields).changed).toBe(1)
    expect(
      fieldDiffStatus(
        after.fields.find((f) => f.fieldId === 'tf_next')!,
        after.templateFields,
      ),
    ).toBe('required_changed')
  })

  it('템플릿으로 되돌리기 — 오버라이드 일괄 복원(작성된 일지는 보존)', () => {
    const result = resetTeamLogFields('asgn_rec')
    expect(result.ok).toBe(true)
    const after = buildTeamLogFields('asgn_rec')!
    expect(after.fields).toHaveLength(6)
    expect(countFieldDiffs(after.fields, after.templateFields)).toEqual({
      total: 6,
      active: 6,
      inactive: 0,
      changed: 0,
    })
    // 작성된 일지 스냅샷·답변 보존
    expect(buildAdminLogDetail('log_rec_4')!.snapshotItems).toHaveLength(6)

    const missing = resetTeamLogFields('asgn_unknown')
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.status).toBe(404)
  })
})

describe('admin mentoring mockDb — 멘토 통계 (§33, 조회 전용)', () => {
  it('파생 — 배정·일지·평가 상태에서 요약 5종·행 라벨 상태 산출', () => {
    const stats = buildMentoringStatistics()
    expect(stats.summary).toEqual({
      in_progress: 1, // 추천시스템 8/12h
      log_needed: 0,
      change_requested: 1, // 트러블슈팅 — log_ts_3 수정 요청
      evaluation_needed: 0,
      completed: 1, // 데이터마트 10/10h + 평가·추천 제출
    })
    const rowOf = (assignmentId: string) =>
      stats.rows.find((r) => r.assignmentId === assignmentId)!
    const dm = rowOf('asgn_dm')
    expect(dm.evaluation).toBe('submitted')
    expect(dm.recommendation).toBe('recommended')
    expect(dm.certificate).toBe('reflected')
    const ts = rowOf('asgn_ts')
    expect(ts.changeRequestCount).toBe(1)
    expect(ts.evaluation).toBe('not_eligible')
    expect(ts.certificate).toBe('not_target')
    const rec = rowOf('asgn_rec')
    expect(rec.logCount).toBe(4) // 초안 1건 제외
    expect(rec.teamStatus).toBe('in_progress')
  })

  it('A1 상태 공유 — 조기 종료 즉시 평가 필요·원천 데이터 대기로 전환', () => {
    const ended = earlyEndAssignment('asgn_ts', '팀 일정 종료 합의')
    expect(ended.ok).toBe(true)
    const stats = buildMentoringStatistics()
    const ts = stats.rows.find((r) => r.assignmentId === 'asgn_ts')!
    expect(ts.earlyEnded).toBe(true)
    expect(ts.teamStatus).toBe('evaluation_needed')
    expect(ts.evaluation).toBe('needed')
    expect(ts.certificate).toBe('waiting_source')
    expect(stats.summary.change_requested).toBe(0)
    expect(stats.summary.evaluation_needed).toBe(1)
  })
})
