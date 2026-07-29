import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Award, Check, Upload, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { CertFormData, CertType } from '../types'
import { useCreateCertRecord, useUpdateCertRecord } from '../../api/records'
import { Crumbs, FieldLabel, FormatRow, FormBar, TextInput } from './FormParts'
import { useFileUpload } from './useFileUpload'
import { useUploadRecordAttachments } from '../../api/records'

const TYPES: { key: CertType; name: string; sub: string }[] = [
  { key: 'PCCE', name: 'PCCE', sub: 'Python 기초' },
  { key: 'PCCP', name: 'PCCP', sub: 'Python 중급' },
  { key: 'PCSQL', name: 'PCSQL', sub: 'SQL 개발자' },
  { key: 'OTHER', name: '기타', sub: '직접 입력' },
]

const COPY = {
  create: {
    crumbs: ['기록실', '자격증', '새 등록'],
    title: '자격증 등록',
    sub: '자격증(PCCE·PCCP·PCSQL 또는 기타) 취득 증빙을 등록',
    back: '이전·취소',
    submit: '제출',
    footer:
      '제출 후 검토에서 사진과 자격증 종류·취득 일자를 확인합니다. 반려 시 사유와 함께 기록실 자격증에 표시됩니다.',
  },
  edit: {
    crumbs: ['기록실', '자격증', '수정'],
    title: '자격증 기록 수정',
    sub: '반려된 자격증 기록을 보완해 다시 제출',
    back: '목록으로',
    submit: '재제출',
    footer: '수정 제출 후에는 운영 검토 상태로 전환됩니다.',
  },
}

