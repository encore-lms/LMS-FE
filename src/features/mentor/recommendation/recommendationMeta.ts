// 추천 선택 화면 메타 — Figma 2553:4425 / 3150:2526 / 2582:6476 원문.

/** 추천 정책 배너 — 4열 라벨/값(2026-08-04 정책 완화: 상시 작성·재제출 가능). */
export const RECOMMENDATION_POLICY_ITEMS = [
  { label: '추천 단위', value: '팀당 1명 또는 추천 안 함' },
  { label: '증명서용 간략 요약', value: '추천 시 필수 · 추천 안 함 시 선택' },
  { label: '수정', value: '상시 재제출 가능 · 마지막 제출본 유효' },
  { label: '수강생 노출', value: '추천 여부만 · 원문 평가 비공개' },
] as const

export const RECOMMENDATION_MODE_CARDS = {
  recommend: {
    title: '팀원 1명 추천',
    desc: '팀에서 가장 추천하고 싶은 1명 선택 · 요약 필수',
  },
  none: {
    title: '추천하지 않음',
    desc: '이번 팀에서는 추천 대상 없음 · 사유 입력 없음',
  },
} as const

/** 증명서용 간략 요약 글자수 한도 — 길이 정책 미확정(Figma 카운터 500 기준) TODO. */
export const RECOMMENDATION_SUMMARY_LIMIT = 500

export const RECOMMENDATION_SUMMARY_SUBTITLE =
  '팀에 어떤 기여를 했는지, 어떤 강점이 돋보였는지 구체적으로 작성'
export const RECOMMENDATION_MEMBER_SECTION_CAPTION =
  '팀당 1명만 선택 가능 · 평가 점수와 무관하게 증명서용 간략 요약을 직접 작성합니다'
export const RECOMMENDATION_PUBLISH_CAPTION =
  '수강생 노출: 추천 여부만 (원문 평가는 비공개) · 외부 공개는 증명서 전체 공개 토글 + 인증 완료 + 최신화 스냅샷 기준'
export const RECOMMENDATION_ACTION_CAPTION =
  '상시 재제출 가능 · 추천 없음은 사유 없이 제출 · 팀당 1명만 추천'
export const RECOMMENDATION_CONFIRM_EYEBROW = 'MENTOR RECOMMENDATION'
export const RECOMMENDATION_CONFIRM_TITLE = '추천 선택을 제출할까요?'
export const RECOMMENDATION_CONFIRM_BODY =
  '추천 후보 1명 또는 추천 없음 선택을 제출합니다. 제출 후에도 재제출로 수정할 수 있으며, 마지막 제출본이 평판·증명서에 반영됩니다. 추천 대상자는 증명서용 간략 요약이 있어야 합니다.'
export const RECOMMENDATION_SUBMITTED_TOAST =
  '추천 선택이 제출되었습니다. 팀당 1명 추천 정책으로 저장됩니다.'
