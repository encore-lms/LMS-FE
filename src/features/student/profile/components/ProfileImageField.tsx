import { useRef, type ChangeEvent } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import type { ProfileFormValues } from '../profileSchema'
import { useToast } from '@/components/ui/use-toast'

// 프로필 이미지 — 이니셜 아바타(기본) + 사진 변경(파일 선택→미리보기)/기본 이미지로.
// 폼 필드(profileImageUrl)에 data URL을 써서 변경 시 dirty 처리·저장에 포함된다.
const MAX_BYTES = 5 * 1024 * 1024

export function ProfileImageField({ name }: { name: string }) {
  const { control, setValue } = useFormContext<ProfileFormValues>()
  const imageUrl = useWatch({ control, name: 'profileImageUrl' })
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const initial = name.trim().charAt(0) || '?'

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 다시 선택 가능하도록 초기화
    if (!file) return
    if (file.size > MAX_BYTES) {
      toast.danger('5MB 이하 이미지만 올릴 수 있어요')
      return
    }
    const reader = new FileReader()
    reader.onload = () =>
      setValue('profileImageUrl', reader.result as string, {
        shouldDirty: true,
      })
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="bg-accent-strong flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="size-16 object-cover" />
        ) : (
          initial
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-fg text-[13px] font-bold">프로필 이미지</span>
        <span className="text-fg-subtle text-xs">
          JPG·PNG·WEBP 최대 5MB · 정사각형 권장
        </span>
        <div className="mt-0.5 flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="border-border text-fg hover:bg-surface-muted rounded-md border px-3 py-1 text-xs font-medium"
          >
            사진 변경
          </button>
          <button
            type="button"
            onClick={() =>
              setValue('profileImageUrl', null, { shouldDirty: true })
            }
            className="text-fg-muted hover:text-fg text-xs"
          >
            기본 이미지로
          </button>
        </div>
      </div>
    </div>
  )
}
