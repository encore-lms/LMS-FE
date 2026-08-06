import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { useUploadLogImage } from '../api/logs'
import { LogImage } from './LogImage'

/**
 * 이미지 항목 입력 — 올린 즉시 서버에 저장하고 받은 id 를 답변 값으로 들고 있는다.
 *
 * <p>제출 전에 업로드가 끝나야 서버가 일지에 이을 수 있다. 값은 쉼표로 이은 id 목록이라
 * 텍스트 답변과 같은 자리(answers)에 그대로 실린다.</p>
 */
export function LogImageField({
  value,
  onChange,
  label,
  disabled,
}: {
  /** 쉼표로 이은 이미지 id 목록. 빈 문자열이면 첨부 없음. */
  value: string
  onChange: (next: string) => void
  label: string
  disabled?: boolean
}) {
  const toast = useToast()
  const upload = useUploadLogImage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)

  const ids = value ? value.split(',').filter(Boolean) : []

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setPending(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const result = await upload.mutateAsync(file)
        uploaded.push(result.imageId)
      }
      onChange([...ids, ...uploaded].join(','))
    } catch {
      toast.danger('이미지를 올리지 못했어요 (10MB 이하 이미지 파일만 가능)')
    } finally {
      setPending(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeAt = (imageId: string) =>
    onChange(ids.filter((id) => id !== imageId).join(','))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {ids.map((imageId) => (
          <div
            key={imageId}
            className="border-border relative h-24 w-24 overflow-hidden rounded-lg border"
          >
            <LogImage
              imageId={imageId}
              alt={`${label} 첨부`}
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(imageId)}
                aria-label={`${label} 첨부 삭제`}
                className="bg-fg/70 text-on-color absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}

        {!disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className={cn(
              'border-border text-fg-muted hover:text-fg flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-[11px] font-medium',
              pending && 'opacity-60',
            )}
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {pending ? '올리는 중…' : '이미지 추가'}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        aria-label={`${label} 이미지 선택`}
        className="hidden"
        onChange={(e) => void pick(e.target.files)}
      />
    </div>
  )
}
