import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/shared/store'
import { PROFILE_PATH } from '@/features/profile/paths'
import {
  useSaveStudentOnboarding,
  useStudentOnboarding,
} from '../api/onboarding'
import { OnboardingShell } from './components/OnboardingShell'
import { PledgeStep } from './steps/PledgeStep'
import { SkillsStep } from './steps/SkillsStep'
import { LinksStep } from './steps/LinksStep'
import {
  SKILL_MAX,
  isValidUrl,
  type OnboardingStep,
  type StudentSkillOption,
} from './types'

const EMPTY_SKILL_OPTIONS: StudentSkillOption[] = []

/**
 * 수강생 온보딩 (/student/onboarding) — Figma 225:27 외. 풀스크린 3스텝 마법사.
 * ?step=skills|links 로 단계 전환(없으면 다짐). 다짐(필수) 통과 후 진행.
 * step2(스킬)만 건너뛰기(→step3) 허용, step3은 시작하기로만 완료 → 대시보드.
 * 완료 시 스킬·외부 URL 을 서버에 저장하고 온보딩 완료 상태를 확정한다.
 */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const onboarding = useStudentOnboarding()
  const saveOnboarding = useSaveStudentOnboarding()
  const raw = params.get('step')
  const step: OnboardingStep =
    raw === 'skills' ? 'skills' : raw === 'links' ? 'links' : 'pledge'

  const [pledge, setPledge] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [blogUrl, setBlogUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!onboarding.data || hydrated) return
    const profile = onboarding.data.profile
    setPledge(profile.promise)
    setSkills(profile.selectedSkillIds)
    setBlogUrl(profile.blogUrl ?? '')
    setGithubUrl(profile.githubUrl ?? '')
    setHydrated(true)
  }, [hydrated, onboarding.data])

  const go = (s: OnboardingStep) =>
    setParams(s === 'pledge' ? {} : { step: s }, { replace: true })

  const skillOptions = onboarding.data?.skillOptions ?? EMPTY_SKILL_OPTIONS
  const selectedSkillNames = useMemo(() => {
    const namesById = new Map(
      skillOptions.map((skill) => [skill.skillId, skill.name]),
    )
    return skills.map((skillId) => namesById.get(skillId) ?? skillId)
  }, [skillOptions, skills])

  // 시작하기 시 입력값을 서버에 저장하고 완료 후 수강생 홈으로 이동한다.
  const finish = () => {
    saveOnboarding.mutate(
      {
        promise: pledge.trim(),
        skillIds: skills,
        blogUrl: blogUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
      },
      {
        // 임시 비밀번호(mustChangePassword) 상태면 로그인 시점 유도가 온보딩에 밀렸으므로
        // 완료 직후 마이 프로필로 이어받아 비밀번호 변경을 안내한다(#375).
        onSuccess: () =>
          navigate(
            user?.mustChangePassword ? PROFILE_PATH.STUDENT : '/student',
            { replace: true },
          ),
      },
    )
  }

  const toggleSkill = (skillId: string) =>
    setSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : prev.length >= SKILL_MAX
          ? prev
          : [...prev, skillId],
    )

  const isFirst = step === 'pledge'
  const isLast = step === 'links'

  // 필수/형식 검증 — 통과해야 다음(마지막은 시작하기)으로 진행.
  // 다짐: 필수 → 빈칸 차단. 외부 URL: 선택이지만 입력 시 형식 검증.
  const blogOk = blogUrl.trim() === '' || isValidUrl(blogUrl)
  const githubOk = githubUrl.trim() === '' || isValidUrl(githubUrl)
  const canAdvance =
    step === 'pledge'
      ? pledge.trim().length > 0
      : step === 'links'
        ? blogOk && githubOk
        : true

  if (onboarding.isLoading) {
    return (
      <div className="bg-surface text-fg-muted flex min-h-screen items-center justify-center text-sm">
        온보딩 정보를 불러오는 중입니다.
      </div>
    )
  }

  if (onboarding.isError) {
    return (
      <div className="bg-surface flex min-h-screen flex-col items-center justify-center gap-3 text-sm">
        <p className="text-danger">온보딩 정보를 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={() => void onboarding.refetch()}
          className="border-border text-fg hover:bg-surface-muted rounded-[8px] border px-4 py-2 text-[13px] font-semibold"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <OnboardingShell
      step={step}
      skills={selectedSkillNames}
      blogUrl={blogUrl}
      githubUrl={githubUrl}
      onBlog={setBlogUrl}
      onGithub={setGithubUrl}
    >
      {step === 'pledge' && <PledgeStep value={pledge} onChange={setPledge} />}
      {step === 'skills' && (
        <SkillsStep
          options={skillOptions}
          selected={skills}
          onToggle={toggleSkill}
        />
      )}
      {step === 'links' && (
        <LinksStep
          blogUrl={blogUrl}
          githubUrl={githubUrl}
          onBlog={setBlogUrl}
          onGithub={setGithubUrl}
        />
      )}

      {/* 하단 액션바 — 건너뛰기는 스킬(step2)에서만, step3로 이동. step1·step3은 불가 */}
      <div className="border-divider mt-5 flex items-center justify-between border-t pt-5">
        {saveOnboarding.isError && (
          <p role="alert" className="text-danger mr-auto text-[12px]">
            온보딩 저장에 실패했습니다. 잠시 후 다시 시도해주세요.
          </p>
        )}
        {step === 'skills' ? (
          <button
            type="button"
            onClick={() => go('links')}
            className="text-fg-muted hover:text-fg text-[13px] font-semibold"
          >
            건너뛰기
          </button>
        ) : (
          <span />
        )}
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
            disabled={!canAdvance || saveOnboarding.isPending}
            onClick={() =>
              isLast ? finish() : go(step === 'pledge' ? 'skills' : 'links')
            }
            className={cn(
              'rounded-[10px] px-5 py-2.5 text-[13px] font-bold text-white transition-colors',
              canAdvance
                ? 'bg-brand hover:opacity-90'
                : 'bg-brand/40 cursor-not-allowed',
            )}
          >
            {isLast
              ? saveOnboarding.isPending
                ? '저장 중…'
                : '시작하기'
              : '다음 →'}
          </button>
        </div>
      </div>
    </OnboardingShell>
  )
}
