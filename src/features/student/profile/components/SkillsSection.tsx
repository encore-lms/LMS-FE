import { useFormContext, useWatch } from 'react-hook-form'
import type { ProfileFormValues } from '../profileSchema'
import { ProfileCard } from './ProfileCard'
import { TagInput } from './TagInput'

// 스킬 — 기술 태그 + 관심 직무. 증명서 종합 요약에 활용.
export function SkillsSection() {
  const { control, setValue } = useFormContext<ProfileFormValues>()
  const skills = useWatch({ control, name: 'skills' })
  const interests = useWatch({ control, name: 'interests' })

  return (
    <ProfileCard
      title="스킬"
      description="기술 태그·관심 직무 — 증명서 종합 요약에 활용됩니다."
    >
      <div className="flex flex-col gap-2">
        <span className="text-fg text-[13px] font-bold">기술 태그</span>
        <TagInput
          value={skills}
          onChange={(v) => setValue('skills', v, { shouldDirty: true })}
          placeholder="기술 추가"
          chipClassName="bg-accent-bg text-accent-strong"
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-fg text-[13px] font-bold">관심 직무</span>
        <TagInput
          value={interests}
          onChange={(v) => setValue('interests', v, { shouldDirty: true })}
          placeholder="직무 추가"
          chipClassName="bg-success-bg text-success"
        />
      </div>
    </ProfileCard>
  )
}
