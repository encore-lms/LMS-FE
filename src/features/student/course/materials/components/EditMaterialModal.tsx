import { useEffect, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/inputClass'
import { useToast } from '@/components/ui/use-toast'
import { useUpdateMaterial } from '../../../api/course'
import type { MaterialItem } from '../../types'

// 본인이 올린 자료 수정 — 제목·설명·주차를 고치고 첨부(파일/링크)도 교체할 수 있다.
// 안 건드린 칸은 보내지 않아야 서버가 기존 값을 유지한다(빈 값으로 밀지 않게).
function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-fg text-[13px] font-semibold">
        {label}
        {hint && (
          <span className="text-fg-subtle ml-1.5 font-normal">{hint}</span>
        )}
      </span>
      {children}
    </label>
  )
}

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

  // 대상이 바뀌면 폼을 그 자료의 현재 값으로 되돌린다.
  useEffect(() => {
    if (!item) return
    setTitle(item.title)
    setBody(item.body ?? '')
    setWeek(item.week ?? '')
    setLink(item.isExternalLink ? (item.fileUrl ?? '') : '')
    setFile(null)
  }, [item])

  if (!item) return null

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
        // 첨부는 바꾼 것만 보낸다 — 둘 다 비우면 기존 첨부를 그대로 둔다.
        ...(file ? { file } : {}),
        ...(!file && link.trim() && link.trim() !== item.fileUrl
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

  return (
    <Modal open onClose={onClose} title="자료 수정" size="md">
      <div className="flex flex-col gap-4">
        <Field label="제목">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass()}
          />
        </Field>

        <Field label="관련 주차/과목" hint="선택">
          <input
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            placeholder="예) 9주차 · Spring Boot"
            className={inputClass()}
          />
        </Field>

        <Field label="설명" hint="선택">
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="자료를 보는 사람이 알면 좋은 맥락을 짧게 적어 주세요."
            className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-[88px] w-full rounded-[10px] border p-3.5 text-[13px] outline-none"
          />
        </Field>

        <Field
          label="첨부 교체"
          hint={file || link ? undefined : '비워 두면 그대로'}
        >
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setLink('')
              }}
              className="text-fg-muted text-[13px]"
            />
            <input
              value={link}
              onChange={(e) => {
                setLink(e.target.value)
                setFile(null)
                if (fileRef.current) fileRef.current.value = ''
              }}
              placeholder="또는 링크 주소로 교체"
              className={inputClass()}
            />
            {(file || link) && (
              <p className="text-fg-subtle text-[12px]">
                {file
                  ? `파일로 교체: ${file.name}`
                  : '링크로 교체 — 저장된 파일은 삭제됩니다'}
              </p>
            )}
          </div>
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-fg-muted hover:text-fg px-3 py-2 text-[13px] font-medium"
          >
            취소
          </button>
          <Button onClick={submit} disabled={update.isPending}>
            저장
          </Button>
        </div>
      </div>
    </Modal>
  )
}
