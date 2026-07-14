import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Info,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import {
  apiErrorOf,
  useMentoringTeamDetail,
  useResetTeamLogFields,
  useSaveTeamLogFields,
  useTeamLogFields,
} from './api'
import {
  FIELD_TYPE_META,
  FIELD_DIFF_LABEL,
  requiredChangedLabel,
} from './statusMeta'
import {
  countFieldDiffs,
  fieldDiffStatus,
  newFieldId,
  restoredField,
} from './fieldDiff'
import { FieldFormModal, type FieldFormValues } from './FieldFormModal'
import type {
  AdminTeamLogField,
  AdminTeamLogFieldsData,
  TeamLogFieldDiffStatus,
} from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'

/** §32 보존 정책 — 항목 폼 모달 하단 안내. */
const TEAM_NOTICE =
  '이 팀에 한해 적용 — 저장 시 다음 일지부터 반영, 작성된 일지는 보존'

/** 정규화 — 순서 재부여(이동·복원 제거 후 1..N). */
const normalized = (fields: AdminTeamLogField[]) =>
  fields.map((f, i) => ({ ...f, order: i + 1 }))

// 팀별 일지 항목 설정 (/admin/mentoring/teams/:teamId/log-fields) — 운영(MANAGER/ADMIN).
// 기본 템플릿 오버라이드(§32) — 다음 일지부터 적용 · 작성된 일지 보존 · 템플릿 되돌리기.
// API 는 assignmentId(명세) — teamId 매핑은 배정 보드 조회로 해소. (Figma 2749:8024)
export default function TeamLogFieldsPage() {
  usePageHeader(
    '팀별 일지 항목 설정',
    '기본 템플릿과 다른 항목 표시 · 작성된 일지 보존 · 다음 일지부터 적용',
  )
  const { teamId } = useParams<{ teamId: string }>()
  // 팀 상세로 assignmentId를 해소한다 — 배정 보드는 단일 기수로 해석돼 다른 기수 팀을 못 찾음.
  const teamDetail = useMentoringTeamDetail(teamId ?? null)
  const assignmentId = teamDetail.data?.assignmentId ?? null
  const fieldsQuery = useTeamLogFields(assignmentId)
  const data = fieldsQuery.data

  return (
    <DataBoundary
      isPending={
        teamDetail.isPending || (!!assignmentId && fieldsQuery.isPending)
      }
      isError={teamDetail.isError || (!!assignmentId && fieldsQuery.isError)}
      onRetry={() =>
        teamDetail.isError ? teamDetail.refetch() : fieldsQuery.refetch()
      }
      skeleton={<SkeletonListPage columns={4} className="" />}
      errorTitle="팀 일지 항목을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {!teamDetail.data ? (
        <div className="p-8">
          <Empty
            icon={<AlertTriangle />}
            title="팀을 찾을 수 없어요"
            description="멘토 배정 관리에서 팀을 선택해 다시 진입해 주세요."
            action={
              <Link to="/admin/mentors/assignments" className={buttonClass()}>
                멘토 배정 관리로
              </Link>
            }
          />
        </div>
      ) : !assignmentId || !data ? (
        <div className="p-8">
          <Empty
            icon={<UserPlus />}
            title="멘토 배정 전 팀이에요"
            description="멘토 배정(N시간·기본 템플릿) 후 팀별 일지 항목을 설정할 수 있어요."
            action={
              <Link to="/admin/mentors/assignments" className={buttonClass()}>
                멘토 배정 관리로
              </Link>
            }
          />
        </div>
      ) : (
        <TeamLogFieldsBody data={data} />
      )}
    </DataBoundary>
  )
}

