import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { useUpdateMaterial } from '../../../api/course'
import type { MaterialItem } from '../../types'
import { badgeFor, fmtSize, UPLOAD_HINT } from './materialForm'

// 자료 수정 모달 — 공유 모달과 같은 레이아웃을 쓴다(같은 자료를 다루는 폼이 서로 달라 보이면
// 어느 쪽이 무엇을 바꾸는지 헷갈린다). 다만 파일↔링크 형식 전환은 막는다:
// 목록 배지·아이콘·다운로드 경로가 형식에 묶여 있어, 형식이 바뀌면 이미 공유된 자료가 다른 것이 된다.
export function EditMaterialModal({
  item,
  onClose,
  onUpdated,
}: {
  item: MaterialItem | null
  onClose: () => void
  onUpdated?: () => void
}) {
  const toast = useToast()
  const update = useUpdateMaterial()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [week, setWeek] = useState('')
  const [link, setLink] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // 대상이 바뀌면 폼을 그 자료의 현재 값으로 되돌린다.
  useEffect(() => {
    if (!item) return
    setTitle(item.title)
    setBody(item.body ?? '')
    setWeek(item.week ?? '')
    setLink(item.isExternalLink ? (item.fileUrl ?? '') : '')
    setFile(null)
    setDragOver(false)
  }, [item])

  if (!item) return null

  const isLink = !!item.isExternalLink
  const pick = (list: FileList | null) => {
    const picked = list?.[0]
    if (picked) setFile(picked)
  }
  const onPick = (e: ChangeEvent<HTMLInputElement>) => pick(e.target.files)
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    pick(e.dataTransfer.files)
  }

  const submit = () => {
    if (!title.trim()) {
      toast.danger('제목을 입력해 주세요')
      return
    }
    update.mutate(
      {
        id: item.id,
        title: title.trim(),
        body,
        week,
        // 첨부는 바꾼 것만 보낸다 — 비워 두면 기존 첨부를 그대로 둔다.
        ...(!isLink && file ? { file } : {}),
        ...(isLink && link.trim() && link.trim() !== item.fileUrl
          ? { fileUrl: link.trim() }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success('자료를 수정했어요')
          onUpdated?.()
          onClose()
        },
        onError: () => toast.danger('자료를 수정하지 못했어요'),
      },
    )
  }

  const badge = badgeFor(item.fileName ?? item.title)

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="자료 수정"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={update.isPending}
            className={cn(
              buttonClass({ size: 'md' }),
              update.isPending && 'pointer-events-none opacity-60',
            )}
          >
            {update.isPending ? '저장 중…' : '저장'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-fg-muted -mt-1 text-[13px]">
          본인이 공유한 자료의 제목·설명과 첨부를 수정합니다.
        </p>

        {/* 형식 고정 안내 — 공유 모달의 탭 자리에 대응한다. */}
        <div className="bg-surface-muted flex items-center justify-between gap-3 rounded-[10px] px-3.5 py-2.5">
          <span className="text-fg text-[13px] font-semibold">
            {isLink ? '링크 공유' : '파일 업로드'}
          </span>
          <span className="text-fg-subtle text-[12px]">
            공유 형식은 바꿀 수 없어요
          </span>
        </div>

        <Field label="제목">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) JPA N+1 문제 정리 노트"
            className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="관련 주차/과목">
            <input
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              placeholder="예) 9주차 · Spring Boot"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
            />
          </Field>
          <Field label="카테고리">
            <div className="border-border bg-surface-muted text-fg-muted flex h-11 w-full items-center rounded-[10px] border px-3.5 text-[13px]">
              학생 공유
            </div>
          </Field>
        </div>

        <Field label="설명">
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="자료를 보는 사람이 알면 좋은 맥락을 짧게 적어 주세요."
            className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-[88px] w-full rounded-[10px] border p-3.5 text-[13px] outline-none"
          />
        </Field>

        {isLink ? (
          <Field label="공유 링크">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://github.com/... 또는 블로그 URL"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
            />
          </Field>
        ) : (
          <Field label="첨부 파일">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={onPick}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1.5 rounded-[10px] border border-dashed p-5 text-center transition-colors',
                dragOver
                  ? 'border-brand bg-brand/5'
                  : 'border-border bg-surface-muted/40 hover:bg-surface-muted/70',
              )}
            >
              <span className="bg-brand/10 text-brand mb-0.5 flex size-9 items-center justify-center rounded-full text-base">
                ↑
              </span>
              <span className="text-fg text-[13px] font-medium">
                새 파일로 교체하려면 드래그하거나 클릭하세요
              </span>
              <span className="text-fg-subtle text-[11px]">{UPLOAD_HINT}</span>
            </div>

            {/* 현재 첨부 또는 교체할 파일 — 무엇이 저장될지 항상 보이게 한다. */}
            <div className="border-border bg-surface mt-2 flex items-center gap-3 rounded-[10px] border p-3">
              <span
                className={cn(
                  'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
                  file ? badgeFor(file.name).cls : badge.cls,
                )}
              >
                {file ? badgeFor(file.name).label : badge.label}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-fg truncate text-[13px] font-medium">
                  {file ? file.name : (item.fileName ?? item.title)}
                </span>
                <span className="text-fg-subtle text-[11px]">
                  {file
                    ? `${fmtSize(file.size)} · 이 파일로 교체됩니다`
                    : '현재 첨부 — 바꾸지 않으면 그대로 유지됩니다'}
                </span>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  className="text-danger shrink-0 text-[12px] font-semibold hover:underline"
                >
                  취소
                </button>
              )}
            </div>
          </Field>
        )}
      </div>
    </Modal>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-fg text-[13px] font-semibold">{label}</label>
      {children}
    </div>
  )
}
