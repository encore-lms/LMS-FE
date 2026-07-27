import { inputClass } from '@/components/ui/inputClass'
import { isValidUrl } from '../types'
import { StepHead } from '../components/StepHead'

// 온보딩 Step 3 외부 URL — 블로그·GitHub 링크(선택). Figma 2197:15032.
export function LinksStep({
  blogUrl,
  githubUrl,
  onBlog,
  onGithub,
}: {
  blogUrl: string
  githubUrl: string
  onBlog: (v: string) => void
  onGithub: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <StepHead
        no="03"
        title="외부 URL을 연결해주세요"
        sub="블로그와 GitHub 주소를 등록하면 증명서와 마이 프로필에 학습 근거로 활용할 수 있습니다."
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-fg text-[13px] font-bold">외부 링크</span>
          <span className="text-fg-subtle text-[11px]">선택</span>
        </div>

        <div className="border-border flex flex-col gap-3 rounded-xl border p-4">
          <UrlField
            label="블로그 URL"
            value={blogUrl}
            onChange={onBlog}
            placeholder="https://your-blog.example.com/posts/..."
          />
          <UrlField
            label="GitHub URL"
            value={githubUrl}
            onChange={onGithub}
            placeholder="https://github.com/your-name"
          />
        </div>

        <span className="text-fg-subtle text-[11px]">
          ⓘ 외부 URL은 공개 설정에서 노출 여부를 다시 조정할 수 있습니다.
        </span>
      </div>
    </div>
  )
}

// URL 입력 한 칸 — 입력값이 있고 형식이 아니면 인라인 에러 노출(빈칸은 선택이라 허용).
function UrlField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const invalid = value.trim() !== '' && !isValidUrl(value)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-fg text-[12px] font-semibold">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid}
        className={inputClass({ size: 'md', invalid })}
      />
      {invalid && (
        <span className="text-danger text-[11px]">
          올바른 URL 형식이 아니에요. http:// 또는 https:// 로 시작해야 해요.
        </span>
      )}
    </div>
  )
}
