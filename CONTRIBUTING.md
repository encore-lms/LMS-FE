# 기여 가이드

## 브랜치 전략 (단순 GitHub Flow 변형)

- `main`: 배포 가능 상태. 직접 푸시 금지(protected).
- `develop`: 통합 브랜치. 직접 푸시 금지(protected).
- 작업 브랜치: `feat/<scope>-<desc>`, `fix/<scope>-<desc>` (예: `feat/auth-login`, `fix/quiz-result-empty`).

scope/type은 커밋 컨벤션(LMS-AGENT-SKILLS `commit-convention/COMMIT_CONVENTION.md`)의 값을 재사용한다.

## 커밋

이 프로젝트는 LMS-AGENT-SKILLS `commit-convention/COMMIT_CONVENTION.md`를 **단일 기준(SSOT)으로 따른다.**

핵심 (전체 규칙은 위 문서 참조):

- 한국어 메시지 + `type(scope): 설명` 형식 (type · scope는 소문자)
- **기본 커밋 단위는 파일 1개** (§6 — `git add -A`로 묶지 않는다)
- type 목록과 scope 목록은 컨벤션 §2 · §3 표를 따른다
- 본문은 정책 · 아키텍처 · 운영 영향이 있는 변경 시에만 (§5)

commitlint 자동 강제는 1주차 보류(회고 이후 도입 여부 결정).

## PR

- 대상 브랜치: `develop`.
- 머지 조건: **상호 리뷰 1명 승인 + CI(lint · typecheck · test · build) 통과**.
- 머지 방식: **Merge commit (`--no-ff`)**. 파일별 커밋이 main에 그대로 남도록. PR 제목이 머지 커밋 제목이 되므로 PR 제목에 `type(scope): 설명` 형식을 적용한다. **머지 커밋 본문은 비움**(설정: `merge_commit_message=BLANK`) — PR 본문은 PR 화면에만 보존되고 main `git log`엔 들어가지 않는다. PR 단위 bisect는 `git bisect --first-parent`.

> branch protection은 현재 GitHub 무료 플랜 제약으로 미적용 상태다. 위 규칙은 도구 강제가 아니라 팀 규율로 지킨다(LMS-DOCS `FE_초기_세팅_결정.md` §2 참조).

## 로컬 검증

- 커밋 시 pre-commit(husky + lint-staged)이 변경된 파일에 ESLint·Prettier를 자동 적용한다.
- 푸시 전 CI와 동일하게 확인 권장:

  ```bash
  pnpm lint && pnpm typecheck && pnpm test && pnpm build
  ```

## 문서 위치 원칙

- **WHY / 정책 / 도메인 / 화면 SSOT / 백로그**: LMS-DOCS
- **HOW / 구현 결정(ADR) / 컴포넌트 가이드**: 본 레포 (`docs/`)
