import { useFormContext, useWatch } from 'react-hook-form'
import type { ProfileFormValues } from '../profileSchema'
import { ProfileCard } from './ProfileCard'
import { Toggle } from './Toggle'

// 공개 설정 — 외부 검증 페이지 노출 항목 5종 토글. 멘트는 공개/미공개로 분기.
type SettingKey = keyof ProfileFormValues['publicSettings']
// pub = 공개(ON)일 때 멘트. 미공개(OFF)는 공통 '미공개 상태'.
const ITEMS: { key: SettingKey; label: string; pub: string }[] = [
  {
    key: 'profileImage',
    label: '프로필 이미지',
    pub: '공개 시 증명서·외부 페이지에 노출',
  },
  {
    key: 'githubUrl',
    label: 'GitHub URL',
    pub: '공개 시 외부 검증자 연결 가능',
  },
  { key: 'blogUrl', label: '블로그 URL', pub: '공개 시 외부 검증자 연결 가능' },
  {
    key: 'portfolioUrl',
    label: '포트폴리오 URL',
    pub: '포트폴리오 사이트 메타 외 노출',
  },
  {
    key: 'linkedinUrl',
    label: 'LinkedIn URL',
    pub: '공개 시 외부 검증자 연결 가능',
  },
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
            description={ps[it.key] ? it.pub : '미공개 상태'}
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
