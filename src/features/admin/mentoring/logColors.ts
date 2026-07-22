// 멘토링 일지 상태별 차트 색 팔레트 — 팀 상세의 막대·도넛·타임라인이 공유. MentoringTeamDetailPage에서 분리.

/** 일지 상태별 색 — LOG_STATUS_META 톤과 동일 계열의 차트 팔레트 토큰. */
export const LOG_COLOR: Record<string, string> = {
  valid: 'var(--color-chart-positive)',
  resubmitted_valid: 'var(--color-chart-accent)',
  change_requested: 'var(--color-chart-info)',
  draft: 'var(--color-chart-neutral)',
}
export function logColorOf(status: string, resubmitted: boolean) {
  if (status === 'valid')
    return resubmitted ? LOG_COLOR.resubmitted_valid : LOG_COLOR.valid
  return LOG_COLOR[status] ?? LOG_COLOR.draft
}
