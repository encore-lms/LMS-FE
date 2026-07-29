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
      description="기술 태그 최대 10개 · 드래그로 순서 변경"
    >
      <div className="flex flex-col gap-2">
        <span className="text-fg flex items-center gap-1 text-[13px] font-bold">
          기술 태그
          {skills.length > 0 && <span className="text-success">✓</span>}
        </span>
        <TagInput
          value={skills}
          onChange={(v) => setValue('skills', v, { shouldDirty: true })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-fg text-[13px] font-bold">관심 직무</span>
        <TagInput
          value={interests}
          onChange={(v) => setValue('interests', v, { shouldDirty: true })}
        />
      </div>
    </ProfileCard>
  )
}
