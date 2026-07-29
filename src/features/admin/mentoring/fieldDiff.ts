import type {
  AdminTeamLogField,
  AdminTemplateField,
  TeamLogFieldDiffStatus,
} from './types'

// 팀 일지 항목 ↔ 기본 템플릿 diff 파생(§32) — '변경됨' 배지·AMBER strip·저장 대기
// 배너 카운트의 단일 출처. 순수 함수로 분리해 페이지·테스트가 공유한다.

/**
 * 항목 1개의 템플릿 대비 상태.
 * 우선순위: disabled > added > required_changed > desc_changed > same —
 * 복수 차이가 있어도 행 배지는 1개만 노출(Figma 2749:8024 행 패턴).
 * 항목명/설명 변경은 Figma 라벨대로 '설명 변경' 하나로 묶는다.
 */
export function fieldDiffStatus(
  field: AdminTeamLogField,
  templateFields: AdminTemplateField[],
): TeamLogFieldDiffStatus {
  if (!field.isActive) return 'disabled'
  const base = templateFields.find((t) => t.fieldId === field.fieldId)
  if (!base) return 'added'
  if (field.required !== base.required) return 'required_changed'
  if (field.name !== base.name || field.helpText !== base.helpText) {
    return 'desc_changed'
  }
  return 'same'
}

/** 변경 항목 수 — 비활성 제외한 diff 카운트(Figma 푸터 '변경 3'은 비활성 1과 분리 집계). */
export function countFieldDiffs(
  fields: AdminTeamLogField[],
  templateFields: AdminTemplateField[],
) {
  let changed = 0
  let inactive = 0
  fields.forEach((f) => {
    const status = fieldDiffStatus(f, templateFields)
    if (status === 'disabled') inactive += 1
    else if (status !== 'same') changed += 1
  })
  return {
    total: fields.length,
    active: fields.length - inactive,
    inactive,
    changed,
  }
}

let fieldIdSeq = 0

/** 추가 항목 임시 id — 저장 시 mock/BE 가 그대로 보존(서버 채번은 BE 확정 시). */
export function newFieldId() {
  fieldIdSeq += 1
  return `fld_local_${fieldIdSeq}`
}

/** 템플릿 값 복원 — 템플릿 항목이면 원본 값(활성)으로, 신규 추가 항목이면 제거(null). */
export function restoredField(
  field: AdminTeamLogField,
  templateFields: AdminTemplateField[],
): AdminTeamLogField | null {
  const base = templateFields.find((t) => t.fieldId === field.fieldId)
  if (!base) return null
  return { ...base, order: field.order, isActive: true }
}
