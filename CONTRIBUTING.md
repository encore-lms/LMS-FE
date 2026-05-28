# 기여 가이드

## 브랜치 전략 (단순 GitHub Flow 변형)

- `main`: 배포 가능 상태. 직접 푸시 금지(protected).
- `develop`: 통합 브랜치. 직접 푸시 금지(protected).
- 작업 브랜치: `feat/<scope>-<desc>`, `fix/<scope>-<desc>` (예: `feat/auth-login`, `fix/quiz-result-empty`).

scope/type은 커밋 컨벤션(LMS-AGENT-SKILLS `commit-convention/COMMIT_CONVENTION.md`)의 값을 재사용한다.

## 커밋

- 한국어 메시지 + `type(scope): 설명` 형식.
- commitlint 자동 강제는 1주차 보류(회고 이후 도입 여부 결정).

## PR

- 대상 브랜치: `develop`.
- 머지 조건: **상호 리뷰 1명 승인 + CI(lint · typecheck · test · build) 통과**.
- 머지 방식: **Squash merge**. 머지 커밋 메시지도 커밋 컨벤션을 따른다.

## 로컬 검증

- 커밋 시 pre-commit(husky + lint-staged)이 변경된 파일에 ESLint·Prettier를 자동 적용한다.
- 푸시 전 CI와 동일하게 확인 권장:

  ```bash
  pnpm lint && pnpm typecheck && pnpm test && pnpm build
  ```

## 문서 위치 원칙

- **WHY / 정책 / 도메인 / 화면 SSOT / 백로그**: LMS-DOCS
- **HOW / 구현 결정(ADR) / 컴포넌트 가이드**: 본 레포 (`docs/`)
