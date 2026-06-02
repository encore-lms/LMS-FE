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

### 디자인 토큰 SSOT

- **유일한 출처는 `src/index.css`의 `@theme` 블록.** 이 파일만 편집하면 다음이 자동으로 따라옴:
  - Tailwind utility (`bg-brand`, `text-fg-muted` 등) — Tailwind v4가 @theme에서 자동 생성
  - `/_styleguide` 카탈로그 — 런타임에 `getComputedStyle`로 DOM에서 직접 읽음
  - 모든 컴포넌트의 색상/폰트
- **Figma Variables**: `LMS Design Tokens` collection ([LMS-UI-UX 파일](https://www.figma.com/design/Xt9rp01qqWNXnhB95jcFSm/LMS-UI-UX)). 코드의 `@theme`에서 `use_figma` 스크립트로 sync. **Figma에서 직접 수정 금지** — 변경은 항상 코드부터.
- **새 색상 토큰 추가 절차**:
  1. `src/index.css` `@theme`에 `--color-X: #...` 추가
  2. `src/features/styleguide/StyleGuidePage.tsx`의 `TOKEN_NAMES` 배열에 `'X'` 한 줄 추가
  3. PR 머지 후 `use_figma`로 Figma `LMS Design Tokens` collection에 `Color/X` variable 추가 (Claude 자동화)
- **폰트 토큰·정합성**: 폰트도 `Typography/*` 토큰으로 Figma에 sync한다(현재 `--font-sans` ↔ `Typography/font-sans` FONT*FAMILY). Figma 시안은 **Pretendard만** 사용한다 — `Icons` 페이지 디바이스 목업의 Apple SF/New York만 예외. Figma↔코드 폰트·토큰 드리프트는 [`figma-consistency-checks`](https://github.com/encore-lms/LMS-AGENT-SKILLS) 스킬로 점검한다(배경: LMS-DOCS `디자인*토큰.md` §Figma 폰트 정합).

- **색 정합·가드레일**: Figma 시안 색은 raw hex가 아니라 `LMS Design Tokens`(`Color/*`) 변수에 바인딩한다(코드 `@theme`에서 단방향 sync). 시안 작성 스킬 `lms-page-figma`(v0.8.0+)가 모든 fill/stroke를 변수로 그리도록 전환됐고(raw RGB 상수 폐기), 토큰과 불일치하는 raw 색은 [`figma-consistency-checks`](https://github.com/encore-lms/LMS-AGENT-SKILLS) 색 census로 탐지·무손실 교정한다. 새 색이 필요하면 위 절차로 토큰을 먼저 추가한다(raw hex 금지).

### Figma sync 절차 (코드 ↔ 디자인 상태 추적)

- 화면 PR이 `develop`에 머지되면, [Figma 파일](https://www.figma.com/design/Xt9rp01qqWNXnhB95jcFSm/LMS-UI-UX)의 해당 시안을 **`✅ 코드 반영 완료` Section** (`공통` 페이지 내)으로 이동하고 frame name 앞에 `[✅ vX.Y]` 버전 prefix를 추가한다.
- 작업 자동화: Claude + Figma MCP(`use_figma`)로 일괄 처리 가능.
- 버전 표기: 머지 시점이 아닌 **다음 release 버전 기준** (예: 1주차 작업 → `v0.2`). Release PR(`chore(release):`)에서 한 번에 확정 권장.
- 디자이너가 시안을 수정해야 할 때는 Section 밖으로 다시 이동해서 작업, 완료 후 재이동.
- **정합성 점검(Release 전)**: 주차 Release PR 전 [`figma-consistency-checks`](https://github.com/encore-lms/LMS-AGENT-SKILLS) 스킬을 실행해 ① 전 페이지 비-Pretendard 0(Icons 예외), ② 색 census `rawSolids` 0(`Color/*` 미바인딩 fill 없음, Icons 예외)을 확인하고, Release PR 본문 체크리스트에 `□ figma-consistency-checks 통과(폰트 비-Pretendard 0 · 색 미바인딩 0, Icons 예외)` 1줄을 남긴다.

## 병렬 작업 규칙 (2인 결합 해소)

도메인 화면은 각자 `src/features/<역할>/` 폴더를 **독점 소유**해 병렬 작업한다. 서로 코드를 건드리지 않게 하는 3가지 규칙:

- **공유 계약은 읽기전용**: `src/shared/{types,constants,api,store}`와 `src/components/{ui,layout}`은 둘 다 **import만** 한다. 변경이 필요하면 도메인 PR에 섞지 말고 별도 `shared` PR로 페어가 합의해 바꾼다.
- **라우트·메뉴는 자기 feature에서만**: 라우트는 `src/features/<역할>/routes.tsx`, 사이드바 메뉴는 `src/features/<역할>/menu.ts`에 정의한다. 취합 파일 `src/app/router.tsx`와 셸 `src/components/layout`은 새 shell 추가 같은 구조 변경 때만 페어로 손댄다.
- **공유 컴포넌트·모델은 단일 소유**: 여러 역할이 쓰는 것(예: 증명서 미리보기, 퀴즈 응시 컴포넌트, `MentorTeamAssignment` 타입)은 한 명이 만들고 다른 쪽은 import한다(중복 구현 금지).

폴더 소유·분담은 LMS-DOCS `WBS_FE.md` 주차 회고에서 재배치한다.

## 로컬 검증

- 커밋 시 pre-commit(husky + lint-staged)이 변경된 파일에 ESLint·Prettier를 자동 적용한다.
- 푸시 전 CI와 동일하게 확인 권장:

  ```bash
  pnpm lint && pnpm typecheck && pnpm test && pnpm build
  ```

## 문서 위치 원칙

- **WHY / 정책 / 도메인 / 화면 SSOT / 백로그**: LMS-DOCS
- **HOW / 구현 결정(ADR) / 컴포넌트 가이드**: 본 레포 (`docs/`)
