// 평가 작성 화면 메타 — 축 UI 메타·리커트 상수·아바타 색은 공용 카드로 승격(2026-08-06,
// @/components/evaluation — 멘토 평가·프로젝트 상호평가 공용). 임포트 표면 유지 재수출.
// 아래에는 멘토 평가 화면 고유 문구·상수만 남긴다.
export {
  EVALUATION_AXES,
  LIKERT_ANCHORS,
  LIKERT_SIZES,
  MEMBER_AVATAR_BG,
  memberAvatarBg,
} from '@/components/evaluation/evalAxes'
export type { EvaluationAxisMeta } from '@/components/evaluation/evalAxes'

/** 줄글 평가 코멘트 글자수 한도 — 길이 정책 미확정(Figma 카운터 500 기준) TODO. */
export const EVALUATION_COMMENT_LIMIT = 500

/** 자동 저장 디바운스(ms) — 주기·트리거 미확정(openQuestion), 입력 멈춤 기준 보수값. */
export const AUTOSAVE_DELAY_MS = 1500

// ── 고정 문구 ──
export const EVALUATION_CRITERIA_TITLE = '평가 기준 · 4축 고정'
export const EVALUATION_CRITERIA_CAPTION =
  '고정 4축 · 1~5 척도(낮음~높음) · 줄글 평가 필수'
export const EVALUATION_COMMENT_PLACEHOLDER =
  '이 수강생의 강점·관찰 근거·다음 단계를 적어주세요'
// 정책 완화(2026-08-04) — 멘토링 시작부터 상시 작성, 제출 후에도 재제출로 수정 가능.
export const EVALUATION_NEXT_BANNER_TITLE =
  '추천 선택은 별도 단계에서 언제든 진행할 수 있습니다'
export const EVALUATION_NEXT_BANNER_DESC =
  '추천 선택은 평가와 독립 · 추천 대상자만 증명서용 간략 요약 필수 · 제출 후에도 재제출로 수정 가능'
export const EVALUATION_ACTION_CAPTION =
  '팀원 전체 평가 완료 시 제출 활성 · 제출 후에도 재제출로 수정 가능 · 미작성은 대시보드와 평가 목록에 노출'
export const EVALUATION_CONFIRM_EYEBROW = 'MENTOR EVALUATION'
export const EVALUATION_CONFIRM_TITLE = '평가를 제출할까요?'
export const EVALUATION_CONFIRM_BODY =
  '팀원 전체 4축 점수와 줄글 평가 코멘트를 제출합니다. 제출 후에도 재제출로 수정할 수 있으며, 마지막 제출본이 평판·증명서에 반영됩니다.'
export const EVALUATION_SUBMITTED_TOAST =
  '평가가 제출되었습니다. 팀원별 평가 이력에 반영됩니다.'
