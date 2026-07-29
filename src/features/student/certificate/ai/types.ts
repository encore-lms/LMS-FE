// 증명서 AI 분석 모듈 — 계약 타입 재수출(배럴).
//
// 실제 정의는 contract.gen.ts (자동 생성 · SSOT = LMS-AI/src/contract.ts).
// FE↔LMS-AI 중복을 없애기 위해 여기서 직접 선언하지 않고 계약을 그대로 재수출한다.
// 타입 추가·수정은 LMS-AI 계약에서 → `pnpm sync:ai-contract` 로 반영.
//
// 파생(StudentDerived·SixAxis) + AI 출력(AiAnalysis·AiVerdict·AiPersona·AiProfile·
// AiProjects·ProblemAi·Sentiment·Ontology 등) + PERSONA_BASE/PersonaBase 포함.
export * from './contract.gen'
