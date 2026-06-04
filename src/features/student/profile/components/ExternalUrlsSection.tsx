import { ProfileCard } from './ProfileCard'
import { ProfileField } from './ProfileField'

// 외부 URL — GitHub/블로그(필수) · 포트폴리오/LinkedIn(선택). 증명서 검증 시 공개될 수 있는 링크.
export function ExternalUrlsSection() {
  return (
    <ProfileCard
      title="외부 URL"
      description="증명서 검증 시 공개될 수 있는 링크입니다. 필수 항목은 비우면 인증 요청이 막힙니다."
    >
      <ProfileField
        name="githubUrl"
        label="GitHub URL"
        required
        placeholder="https://github.com/username"
      />
      <ProfileField
        name="blogUrl"
        label="블로그 URL"
        required
        placeholder="https://velog.io/@username"
      />
      <ProfileField
        name="portfolioUrl"
        label="포트폴리오 URL"
        placeholder="https://yourportfolio.com"
      />
      <ProfileField
        name="linkedinUrl"
        label="LinkedIn URL"
        placeholder="https://linkedin.com/in/username"
      />
    </ProfileCard>
  )
}
