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
    promise: p.promise ?? '',
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
        toast.success('변경사항을 저장했어요')
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
