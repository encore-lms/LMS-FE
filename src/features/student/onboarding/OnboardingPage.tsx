import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/shared/store'
import { markOnboarded } from './completed'
import { OnboardingShell } from './components/OnboardingShell'
import { PledgeStep } from './steps/PledgeStep'
import { SkillsStep } from './steps/SkillsStep'
import { LinksStep } from './steps/LinksStep'
import { SKILL_MAX, type OnboardingStep } from './types'

/**
 * 수강생 온보딩 (/student/onboarding) — Figma 225:27 외. 풀스크린 3스텝 마법사.
 * ?step=skills|links 로 단계 전환(없으면 다짐). 시작하기/건너뛰기 → 대시보드.
 */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const raw = params.get('step')
  const step: OnboardingStep =
    raw === 'skills' ? 'skills' : raw === 'links' ? 'links' : 'pledge'

  const [pledge, setPledge] = useState('')
  const [skills, setSkills] = useState<string[]>([
    'Java',
    'Spring',
    'SQL',
    'Git',
  ])
  const [blogUrl, setBlogUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')

  const go = (s: OnboardingStep) =>
    setParams(s === 'pledge' ? {} : { step: s }, { replace: true })
  // 완료/건너뛰기 모두 온보딩 완료로 표시 → 게이트 통과 후 대시보드.
  const finish = () => {
    if (user) markOnboarded(user.id)
    navigate('/student')
  }

  const toggleSkill = (skill: string) =>
    setSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : prev.length >= SKILL_MAX
          ? prev
          : [...prev, skill],
    )

  const isFirst = step === 'pledge'
  const isLast = step === 'links'

  return (
    <OnboardingShell step={step}>
      {step === 'pledge' && <PledgeStep value={pledge} onChange={setPledge} />}
      {step === 'skills' && (
        <SkillsStep selected={skills} onToggle={toggleSkill} />
      )}
      {step === 'links' && (
        <LinksStep
          blogUrl={blogUrl}
          githubUrl={githubUrl}
          onBlog={setBlogUrl}
          onGithub={setGithubUrl}
        />
      )}

      {/* 하단 액션바 */}
      <div className="border-divider mt-5 flex items-center justify-between border-t pt-5">
        <button
          type="button"
          onClick={finish}
          className="text-fg-muted hover:text-fg text-[13px] font-semibold"
        >
          건너뛰기
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => go(step === 'links' ? 'skills' : 'pledge')}
            className={cn(
              'rounded-[10px] border px-5 py-2.5 text-[13px] font-semibold transition-colors',
              isFirst
                ? 'border-border text-fg-subtle cursor-not-allowed opacity-50'
                : 'border-border text-fg hover:bg-surface-muted',
            )}
          >
            ← 이전
          </button>
          <button
            type="button"
            onClick={() =>
              isLast ? finish() : go(step === 'pledge' ? 'skills' : 'links')
            }
            className="bg-brand rounded-[10px] px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:opacity-90"
          >
            {isLast ? '시작하기' : '다음 →'}
          </button>
        </div>
      </div>
    </OnboardingShell>
  )
}
