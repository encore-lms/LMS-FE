// 프로필 이미지 — 이니셜 아바타(기본) + 변경/기본 버튼. 실제 업로드는 BE 보류라 UI만(mock).
export function ProfileImageField({
  name,
  imageUrl,
}: {
  name: string
  imageUrl: string | null
}) {
  const initial = name.trim().charAt(0) || '?'
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
          JPG·PNG·WEBP · 최대 5MB · 정사각형 권장(권장 512×512)
        </span>
        <div className="mt-0.5 flex items-center gap-2">
          <button
            type="button"
            className="border-border text-fg hover:bg-surface-muted rounded-md border px-3 py-1 text-xs font-medium"
          >
            사진 변경
          </button>
          <button type="button" className="text-fg-muted hover:text-fg text-xs">
            기본 이미지로
          </button>
        </div>
      </div>
    </div>
  )
}
