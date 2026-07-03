// 5축·페르소나 생성 가이드 + 페르소나 base 카테고리.
// 라벨은 LLM이 근거로 생성(고정 사전 아님). 여기 있는 건 "생성 규칙"과 "고정 base"뿐.
// 나중에 서버 프롬프트 빌드에 그대로 주입.

import type { PersonaBase } from './types'

// 5축 (블록2) — 축 뜻 + 참고 방향(고정 라벨 아님, 힌트만)
export const AXIS_GUIDE = [
  { axis: '업무', meaning: '일하는 방식', hint: '계획 / 실행 / 검증' },
  { axis: '리더십', meaning: '팀 안 역할', hint: '주도 / 서포터 / 조율' },
  { axis: '학습', meaning: '성장 패턴', hint: '가속 / 꾸준 / 반등' },
  { axis: '소통', meaning: '의사 전달', hint: '논리설명 / 공감 / 간결' },
  { axis: '기술', meaning: '기술 포지셔닝', hint: '심화 / 제너럴리스트' },
] as const

// 페르소나 base 카테고리(고정 7) + 매칭 힌트. 표시 라벨은 LLM 생성, baseCategory만 여기서 고정.
export const PERSONA_GUIDE: { base: PersonaBase; hint: string }[] = [
  { base: '백엔드', hint: '백엔드 성취 + API/서버 프로젝트' },
  { base: '프론트엔드', hint: 'FE 스택·프로젝트 + 소통 강점' },
  { base: '풀스택', hint: 'FE+BE 고른 스택' },
  { base: '데이터 엔지니어', hint: '데이터 성취 + 데이터 파이프라인' },
  { base: '데이터 분석', hint: '데이터 성취 + 분석/기획' },
  { base: 'ML·AI', hint: 'AI·CS 성취 + ML 프로젝트·트슈' },
  { base: 'DevOps·인프라', hint: '배포·인프라 트슈 + 클라우드 스택' },
]

// 공통 생성 규칙 (프롬프트에 주입할 지침)
export const GENERATION_RULES = [
  '근거 있는 것만 — 실제 데이터에서만 서술(과장·환각 금지)',
  '개별 숫자 재진술 금지 · 최소 2개 소스를 연결한 통찰',
  '표시 라벨은 풍부하게, 페르소나 baseCategory는 고정 7 중 하나로 태깅',
  '부연은 계산 설명이 아니라 실제 활동(프로젝트·트슈 등) 근거로',
  'confirmed 검수 후 노출 · 발급 시 스냅샷 동결',
] as const
