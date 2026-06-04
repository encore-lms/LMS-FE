import { useFormContext, useWatch } from 'react-hook-form'
import type { ProfileFormValues } from '../profileSchema'
import { ProfileCard } from './ProfileCard'
import { Toggle } from './Toggle'

// 공개 설정 — 외부 검증 페이지 노출 항목 5종 토글.
type SettingKey = keyof ProfileFormValues['publicSettings']
const ITEMS: { key: SettingKey; label: string }[] = [
  { key: 'profileImage', label: '프로필 이미지' },
  { key: 'githubUrl', label: 'GitHub URL' },
  { key: 'blogUrl', label: '블로그 URL' },
  { key: 'portfolioUrl', label: '포트폴리오 URL' },
  { key: 'linkedinUrl', label: 'LinkedIn URL' },
]

export function PublicSettingsSection() {
  const { control, setValue } = useFormContext<ProfileFormValues>()
  const ps = useWatch({ control, name: 'publicSettings' })

  return (
    <ProfileCard
      title="공개 설정"
      description="증명서 검증 시 외부 공개 URL을 통해 노출될 수 있는 항목입니다."
    >
      <div className="flex flex-col gap-4">
        {ITEMS.map((it) => (
          <Toggle
            key={it.key}
            label={it.label}
            description={ps[it.key] ? '공개 — 외부 검증 페이지 노출' : '미공개'}
            checked={ps[it.key]}
            onChange={(checked) =>
              setValue(
                'publicSettings',
                { ...ps, [it.key]: checked },
                { shouldDirty: true },
              )
            }
          />
        ))}
      </div>
    </ProfileCard>
  )
}
