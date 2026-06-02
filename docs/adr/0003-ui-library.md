# ADR 0003: UI 컴포넌트 — 수동 구현 유지 (shadcn/ui · Storybook 보류)

- 상태: Accepted — 2026-06-02
- 관련: `LMS-DOCS/30_설계/10_아키텍처/FE_초기_세팅_결정.md` §1.2.5 / §1.2.7 / §1.2.13~1.2.14

## 맥락

`FE_초기_세팅_결정.md`는 UI를 **Tailwind v4 + shadcn/ui**(§1.2.13), 컴포넌트 카탈로그를 **Storybook**(§1.2.14), 서버 상태를 **TanStack Query**(§1.2.5), 폼을 **RHF + Zod**(§1.2.7)로 정했다. 그러나 실제 구현이 결정과 어긋난 채 재결정 기록 없이 진행됐다:

- 1주차: Button·Input·Checkbox를 shadcn(radix) 없이 **순수 수동** + `@theme` 토큰으로 구현
- 2주차: Modal·Toast·Empty도 동일하게 수동(`cn` 유틸 포함), `components.json`·radix 미도입
- 카탈로그는 Storybook 대신 `/_styleguide` 라우트(토큰·컴포넌트 데모, 런타임 `getComputedStyle`로 토큰 자동 반영)
- 데이터 페칭·폼 라이브러리(TanStack Query·RHF+Zod)는 미설치 상태였다가 본 작업에서 설치·배선

## 결정

1. **UI 컴포넌트는 수동 구현을 유지**한다. shadcn/ui는 도입하지 않는다.
2. **카탈로그는 `/_styleguide` 라우트**로 운영한다. Storybook은 도입하지 않는다.
3. **데이터 페칭(TanStack Query v5)·폼(RHF + Zod v3)은 §1.2.5·§1.2.7 결정대로 도입**한다(본 ADR 범위 밖이나 같은 작업에서 정상화).

## 근거

- 이미 Button~Toast가 토큰 적용된 수동 컴포넌트로 완성 → shadcn 전환은 매몰비용 + 재작업
- PLAYDATA 시그니처(흰 배경·청록/보라·둥근 카드·미니멀)는 토큰 기반 수동으로 충분히 충족
- 2인·8월 마감 → radix/shadcn·Storybook 설정·학습 부담 회피, 의존성 최소화
- `/_styleguide`는 앱과 동일 환경(토큰·Provider·Tailwind v4)에서 확인 → Storybook의 별도 환경 배선·v4 연동 비용 회피
- 반면 데이터 페칭·폼을 직접 구현하면 캐싱·재검증·폼 검증을 재작성해야 해 라이브러리가 명백히 효율적 (그래서 이 둘은 결정대로 도입)

## 결과

- **장점**: 의존성 최소, 디자인 자유도, 토큰 SSOT 일관, 환경 일치 카탈로그
- **단점**: radix 수준 접근성·엣지케이스(포커스 트랩 등)는 직접 구현 책임 / Storybook 격리·애드온·시각 회귀 없음
- **재검토 트리거**: ① 디자이너 본격 합류 ② 공통 컴포넌트 30+ ③ 시각 회귀(Chromatic 등) 필요 — 충족 시 복잡 컴포넌트 한정 radix primitive 부분 도입 또는 Ladle/Storybook 재평가
- **검증 도구**: 동작 확인은 `/_styleguide`(눈) + vitest 단위 테스트(회귀), 필요 시 vitest browser mode로 승급
- `FE_초기_세팅_결정.md §1.2.13`에 재결정 노트를 반영함
