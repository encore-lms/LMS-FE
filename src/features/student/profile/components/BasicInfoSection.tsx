import type { StudentProfile } from '../types'
import { ProfileCard } from './ProfileCard'
import { ProfileImageField } from './ProfileImageField'
import { ReadonlyField } from './ReadonlyField'
import { ProfileField } from './ProfileField'

// 기본 정보 — 프로필 이미지 + 이름(잠금) + 표시명(편집) + 과정/기수(잠금).
export function BasicInfoSection({ profile }: { profile: StudentProfile }) {
  return (
    <ProfileCard
      title="기본 정보"
      description="증명서에 그대로 반영됩니다. 과정/기수는 HRD-Net 연동(잠금)."
    >
      <ProfileImageField
        name={profile.name}
        imageUrl={profile.profileImageUrl}
      />
      <ReadonlyField label="이름 (증명서 반영 · 잠금)" value={profile.name} />
      <ProfileField
        name="displayName"
        label="표시명"
        placeholder="공개 페이지에 표시될 이름"
        hint="증명서·외부 공개 페이지에 노출됩니다 (2~30자)"
      />
      <ReadonlyField
        label="과정 / 기수"
        value={`${profile.courseName} · ${profile.cohortName}`}
        hint="HRD-Net 연동 · 변경 불가"
      />
    </ProfileCard>
  )
}