/** 로드 후 본문 — 편집 초안·저장 로직이 non-null 항목 데이터를 전제하므로 분리. */
function TeamLogFieldsBody({ data }: { data: AdminTeamLogFieldsData }) {
  const toast = useToast()
  const saveFields = useSaveTeamLogFields()
  const resetFields = useResetTeamLogFields()

  // 로컬 편집 초안 — null 이면 서버 저장본 그대로(저장 대기 없음).
  const [draft, setDraft] = useState<AdminTeamLogField[] | null>(null)
  const [fieldModal, setFieldModal] = useState<{
    mode: 'add' | 'edit'
    field?: AdminTeamLogField
  } | null>(null)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  const fields = useMemo(() => draft ?? data.fields, [draft, data.fields])
  const dirty = draft !== null
  const counts = useMemo(
    () => countFieldDiffs(fields, data.templateFields),
    [data.templateFields, fields],
  )
  const differs = counts.changed > 0 || counts.inactive > 0

  const update = (next: AdminTeamLogField[]) => setDraft(normalized(next))

  const submitFieldForm = (values: FieldFormValues) => {
    if (!fieldModal) return
    if (fieldModal.mode === 'add') {
      update([
        ...fields,
        {
          fieldId: newFieldId(),
          order: fields.length + 1,
          isActive: true,
          ...values,
        },
      ])
    } else {
      update(
        fields.map((f) =>
          f.fieldId === fieldModal.field!.fieldId ? { ...f, ...values } : f,
        ),
      )
    }
    setFieldModal(null)
  }

  const moveField = (field: AdminTeamLogField, dir: -1 | 1) => {
    const index = fields.findIndex((f) => f.fieldId === field.fieldId)
    const target = index + dir
    if (target < 0 || target >= fields.length) return
    const next = [...fields]
    ;[next[index], next[target]] = [next[target], next[index]]
    update(next)
  }

  const deactivateField = (field: AdminTeamLogField) =>
    update(
      fields.map((f) =>
        f.fieldId === field.fieldId ? { ...f, isActive: false } : f,
      ),
    )

  /** 템플릿 값 복원 — 템플릿 항목은 원본 값·활성으로, 신규 추가 항목은 제거. */
  const restoreField = (field: AdminTeamLogField) => {
    const restored = restoredField(field, data.templateFields)
    update(
      restored
        ? fields.map((f) => (f.fieldId === field.fieldId ? restored : f))
        : fields.filter((f) => f.fieldId !== field.fieldId),
    )
  }

  const save = () => {
    if (!dirty) return
    saveFields.mutate(
      { assignmentId: data.assignmentId, fields },
      {
        onSuccess: () => {
          setDraft(null)
          toast.success(
            '변경 저장 — 다음 일지부터 적용 · 작성된 일지는 그대로 보존',
          )
        },
        onError: (error) =>
          toast.danger(apiErrorOf(error).message ?? '저장에 실패했어요.'),
      },
    )
  }

  const reset = () =>
    resetFields.mutate(data.assignmentId, {
      onSuccess: () => {
        setDraft(null)
        setResetConfirmOpen(false)
        toast.success(
          `템플릿으로 되돌리기 — ${data.baseTemplateName} 기준으로 일괄 복원`,
        )
      },
      onError: (error) =>
        toast.danger(apiErrorOf(error).message ?? '되돌리기에 실패했어요.'),
    })

  const diffBadge = (
    status: TeamLogFieldDiffStatus,
    field: AdminTeamLogField,
  ) => {
    if (status === 'same') {
      return (
        <span className="bg-surface-muted text-fg-muted inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold whitespace-nowrap">
          <Check className="h-2.5 w-2.5" />
          {FIELD_DIFF_LABEL.same}
        </span>
      )
    }
    const label =
      status === 'required_changed'
        ? requiredChangedLabel(field.required)
        : FIELD_DIFF_LABEL[status]
    return (
      <span className="bg-warning text-on-color inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold whitespace-nowrap">
        <AlertTriangle className="h-2.5 w-2.5" />
        {label}
      </span>
    )
  }

  const columns: Column<AdminTeamLogField>[] = [
    {
      key: 'order',
      header: '순서',
      className: 'w-14',
      cell: (f) => (
        <span className="bg-brand/10 text-brand flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold">
          {f.order}
        </span>
      ),
    },
    {
      key: 'name',
      header: '항목명 · 설명',
      cell: (f) => (
        <div className="min-w-0">
          <p className="text-fg text-[13px] font-bold">{f.name}</p>
          {f.helpText && (
            <p className="text-fg-subtle mt-0.5 text-[11px]">{f.helpText}</p>
          )}
        </div>
      ),
    },
    {
      key: 'required',
      header: '필수',
      className: 'w-16',
      cell: (f) => (
        <StatusBadge
          label={f.required ? '필수' : '선택'}
          tone={f.required ? 'danger' : 'neutral'}
        />
      ),
    },
    {
      key: 'type',
      header: '타입',
      className: 'w-24',
      cell: (f) => (
        <StatusBadge
          label={FIELD_TYPE_META[f.type].label}
          tone={FIELD_TYPE_META[f.type].tone}
        />
      ),
    },
    {
      key: 'diff',
      header: '템플릿 대비',
      className: 'w-36',
      cell: (f) => diffBadge(fieldDiffStatus(f, data.templateFields), f),
    },
    {
      key: 'actions',
      header: '액션',
      align: 'right',
      className: 'w-64',
      cell: (f) => {
        const status = fieldDiffStatus(f, data.templateFields)
        const index = fields.findIndex((x) => x.fieldId === f.fieldId)
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setFieldModal({ mode: 'edit', field: f })}
              className="border-border text-fg-muted hover:bg-surface-muted bg-surface inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap"
            >
              <Pencil className="h-3 w-3" />
              수정
            </button>
            <button
              type="button"
              onClick={() => moveField(f, -1)}
              disabled={index === 0}
              aria-label={`${f.name} 위로 이동`}
              className="border-border text-fg-muted hover:bg-surface-muted bg-surface shrink-0 rounded-md border p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => moveField(f, 1)}
              disabled={index === fields.length - 1}
              aria-label={`${f.name} 아래로 이동`}
              className="border-border text-fg-muted hover:bg-surface-muted bg-surface shrink-0 rounded-md border p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
            {status === 'same' ? (
              <button
                type="button"
                onClick={() => deactivateField(f)}
                className="border-danger text-danger hover:bg-danger/10 bg-surface inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap"
              >
                <XCircle className="h-3 w-3" />
                비활성화
              </button>
            ) : (
              <button
                type="button"
                onClick={() => restoreField(f)}
                title="템플릿 값으로 복원"
                className="border-info text-info hover:bg-info/10 bg-surface inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap"
              >
                <RotateCcw className="h-3 w-3" />
                복원
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-8">
      {/* 상단 — 뒤로가기(멘토 배정 관리) + 현재 위치 + 템플릿 대비 상태 칩 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            to="/admin/mentors/assignments"
            className="border-border text-fg-muted hover:bg-surface-muted bg-surface inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-bold"
          >
            <ArrowLeft className="h-3 w-3" />
            멘토 배정 관리
          </Link>
          <span className="text-fg-subtle text-[13px]">›</span>
          <span className="text-fg text-xs font-medium">팀별 일지 항목</span>
        </div>
        {differs && (
          <span className="bg-warning-bg text-warning inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold">
            <Info className="h-3 w-3" />
            기본 템플릿과 다름
          </span>
        )}
      </div>

      {/* Hero — 팀 컨텍스트 + 되돌리기/저장 CTA */}
      <div className="bg-brand shadow-hero flex flex-wrap items-center justify-between gap-4 rounded-2xl px-7 py-6">
        <div className="flex flex-col gap-2.5">
          <span className="bg-surface text-fg w-fit rounded px-2 py-0.5 text-[10px] font-bold">
            {data.cohortName}
          </span>
          <p className="text-on-color text-lg font-bold">
            {data.teamName} · 일지 항목 설정
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-surface text-fg inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold">
              <Star className="text-warning h-3 w-3" />
              멘토 {data.mentorName} · 팀원 {data.memberCount}명
            </span>
            <span className="bg-surface text-fg rounded-md px-2.5 py-1 text-[11px] font-bold">
              기본 템플릿 — {data.baseTemplateName}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            disabled={resetFields.isPending || (!differs && !dirty)}
            className="border-on-color/60 text-on-color hover:bg-surface/10 inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            템플릿으로 되돌리기
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saveFields.isPending}
            className="bg-surface text-fg hover:bg-surface/90 inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {saveFields.isPending ? '저장 중…' : '변경 저장'}
          </button>
        </div>
      </div>

      {/* 변경 대기 배너 — 템플릿 대비 diff + 저장 대기 상태 */}
      {(differs || dirty) && (
        <div className="bg-warning-bg border-warning/50 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <span className="bg-surface text-warning flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Info className="h-5 w-5" />
            </span>
            <div>
              <p className="text-fg text-[13px] font-bold">
                기본 템플릿과 다른 항목 {counts.changed}건
                {dirty && ' — 변경 사항 저장 대기'}
              </p>
              <p className="text-fg-muted mt-0.5 text-xs">
                저장 시 다음 일지부터 적용 · 이미 작성된 일지는 작성 당시 항목
                구조와 답변을 그대로 보존
              </p>
            </div>
          </div>
          <span className="bg-warning text-on-color rounded-md px-2.5 py-1 text-[11px] font-bold">
            {counts.changed} 변경
          </span>
        </div>
      )}

      {/* 팀 일지 항목 편집 테이블 */}
      <div className="mt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-fg text-sm font-bold">팀 일지 항목 편집</p>
            <p className="text-fg-subtle mt-1 text-[11px]">
              템플릿 대비 차이가 있는 항목은 &quot;변경됨&quot; 배지로 표시 ·
              항목 추가·비활성화 가능
            </p>
          </div>
          <Button size="sm" onClick={() => setFieldModal({ mode: 'add' })}>
            <Plus className="h-3 w-3" />
            항목 추가
          </Button>
        </div>
        <DataTable
          columns={columns}
          rows={fields}
          rowKey={(f) => f.fieldId}
          rowClassName={(f) => {
            const status = fieldDiffStatus(f, data.templateFields)
            return cn(
              status !== 'same' &&
                'border-l-warning bg-warning-bg/40 border-l-4',
              status === 'disabled' && 'opacity-70',
            )
          }}
          empty="활성 항목이 없어요 — 항목을 추가해 주세요"
        />
        <div className="text-fg-subtle mt-3 text-xs">
          총 {counts.total}항목 · 활성 {counts.active} · 비활성{' '}
          {counts.inactive} · 변경 {counts.changed}
        </div>
      </div>

      {fieldModal && (
        <FieldFormModal
          open
          onClose={() => setFieldModal(null)}
          title={
            fieldModal.mode === 'add'
              ? `항목 추가 — ${data.teamName}`
              : `항목 수정 — ${fieldModal.field!.name}`
          }
          initial={fieldModal.field}
          // §32 수정 가능 항목에 타입 없음 — 템플릿 유래 기존 항목은 타입 잠금(신규 추가 항목은 허용)
          typeEditable={
            fieldModal.mode === 'add' ||
            !data.templateFields.some(
              (t) => t.fieldId === fieldModal.field!.fieldId,
            )
          }
          notice={TEAM_NOTICE}
          onSubmit={submitFieldForm}
        />
      )}

      {/* 되돌리기 확인 — 파괴적 일괄 복원(확인 모달 frame 미존재 — 가드 목적 신설) */}
      <Modal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="템플릿으로 되돌리기"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setResetConfirmOpen(false)}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-sm font-bold"
            >
              취소
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={resetFields.isPending}
              className="bg-danger text-on-color hover:bg-danger/90 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetFields.isPending ? '복원 중…' : '일괄 복원'}
            </button>
          </>
        }
      >
        <p className="text-fg-muted text-sm">
          이 팀의 수정 사항을 일괄 복원해 기본 템플릿(
          <span className="text-fg font-bold">{data.baseTemplateName}</span>
          )과 동일하게 되돌립니다. 작성된 일지·답변은 그대로 보존됩니다.
        </p>
      </Modal>
    </div>
  )
}
