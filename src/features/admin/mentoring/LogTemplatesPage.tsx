import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Copy,
  Info,
  ListPlus,
  Pencil,
  Plus,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import {
  apiErrorOf,
  useDuplicateLogTemplate,
  useLogTemplates,
  useSetTemplateStatus,
  useUpdateTemplateFields,
} from './api'
import { FIELD_TYPE_META } from './statusMeta'
import { newFieldId } from './fieldDiff'
import { FieldFormModal, type FieldFormValues } from './FieldFormModal'
import { TemplateFormModal } from './TemplateFormModal'
import { MentoringTabs } from './MentoringTabs'
import { ActionModal, type ActionModalSpec } from '../settings/ActionModal'
import type { AdminLogTemplate, AdminTemplateField } from './types'

/** §31 보존 정책 — 항목 폼 모달 하단 안내(작업 요구 고정 문구). */
const TEMPLATE_NOTICE =
  '변경은 기존 일지·작성 중 초안의 스냅샷을 보존하고 새 일지부터 적용됩니다'

// 멘토링 일지 템플릿 (/admin/mentoring/log-templates) — 운영(MANAGER/ADMIN).
// 항목명·설명·필수·순서·추가·비활성화 관리(§31). 변경은 기존 팀 자동 반영 없음 —
// 신규 배정 팀에만 기본 적용, 기존 일지·초안은 스냅샷 보존. (Figma 2746:7909)
export default function LogTemplatesPage() {
  usePageHeader(
    '멘토링 일지 템플릿',
    '짧은/긴 텍스트 항목 · 신규 배정 팀에만 기본 적용 · 기존 팀은 팀별 일지 항목 설정에서 직접 수정',
  )
  const toast = useToast()
  const { data, isPending, isError, refetch } = useLogTemplates()
  const duplicateTemplate = useDuplicateLogTemplate()
  const setStatus = useSetTemplateStatus()
  const updateFields = useUpdateTemplateFields()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Figma 스냅샷 기준 기본 ON — OFF 시 비활성 템플릿을 목록에서 제외.
  const [includeInactive, setIncludeInactive] = useState(true)
  const [templateFormOpen, setTemplateFormOpen] = useState(false)
  // 항목 삭제 확인 대상 — 파괴적 액션은 ActionModal 확인을 거친다.
  const [deleteField, setDeleteField] = useState<AdminTemplateField | null>(
    null,
  )
  const [fieldModal, setFieldModal] = useState<{
    mode: 'add' | 'edit'
    field?: AdminTemplateField
  } | null>(null)

  const templates = useMemo(() => data?.templates ?? [], [data])
  const visible = useMemo(
    () => templates.filter((t) => includeInactive || t.isActive),
    [templates, includeInactive],
  )
  const selected: AdminLogTemplate | null =
    visible.find((t) => t.templateId === selectedId) ?? visible[0] ?? null

  if (isPending) {
    return <div className="text-fg-muted p-8">템플릿을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="템플릿을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const mutationError = (error: unknown, fallback: string) =>
    toast.danger(apiErrorOf(error).message ?? fallback)

  const duplicate = (template: AdminLogTemplate) =>
    duplicateTemplate.mutate(template.templateId, {
      onSuccess: (created) => {
        setSelectedId(created.templateId)
        toast.success(`복제 완료 — ${created.name}`)
      },
      onError: (error) => mutationError(error, '템플릿 복제에 실패했어요.'),
    })

  const toggleActive = (template: AdminLogTemplate) =>
    setStatus.mutate(
      { templateId: template.templateId, isActive: !template.isActive },
      {
        onSuccess: (updated) =>
          toast.success(
            updated.isActive
              ? `복원 완료 — ${updated.name} · 신규 배정에서 선택 가능`
              : `비활성화 — ${updated.name} · 신규 배정 선택 불가 · 기존 팀·일지는 보존`,
          ),
        onError: (error) =>
          mutationError(error, '템플릿 상태 변경에 실패했어요.'),
      },
    )

  /** 항목 변경 공통 — 전체 항목 교체 PATCH(§31, 기존 일지 스냅샷 보존). */
  const patchFields = (
    template: AdminLogTemplate,
    fields: AdminTemplateField[],
    successMessage: string,
  ) =>
    updateFields.mutate(
      { templateId: template.templateId, fields },
      {
        onSuccess: () => {
          toast.success(`${successMessage} · 새 일지부터 적용`)
          setFieldModal(null)
        },
        onError: (error) => mutationError(error, '항목 저장에 실패했어요.'),
      },
    )

  const submitFieldForm = (values: FieldFormValues) => {
    if (!selected || !fieldModal) return
    if (fieldModal.mode === 'add') {
      patchFields(
        selected,
        [
          ...selected.fields,
          {
            fieldId: newFieldId(),
            order: selected.fields.length + 1,
            ...values,
          },
        ],
        `항목 추가 — ${values.name}`,
      )
      return
    }
    patchFields(
      selected,
      selected.fields.map((f) =>
        f.fieldId === fieldModal.field!.fieldId ? { ...f, ...values } : f,
      ),
      `항목 수정 — ${values.name}`,
    )
  }

  const deleteFieldSpec: ActionModalSpec | null = deleteField
    ? {
        title: '템플릿 항목 삭제',
        subtitle:
          '이 템플릿에서 항목을 제거합니다. 기존 일지 스냅샷은 보존되고 새 일지부터 적용됩니다.',
        rows: [
          { label: '항목', value: deleteField.name },
          { label: '템플릿', value: selected?.name ?? '-' },
          { label: '처리', value: '항목 제거 — 새 일지부터 적용' },
        ],
        confirmLabel: '삭제',
      }
    : null
  const removeField = () => {
    if (!selected || !deleteField) return
    const field = deleteField
    updateFields.mutate(
      {
        templateId: selected.templateId,
        fields: selected.fields.filter((f) => f.fieldId !== field.fieldId),
      },
      {
        onSuccess: () =>
          toast.success(`항목 삭제 — ${field.name} · 새 일지부터 적용`),
        onError: (error) => mutationError(error, '항목 저장에 실패했어요.'),
        onSettled: () => setDeleteField(null),
      },
    )
  }

  const moveField = (field: AdminTemplateField, dir: -1 | 1) => {
    if (!selected) return
    const index = selected.fields.findIndex((f) => f.fieldId === field.fieldId)
    const target = index + dir
    if (target < 0 || target >= selected.fields.length) return
    const next = [...selected.fields]
    ;[next[index], next[target]] = [next[target], next[index]]
    patchFields(selected, next, `순서 변경 — ${field.name}`)
  }

  return (
    <div className="p-8">
      <MentoringTabs />
      {/* Hero — 총계 칩 + 반영 정책 경고 칩 + 복제/생성 CTA */}
      <div className="bg-brand flex flex-wrap items-center justify-between gap-4 rounded-2xl px-7 py-6 shadow-[0_8px_22px_rgba(18,23,38,0.18)]">
        <div className="flex flex-col gap-3">
          <p className="text-on-color text-lg font-bold">
            멘토링 일지 항목 템플릿 · 신규 배정 팀에 기본 적용
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-surface text-fg rounded-md px-2.5 py-1 text-[11px] font-bold">
              총 {data.summary.total} 템플릿 · 기본 {data.summary.defaults}
            </span>
            <span className="bg-warning-bg text-warning inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold">
              <Info className="h-3 w-3" />
              기존 팀에는 자동 반영 안 됨 — 팀별 일지 항목 설정에서 직접 수정
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => selected && duplicate(selected)}
            disabled={!selected || duplicateTemplate.isPending}
            className="border-on-color/60 text-on-color hover:bg-surface/10 inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" />
            선택 복제
          </button>
          <button
            type="button"
            onClick={() => setTemplateFormOpen(true)}
            className="bg-surface text-fg hover:bg-surface/90 inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-bold"
          >
            <Plus className="h-4 w-4" />새 템플릿
          </button>
        </div>
      </div>

      {/* 2단 — 좌 템플릿 목록 + 우 메타·항목 편집 */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* 템플릿 목록 */}
        <div className="border-border bg-surface flex h-fit flex-col rounded-xl border">
          <div className="flex items-start justify-between px-5 pt-5 pb-3.5">
            <div>
              <p className="text-fg text-sm font-bold">템플릿 목록</p>
              <p className="text-fg-subtle mt-1 text-[11px]">
                이름 · 항목 수 · 적용 팀 수 · 기본 여부 · 수정일
              </p>
            </div>
            <span className="bg-surface-muted text-fg-muted rounded-md px-2.5 py-1 text-[11px] font-bold">
              총 {visible.length}
            </span>
          </div>
          <ul className="divide-divider divide-y">
            {visible.map((t) => {
              const isSelected = t.templateId === selected?.templateId
              return (
                <li key={t.templateId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.templateId)}
                    className={cn(
                      'hover:bg-surface-muted/60 w-full px-4.5 py-3 text-left',
                      isSelected && 'border-l-brand bg-brand/10 border-l-4',
                      !t.isActive && 'opacity-70',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="text-fg text-[13px] font-bold">
                          {t.name}
                        </span>
                        {t.isDefault && (
                          <StatusBadge label="기본" tone="accent" />
                        )}
                        {!t.isActive && (
                          <StatusBadge label="비활성" tone="neutral" />
                        )}
                      </span>
                      <span className="text-fg-subtle text-[10px] whitespace-nowrap">
                        {t.updatedAtLabel} 수정
                      </span>
                    </div>
                    {isSelected && t.description && (
                      <p className="text-fg-muted mt-1 text-[11px]">
                        {t.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="bg-info-bg rounded px-1.5 py-0.5 text-[10px] font-bold">
                        <span className="text-fg-muted font-medium">항목</span>{' '}
                        <span className="text-info">{t.fields.length}</span>
                      </span>
                      <span className="bg-success-bg rounded px-1.5 py-0.5 text-[10px] font-bold">
                        <span className="text-fg-muted font-medium">
                          적용 팀
                        </span>{' '}
                        <span className="text-success">
                          {t.appliedTeamCount}
                        </span>
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="border-divider flex justify-end border-t px-4.5 py-3">
            <button
              type="button"
              onClick={() => setIncludeInactive((v) => !v)}
              aria-pressed={includeInactive}
              className={cn(
                'rounded-md border px-2.5 py-1.5 text-[11px] font-bold',
                includeInactive
                  ? 'border-brand text-brand bg-brand/10'
                  : 'border-border text-fg-muted hover:bg-surface-muted bg-white',
              )}
            >
              비활성 포함
            </button>
          </div>
        </div>

        {/* 우측 — 선택 템플릿 메타 + 항목 편집 */}
        <div className="flex flex-col gap-3">
          {!selected ? (
            <div className="border-border bg-surface rounded-xl border">
              <Empty
                icon={<ListPlus />}
                title="선택된 템플릿이 없어요"
                description="좌측 목록에서 템플릿을 선택하거나 새 템플릿을 만들어 주세요."
              />
            </div>
          ) : (
            <>
              {/* 메타 카드 */}
              <div className="border-border bg-surface rounded-xl border">
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3.5">
                  <div>
                    <p className="flex items-center gap-2">
                      <span className="text-fg text-base font-bold">
                        {selected.name}
                      </span>
                      {selected.isDefault && (
                        <StatusBadge label="기본 템플릿" tone="accent" />
                      )}
                      {!selected.isActive && (
                        <StatusBadge label="비활성" tone="neutral" />
                      )}
                    </p>
                    <p className="text-fg-subtle mt-1 text-[11px]">
                      이름·설명을 수정하면 새 배정부터 적용됩니다 · 기존{' '}
                      {selected.appliedTeamCount}개 팀은 변경 없음
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => duplicate(selected)}
                      disabled={duplicateTemplate.isPending}
                      className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-md border bg-white px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50"
                    >
                      <Copy className="h-3 w-3" />
                      복제
                    </button>
                    {selected.isActive ? (
                      <button
                        type="button"
                        onClick={() => toggleActive(selected)}
                        disabled={setStatus.isPending}
                        className="border-danger text-danger hover:bg-danger/10 inline-flex items-center gap-1 rounded-md border bg-white px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                        비활성화
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleActive(selected)}
                        disabled={setStatus.isPending}
                        className="border-info text-info hover:bg-info/10 inline-flex items-center gap-1 rounded-md border bg-white px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        복원
                      </button>
                    )}
                  </div>
                </div>
                <div className="border-divider grid grid-cols-1 gap-3 border-t px-5 py-4 sm:grid-cols-3">
                  {[
                    { label: '템플릿 이름', value: selected.name },
                    {
                      label: '적용 팀 수',
                      value: `${selected.appliedTeamCount}팀`,
                    },
                    {
                      label: '기본 여부',
                      value: selected.isDefault ? 'ON (1개만 가능)' : 'OFF',
                    },
                  ].map((box) => (
                    <div
                      key={box.label}
                      className="border-border rounded-lg border px-3 py-2"
                    >
                      <p className="text-fg-subtle text-[10px] font-medium tracking-[0.6px]">
                        {box.label}
                      </p>
                      <p className="text-fg mt-0.5 truncate text-xs font-bold">
                        {box.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 항목 편집 카드 */}
              <div className="border-border bg-surface rounded-xl border">
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3.5">
                  <div>
                    <p className="text-fg text-sm font-bold">
                      항목 편집 — {selected.fields.length}항목
                    </p>
                    <p className="text-fg-subtle mt-1 text-[11px]">
                      항목명 · 설명/도움말 · 필수 여부 · 표시 순서 ·
                      타입(짧은/긴 텍스트)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFieldModal({ mode: 'add' })}
                    className="bg-brand-deep text-on-color hover:bg-brand-deep/90 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-bold"
                  >
                    <Plus className="h-3 w-3" />
                    항목 추가
                  </button>
                </div>
                {selected.fields.length === 0 ? (
                  <Empty
                    icon={<ListPlus />}
                    title="항목이 없어요"
                    description="'항목 추가'로 첫 항목을 구성해 주세요."
                  />
                ) : (
                  <ul className="divide-divider divide-y">
                    {selected.fields.map((field, index) => (
                      <li
                        key={field.fieldId}
                        className="flex items-center gap-3.5 px-5 py-3.5"
                      >
                        <span className="bg-brand/10 text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
                          {field.order}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-1.5">
                            <span className="text-fg text-[13px] font-bold">
                              {field.name}
                            </span>
                            <StatusBadge
                              label={field.required ? '필수' : '선택'}
                              tone={field.required ? 'danger' : 'neutral'}
                            />
                            <StatusBadge
                              label={FIELD_TYPE_META[field.type].label}
                              tone={FIELD_TYPE_META[field.type].tone}
                            />
                          </p>
                          {field.helpText && (
                            <p className="text-fg-subtle mt-0.5 text-[11px]">
                              {field.helpText}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => moveField(field, -1)}
                            disabled={index === 0 || updateFields.isPending}
                            aria-label={`${field.name} 위로 이동`}
                            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border bg-white p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(field, 1)}
                            disabled={
                              index === selected.fields.length - 1 ||
                              updateFields.isPending
                            }
                            aria-label={`${field.name} 아래로 이동`}
                            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border bg-white p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFieldModal({ mode: 'edit', field })
                            }
                            className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-md border bg-white px-2.5 py-1.5 text-[11px] font-bold"
                          >
                            <Pencil className="h-3 w-3" />
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteField(field)}
                            disabled={updateFields.isPending}
                            aria-label={`${field.name} 삭제`}
                            className="border-danger text-danger hover:bg-danger/10 rounded-md border bg-white p-1.5 disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 항목 타입 안내 · §31 */}
              <div className="bg-info-bg border-info/30 rounded-xl border p-4">
                <p className="text-fg flex items-center gap-1.5 text-[13px] font-bold">
                  <Info className="text-info h-3.5 w-3.5" />
                  항목 타입 안내
                </p>
                <p className="text-fg-muted mt-1.5 text-xs">
                  짧은 텍스트 — 주제·장소 보조 정보 / 긴 텍스트 — 진행 내용·다음
                  액션 / 선택형·점수형·체크리스트는 이번 범위 제외
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 반영 정책 · §31 — 기존 일지 스냅샷 보존·새 일지부터 적용 */}
      <div className="bg-warning-bg border-warning/40 mt-6 rounded-xl border p-5">
        <p className="text-fg text-sm font-bold">반영 정책</p>
        <ul className="text-fg-muted mt-2 flex flex-col gap-1 text-xs">
          <li>• 템플릿 수정은 기존 팀에 자동 반영되지 않습니다</li>
          <li>• 새로 배정되는 팀에만 최신 템플릿이 기본 적용됩니다</li>
          <li>
            • 기존 제출 일지·작성 중 초안은 작성 당시 항목 구조와 답변 스냅샷을
            보존하고, 변경은 새 일지부터 적용됩니다
          </li>
          <li>
            • 기존 팀에 반영하려면 팀별 일지 항목 설정에서 직접 수정합니다
          </li>
        </ul>
      </div>

      {templateFormOpen && (
        <TemplateFormModal
          open
          onClose={() => setTemplateFormOpen(false)}
          onCreated={setSelectedId}
        />
      )}
      {/* 항목 삭제 확인 — 새 일지부터 적용(스냅샷 보존) */}
      <ActionModal
        spec={deleteFieldSpec}
        onClose={() => setDeleteField(null)}
        onConfirm={removeField}
        pending={updateFields.isPending}
      />
      {fieldModal && selected && (
        <FieldFormModal
          open
          onClose={() => setFieldModal(null)}
          title={
            fieldModal.mode === 'add'
              ? `항목 추가 — ${selected.name}`
              : `항목 수정 — ${fieldModal.field!.name}`
          }
          initial={fieldModal.field}
          notice={TEMPLATE_NOTICE}
          pending={updateFields.isPending}
          onSubmit={submitFieldForm}
        />
      )}
    </div>
  )
}
