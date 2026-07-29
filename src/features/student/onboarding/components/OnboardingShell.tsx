import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Stepper } from './Stepper'
import { isValidUrl, type OnboardingStep } from '../types'

// 온보딩 풀스크린 셸 — 자체 헤더·히어로·스테퍼·미리보기·푸터(앱 셸 밖). Figma 225:27.
export function OnboardingShell({
  step,
  skills,
  blogUrl,
  githubUrl,
  onBlog,
  onGithub,
  children,
}: {
  step: OnboardingStep
  skills: string[]
  blogUrl: string
  githubUrl: string
  onBlog: (v: string) => void
  onGithub: (v: string) => void
  children: ReactNode
}) {
  return (
    <div className="bg-surface relative min-h-screen overflow-hidden">
      {/* 장식 원 */}
      <span className="bg-brand/10 pointer-events-none absolute -top-40 -right-32 size-[420px] rounded-full" />
      <span className="bg-brand/10 pointer-events-none absolute -bottom-40 -left-32 size-[360px] rounded-full" />

      {/* 헤더 */}
      <header className="relative flex items-center justify-between px-10 py-6">
        <div className="flex flex-col">
          <span className="text-[20px] font-extrabold tracking-tight">
            <span className="text-brand">PLAY</span>{' '}
            <span className="text-accent-strong">DATA</span>
          </span>
          <span className="text-fg-subtle text-[10px]">
            Learning Management System
          </span>
        </div>
        <span className="text-fg-muted flex items-center gap-1.5 text-[13px] font-medium">
          <span className="bg-brand size-2 rounded-full" />
          한국어 ▾
        </span>
      </header>

      {/* 본문 */}
      <main className="relative mx-auto flex max-w-[660px] flex-col items-center gap-6 px-4 pb-16">
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-[11px] font-bold tracking-wider">
            WELCOME
          </span>
          <h1 className="text-fg text-[30px] leading-tight font-bold">
            환영합니다! 학습 시작 전
            <br />몇 가지만 알려주세요
          </h1>
          <p className="text-fg-muted max-w-[520px] text-[13px]">
            다짐과 스킬, 외부 링크를 입력하면 학습 시작 상태가 확정됩니다.
            입력은 마이 프로필에서 언제든 보완할 수 있어요.
          </p>
        </div>

        <Stepper current={step} />

        {/* 단계 카드 */}
        <div className="border-border bg-surface w-full rounded-2xl border p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
          {children}
        </div>

        {/* 입력 미리보기 — 위 단계에서 선택·입력한 값이 실시간 반영됩니다. */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <PreviewCard
            no="STEP 02"
            title="관심 스킬 선택"
            sub="Skill 마스터에서 다중 선택할 수 있어요."
          >
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="bg-brand/10 text-brand rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-fg-subtle text-[11px]">
                아직 선택한 스킬이 없어요.
              </span>
            )}
          </PreviewCard>
          <PreviewCard
            no="STEP 03"
            title="외부 URL 등록"
            sub="블로그·GitHub 링크를 등록하세요. 선택 입력합니다."
          >
            <div className="flex flex-col gap-2">
              <UrlPreviewInput
                label="블로그 URL"
                value={blogUrl}
                onChange={onBlog}
              />
              <UrlPreviewInput
                label="GitHub URL"
                value={githubUrl}
                onChange={onGithub}
              />
            </div>
          </PreviewCard>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="text-fg-subtle relative flex flex-col items-center gap-1 pb-10 text-[11px]">
        <div className="flex items-center gap-3">
          <span>이용안내</span>
          <span>|</span>
          <span>개인정보처리방침</span>
          <span>|</span>
          <span>고객센터</span>
        </div>
        <span>© 2026 PLAYDATA. All rights reserved.</span>
      </footer>
    </div>
  )
}

function PreviewCard({
  no,
  title,
  sub,
  children,
}: {
  no: string
  title: string
  sub: string
  children: ReactNode
}) {
  return (
    <div className="border-border bg-surface flex flex-col gap-2 rounded-2xl border p-5">
      <span className="text-fg-subtle text-[10px] font-bold tracking-wider">
        {no}
      </span>
      <span className="text-fg text-[14px] font-bold">{title}</span>
      <span className="text-fg-subtle text-[11px]">{sub}</span>
      <div className="pt-1">{children}</div>
    </div>
  )
}

// 외부 URL 미리보기 입력 — 상단 단계 입력과 같은 state 에 양방향 바인딩(실시간 동기화).
// 입력값이 있고 형식이 아니면 경고색으로 표시(빈칸은 선택이라 허용).
function UrlPreviewInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const invalid = value.trim() !== '' && !isValidUrl(value)
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`🔗 ${label} (선택)`}
      aria-invalid={invalid}
      className={cn(
        'bg-surface w-full rounded-lg border px-3 py-2 text-[11px] focus:outline-none',
        invalid
          ? 'border-danger text-danger focus:border-danger'
          : 'border-border text-fg placeholder:text-fg-subtle focus:border-brand',
      )}
    />
  )
}
