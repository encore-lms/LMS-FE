import { StepHead } from '../components/StepHead'

// 온보딩 Step 3 외부 URL — 블로그·GitHub 링크(선택). Figma 2197:15032.
const inputCls =
  'border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand w-full rounded-lg border px-4 py-3 text-[13px] focus:outline-none'

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
          <div className="flex flex-col gap-1.5">
            <span className="text-fg text-[12px] font-semibold">
              블로그 URL
            </span>
            <input
              value={blogUrl}
              onChange={(e) => onBlog(e.target.value)}
              placeholder="https://your-blog.example.com/posts/..."
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-fg text-[12px] font-semibold">
              GitHub URL
            </span>
            <input
              value={githubUrl}
              onChange={(e) => onGithub(e.target.value)}
              placeholder="https://github.com/your-name"
              className={inputCls}
            />
          </div>
        </div>

        <span className="text-fg-subtle text-[11px]">
          ⓘ 외부 URL은 공개 설정에서 노출 여부를 다시 조정할 수 있습니다.
        </span>
      </div>
    </div>
  )
}
