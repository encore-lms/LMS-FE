# 기여 가이드

## 브랜치 전략 (단순 GitHub Flow 변형)

- `main`: 배포 가능 상태. 직접 푸시 금지(protected).
- `develop`: 통합 브랜치. 직접 푸시 금지(protected).
- 작업 브랜치: `feat/<scope>-<desc>`, `fix/<scope>-<desc>` (예: `feat/auth-login`, `fix/quiz-result-empty`).

scope/type은 [커밋 컨벤션](https://github.com/encore-lms/LMS-AGENT-SKILLS/blob/main/commit-convention/COMMIT_CONVENTION.md)의 값을 재사용한다.

## 커밋

이 프로젝트는 [LMS-AGENT-SKILLS `commit-convention/COMMIT_CONVENTION.md`](https://github.com/encore-lms/LMS-AGENT-SKILLS/blob/main/commit-convention/COMMIT_CONVENTION.md)를 **단일 기준(SSOT)으로 따른다.**

핵심 (전체 규칙은 위 문서 참조):

- 한국어 메시지 + `type(scope): 설명` 형식 (type · scope는 소문자)
- **기본 커밋 단위는 파일 1개** (§6 — `git add -A`로 묶지 않는다)
- type 목록과 scope 목록은 컨벤션 §2 · §3 표를 따른다
- 본문은 정책 · 아키텍처 · 운영 영향이 있는 변경 시에만 (§5)

commitlint 자동 강제는 1주차 보류(회고 이후 도입 여부 결정).

## PR

- 대상 브랜치: `develop`.
- 머지 조건: **상호 리뷰 1명 승인 + CI(lint · typecheck · test · build) 통과**.
- **1주차 동시 작업 기간 한정 자체 머지 특례**: 황설현·박준석 동시 작업 중이라 외부 리뷰어 부재. CI 통과 + PR 본문 자체 검증을 갖춘 PR은 자체 머지 허용. 1주차 회고 시 재결정.
- 머지 방식: **Merge commit (`--no-ff`)**. 파일별 커밋이 main에 그대로 남도록. PR 제목이 머지 커밋 제목이 되므로 PR 제목에 `type(scope): 설명` 형식을 적용한다. **머지 커밋 본문은 비움**(설정: `merge_commit_message=BLANK`) — PR 본문은 PR 화면에만 보존되고 main `git log`엔 들어가지 않는다. PR 단위 bisect는 `git bisect --first-parent`.
- **Release PR (`develop` → `main`)**: 매 주차 검증 완료 시점에 별도 생성한다. PR 제목 형식은 `chore(release): N주차 요약 (vX.Y)` (예: `chore(release): 1주차 부트스트랩·로그인 화면 (v0.1)`). 본문에는 이번 주차에 머지된 PR 번호 목록과 배포 영향 요약을 적는다. main 머지 = "이번 주 배포본 확정" 선언.

> branch protection은 현재 GitHub 무료 플랜 제약으로 미적용 상태다. 위 규칙은 도구 강제가 아니라 팀 규율로 지킨다(LMS-DOCS `FE_초기_세팅_결정.md` §2 참조).

## 스타일링

- **기본은 Tailwind utility class.** 일반 CSS는 keyframes · 글로벌 reset · 3중 이상 의사클래스 같은 보조 영역에만 사용한다.
- **색상 · 폰트 · 공통 spacing은 `@theme` 토큰으로만 표현.** `bg-brand` ✅ / `bg-[#1a8c85]` ❌. 토큰이 없으면 토큰을 먼저 추가한다.
- **같은 className 패턴이 3회 이상 반복되면 `src/components/ui/` 또는 도메인 컴포넌트로 추상화.**
- **className 순서는 `prettier-plugin-tailwindcss`가 자동 정렬.** 수동 정렬 불필요, lint-staged가 commit 시 자동 적용.
- 토큰 · 공통 컴포넌트 카탈로그는 dev 환경의 [`/_styleguide`](http://localhost:5173/_styleguide) 라우트에서 조회. 새 화면 작업 전 먼저 확인한다.

## 로컬 검증

- 커밋 시 pre-commit(husky + lint-staged)이 변경된 파일에 ESLint·Prettier를 자동 적용한다.
- 푸시 전 CI와 동일하게 확인 권장:

  ```bash
  pnpm lint && pnpm typecheck && pnpm test && pnpm build
  ```

## 문서 위치 원칙

- **WHY / 정책 / 도메인 / 화면 SSOT / 백로그**: LMS-DOCS
- **HOW / 구현 결정(ADR) / 컴포넌트 가이드**: 본 레포 (`docs/`)
