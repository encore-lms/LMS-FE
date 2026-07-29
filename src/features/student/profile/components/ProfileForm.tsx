import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import type { StudentProfile } from '../types'
import { profileSchema, type ProfileFormValues } from '../profileSchema'
import { useUpdateProfile } from '../../api/profile'
import { useToast } from '@/components/ui/use-toast'
import { ProfileCompletion } from './ProfileCompletion'
import { BasicInfoSection } from './BasicInfoSection'
import { ExternalUrlsSection } from './ExternalUrlsSection'
import { SkillsSection } from './SkillsSection'
import { PublicSettingsSection } from './PublicSettingsSection'
import { ProfileFooter } from './ProfileFooter'

// 저장 완료 토스트 — 체크 원 + 라벨 + 제목 + 보조설명의 리치 배너(Toast 박스 안에 렌더).
// success 토스트 박스가 진보라(bg-accent-strong)라 전경은 전부 on-color(흰색) 계열 —
// 밝은 배경용 fg·success 토큰을 쓰면 글자가 배경에 묻힌다(2026-07-29 시연 QA).
const SAVED_TOAST = (
  <span className="flex min-w-[300px] items-center gap-3">
    <span className="border-on-color text-on-color flex size-9 shrink-0 items-center justify-center rounded-full border-2">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="size-4"
      >
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
    <span className="flex flex-col gap-0.5">
      <span className="text-on-color/70 text-[11px] font-bold tracking-wider uppercase">
        SAVED
      </span>
      <span className="text-on-color text-[15px] font-bold">
        저장되었습니다
      </span>
      <span className="text-on-color/80 text-xs font-normal">
        변경사항이 즉시 반영되었습니다.
      </span>
    </span>
  </span>
)

function toDefaults(p: StudentProfile): ProfileFormValues {
  return {
    profileImageUrl: p.profileImageUrl,
    displayName: p.displayName,
    githubUrl: p.githubUrl,
    blogUrl: p.blogUrl,
    portfolioUrl: p.portfolioUrl,
    linkedinUrl: p.linkedinUrl,
    skills: p.skills,
    interests: p.interests,
    publicSettings: p.publicSettings,
  }
}

/** 프로필 편집 폼 — 로드된 프로필을 기본값으로 RHF 구성(편집 필드만). 읽기 전용은 profile에서 표시. */
export function ProfileForm({ profile }: { profile: StudentProfile }) {
  const navigate = useNavigate()
  const updateMutation = useUpdateProfile()
  const toast = useToast()
  const methods = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toDefaults(profile),
  })

  const onSubmit = methods.handleSubmit((values) => {
    updateMutation.mutate(values, {
      // 저장 성공 시 현재 값으로 reset → dirty 초기화(저장 버튼 비활성) + 완료 토스트
      onSuccess: () => {
        methods.reset(values)
        toast.show(SAVED_TOAST, { tone: 'success', duration: 4000 })
      },
    })
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 p-8 pb-0">
        <ProfileCompletion
          completion={profile.completion}
          onViewMissing={() => navigate('/student/certificate')}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <BasicInfoSection profile={profile} />
            <ExternalUrlsSection />
          </div>
          <div className="flex flex-col gap-6">
            <SkillsSection />
            <PublicSettingsSection />
          </div>
        </div>
        <ProfileFooter
          dirty={methods.formState.isDirty}
          dirtyCount={Object.keys(methods.formState.dirtyFields).length}
          saving={updateMutation.isPending}
          onCertificate={() => navigate('/student/certificate')}
        />
      </form>
    </FormProvider>
  )
}
