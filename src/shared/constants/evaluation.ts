// 멘토 평가 고정 4축 라벨(2026-08-05 개편) — 순서 = BE scores4 인덱스와 1:1 계약.
// 멘토 작성 화면·운영 평판 화면·mock 이 같은 라벨을 각자 하드코딩하고 있었다(3중 정의).
// 교차 feature 임포트는 린트로 막혀 있어 shared 승격이 정석 경로다.
// 축 UI 메타(아이콘·색·진술문)는 멘토 소유(evaluationMeta.ts) — 여기는 계약 라벨만 둔다.
export const EVALUATION_AXIS_LABELS = [
  '기술/기술기여',
  '소통·협업·팀워크',
  '문제해결',
  '책임감',
] as const
