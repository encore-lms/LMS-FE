# ADR 0002: 브랜치 전략과 머지 정책

- 상태: Accepted — 2026-05-28 (머지 방식 Squash→Merge commit 변경 반영)
- 관련: `LMS-DOCS/30_설계/10_아키텍처/FE_초기_세팅_결정.md` §1.3 / §1.4 / §2 · `LMS-AGENT-SKILLS/commit-convention/COMMIT_CONVENTION.md`

## 맥락

2인 팀이 8월 마감까지 PR 리뷰 강제와 통합 안정을 가장 가볍게 충족할 브랜치 모델이 필요했다. GitFlow(release/hotfix 분리)는 오버헤드가 크고, Trunk-based는 리뷰 강도가 약해 품질 위험이 있다.

## 결정

- **브랜치 모델**: 단순 GitHub Flow 변형
  - `main`(배포 가능) ← `develop`(통합) ← `feat/<scope>-<desc>`(작업)
  - 예: `feat/auth-login` · `feat/ui-button` · `fix/quiz-result-empty`
- **브랜치 네이밍**: 커밋 컨벤션 §2~§3의 type/scope를 재사용한다.
- **머지 방식**: **Merge commit(`--no-ff`) 단일**. 2026-05-28 Squash→Merge로 변경 — Squash는 파일별 커밋(커밋 컨벤션 §6·§7)을 `main`에서 소실시켜 부적합. PR 제목이 머지 커밋 제목이 되므로 PR 제목에 `type(scope): 설명` 형식을 적용한다. PR 단위 bisect는 `git bisect --first-parent`로 수행한다.
- **머지 조건**: 상호 리뷰 1명 + CI(lint·typecheck·test·build) 통과.
- **CI/CD**: GitHub Actions — `ci.yml`(PR마다 검증) · `deploy-dev.yml`(develop 푸시 시 S3+CloudFront 배포). 배포 1차 대상은 FE 미니 AWS의 S3+CloudFront, CloudFront 기본 도메인(§1.4).

## 근거

- 단순 변형이 PR 리뷰 강제 + 통합 안정을 2인 팀에 가장 가볍게 제공한다.
- Merge commit은 파일별 커밋 이력을 `main`에 보존 → 커밋 컨벤션과 일관, `--first-parent` bisect로 PR 단위 추적 가능.

## 결과

- **장점**: 가벼운 운영, 파일별 커밋 이력 보존, PR 단위 추적성.
- **보류 / 제약 (§2)**: **branch protection은 private + 무료 플랜 제약으로 미적용** → Merge-commit 설정 + 팀 규율로 대체. Pro/Team 업그레이드 또는 공개 전환 시 즉시 활성화. CODEOWNERS도 동일 사유로 보류.
