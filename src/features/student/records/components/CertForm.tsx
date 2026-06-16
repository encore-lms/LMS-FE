import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Award, Check, Upload, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { CertFormData, CertType } from '../types'
import { Crumbs, FieldLabel, FormatRow, FormBar, TextInput } from './FormParts'
import { useFileUpload } from './useFileUpload'

const TYPES: { key: CertType; name: string; sub: string }[] = [
  { key: 'PCCE', name: 'PCCE', sub: 'Python 기초' },
  { key: 'PCCP', name: 'PCCP', sub: 'Python 중급' },
  { key: 'PCSQL', name: 'PCSQL', sub: 'SQL 개발자' },
]

const COPY = {
  create: {
    crumbs: ['기록실', '자격증', '새 등록'],
    title: '자격증 등록',
    sub: '인증 가능한 자격증(PCCE/PCCP/PCSQL) 취득 사진을 등록',
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
}: {
  mode: 'create' | 'edit'
  initial?: CertFormData
}) {
  const navigate = useNavigate()
  const c = COPY[mode]
  const [certType, setCertType] = useState<CertType>(
    initial?.certType ?? 'PCCP',
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
  const valid = !!(certType && title.trim() && file)

  const submit = () => {
    if (!valid) return
    navigate(
      mode === 'edit'
        ? '/student/records?toast=cert-updated'
        : '/student/records',
    )
  }

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    replace(e.target.files)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <Crumbs items={c.crumbs} />

      {mode === 'edit' && initial?.rejectReason && (
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
        <FieldLabel required hint="인증 가능한 3종">
          자격증 종류
        </FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        <FieldLabel required hint="이미지 파일 · 최대 30MB">
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
                <div className="flex flex-1 flex-col gap-0.5">
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
        note={valid ? '● 종류·제목·파일 모두 입력됨' : undefined}
        submitLabel={c.submit}
        onSubmit={submit}
        disabled={!valid}
        footer={c.footer}
      />
    </div>
  )
}