export function CertForm({
  mode,
  initial,
  recordId,
  isDraft = false,
}: {
  mode: 'create' | 'edit'
  initial?: CertFormData
  recordId?: string
  /** 임시저장(작성 중) 기록 수정 중인지 — true면 저장 시 임시저장으로 유지(반려 재제출과 구분) */
  isDraft?: boolean
}) {
  const navigate = useNavigate()
  const c = COPY[mode]
  const createMutation = useCreateCertRecord()
  const updateMutation = useUpdateCertRecord(recordId ?? '')
  // 새로 고른 파일만 올린다 — 기존 첨부(서버 저장분)는 file 이 없다.
  const uploadMutation = useUploadRecordAttachments()
  const pendingFiles = () =>
    files.map((f) => f.file).filter((f): f is File => !!f)
  const uploadThen = async (id: string, done: () => void) => {
    const list = pendingFiles()
    if (list.length > 0) {
      await uploadMutation.mutateAsync({ id, files: list }).catch(() => {})
    }
    done()
  }
  const [certType, setCertType] = useState<CertType>(
    initial?.certType ?? 'PCCP',
  )
  const [otherCertName, setOtherCertName] = useState(
    initial?.otherCertName ?? '',
  )
  const [title, setTitle] = useState(initial?.title ?? '')
  // 단일 첨부 — 수정 시 기존 파일로 시드.
  const { files, replace, remove } = useFileUpload(
    initial?.fileName
      ? [
          {
            id: 'existing',
            name: initial.fileName,
            size: initial.fileSize ?? '',
          },
        ]
      : [],
  )
  usePageHeader(c.title, c.sub)

  const file = files[0]
  const otherValid = certType !== 'OTHER' || !!otherCertName.trim()
  // 증빙 파일 외 핵심 입력 — 임시저장 기준. 제출은 여기에 증빙 파일이 더 필요.
  const baseValid = !!(certType && title.trim() && otherValid)
  const valid = baseValid && !!file
  const otherName = certType === 'OTHER' ? otherCertName.trim() : undefined

  const submit = () => {
    if (!valid) return
    // 제출은 검토 중으로 전환(등록·수정 공통). 수정은 변경 반영.
    if (mode === 'edit') {
      updateMutation.mutate(
        { certType, title, otherCertName: otherName, draft: false },
        {
          onSuccess: () =>
            uploadThen(recordId ?? '', () =>
              navigate('/student/records?toast=cert-updated'),
            ),
        },
      )
      return
    }
    createMutation.mutate(
      { certType, title, otherCertName: otherName, draft: false },
      {
        onSuccess: (created) =>
          uploadThen(created.id, () =>
            navigate('/student/records?toast=cert-created'),
          ),
      },
    )
  }

  // 임시저장 — 증빙 없이도 저장(작성 중·본인만). 등록 또는 임시저장 기록 수정에서 사용.
  const saveDraft = () => {
    if (!baseValid) return
    if (mode === 'edit') {
      updateMutation.mutate(
        { certType, title, otherCertName: otherName, draft: true },
        {
          onSuccess: () =>
            uploadThen(recordId ?? '', () =>
              navigate('/student/records?toast=cert-saved'),
            ),
        },
      )
      return
    }
    createMutation.mutate(
      { certType, title, otherCertName: otherName, draft: true },
      {
        onSuccess: (created) =>
          uploadThen(created.id, () =>
            navigate('/student/records?toast=cert-saved'),
          ),
      },
    )
  }
  // 임시저장은 등록·수정(반려 재제출 포함) 어디서든 가능.
  const canSaveDraft = true

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    replace(e.target.files)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <Crumbs items={c.crumbs} />

      {mode === 'edit' && !isDraft && initial?.rejectReason && (
        <div className="border-danger/40 bg-danger-bg/50 flex flex-col gap-1 rounded-[14px] border p-4">
          <span className="text-danger flex items-center gap-1.5 text-[13px] font-bold">
            <AlertTriangle className="size-3.5 shrink-0" />
            {initial.rejectReason.title}
          </span>
          <span className="text-fg-muted text-[12px] leading-5">
            {initial.rejectReason.detail}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FieldLabel
          required
          hint="프리셋 3종(PCCE·PCCP·PCSQL) + 기타 직접 입력"
        >
          자격증 종류
        </FieldLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TYPES.map((t) => {
            const on = t.key === certType
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setCertType(t.key)}
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-2xl border p-5 text-center transition-colors',
                  on
                    ? 'border-brand bg-brand text-white'
                    : 'border-border bg-surface text-fg hover:border-brand/50',
                )}
              >
                {on && (
                  <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-white/25">
                    <Check className="size-3" />
                  </span>
                )}
                <span className="text-[16px] font-bold">{t.name}</span>
                <span
                  className={cn(
                    'text-[12px]',
                    on ? 'text-white/80' : 'text-fg-muted',
                  )}
                >
                  {t.sub}
                </span>
              </button>
            )
          })}
        </div>
        {certType === 'OTHER' && (
          <TextInput
            value={otherCertName}
            onChange={(e) => setOtherCertName(e.target.value)}
            placeholder="자격증명을 직접 입력하세요 (예: 정보처리기사)"
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel required>제목</FieldLabel>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) PCCP Lv.2 합격"
        />
      </div>

      {/* 증빙 파일 업로드 (단일) */}
      <div className="flex flex-col gap-2">
        <FieldLabel hint="제출 시 필요 · 임시저장은 증빙 없이 가능">
          증빙 파일
        </FieldLabel>
        <FormatRow />
        <div className="border-brand/50 bg-brand/5 mt-1 flex flex-col gap-3 rounded-2xl border border-dashed p-6">
          {file ? (
            <>
              <div className="border-border bg-surface flex items-center gap-3 rounded-[12px] border p-4">
                <span className="bg-brand/10 text-brand flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                  {file.previewUrl ? (
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Award className="size-5" />
                  )}
                </span>
                {/* min-w-0 없으면 파일명 span의 truncate가 먹지 않는다 */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="bg-warning-bg text-warning w-fit rounded px-2 py-0.5 text-[10px] font-bold">
                    ● CERTIFICATE
                  </span>
                  <span className="text-fg truncate text-[14px] font-bold">
                    {file.name}
                  </span>
                  <span className="text-fg-subtle text-[11px]">
                    {file.size ? `${file.size} · ` : ''}첨부됨
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(file.id)}
                  aria-label="제거"
                  className="text-fg-subtle hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              </div>
              <label className="text-brand flex cursor-pointer items-center justify-center gap-1 text-[12px] font-semibold">
                다른 파일로 교체
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPick}
                />
              </label>
            </>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 py-4">
              <span className="border-brand text-brand flex size-11 items-center justify-center rounded-full border">
                <Upload className="size-[18px]" />
              </span>
              <span className="text-fg text-[14px] font-bold">
                합격 화면 캡처를 클릭해 업로드
              </span>
              <span className="text-fg-subtle text-[12px]">
                이미지 파일 · 최대 30MB
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPick}
              />
            </label>
          )}
        </div>
      </div>

      <FormBar
        backLabel={c.back}
        onBack={() => navigate('/student/records')}
        note={
          valid
            ? '● 제출 가능'
            : baseValid
              ? '증빙 추가 시 제출 가능 · 지금은 임시저장'
              : undefined
        }
        submitLabel={c.submit}
        onSubmit={submit}
        disabled={
          !valid || createMutation.isPending || updateMutation.isPending
        }
        secondaryLabel={canSaveDraft ? '임시저장' : undefined}
        onSecondary={canSaveDraft ? saveDraft : undefined}
        secondaryDisabled={
          !baseValid || createMutation.isPending || updateMutation.isPending
        }
        footer={c.footer}
      />
    </div>
  )
}
