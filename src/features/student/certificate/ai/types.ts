// 증명서 AI 분석 모듈 — 계약 타입 재수출(배럴).
//
// 실제 정의는 contract.gen.ts이며 SSOT는 LMS-AI Python 응답 구현과 API.md다.
// FE에서는 계약 타입을 이 배럴에서 그대로 재수출한다.
//
// 파생(StudentDerived·SixAxis) + AI 출력(AiAnalysis·AiVerdict·AiPersona·AiProfile·
// AiProjects·ProblemAi·Sentiment·Ontology 등) + PERSONA_BASE/PersonaBase 포함.
export * from './contract.gen'
