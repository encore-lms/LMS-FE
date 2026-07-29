# ADR 0001: 기술 스택

- 상태: Accepted — 2026-05-27
- 관련: `LMS-DOCS/30_설계/10_아키텍처/FE_초기_세팅_결정.md` §1.1 / §1.2 · `기술_스택.md`

## 맥락

Figma 화면 설계가 완료된 2026-05-27 시점에 React 구현을 시작하며 프레임워크·상태·폼·HTTP·테스트·툴링 스택을 한 번에 확정해야 했다. 선택 기준은 13개 도메인·5탭 증명서·역할 4종·인증 상태 전이의 복잡도와 2인·8월 마감 제약이다. 전체 스택의 SSOT는 `FE_초기_세팅_결정.md §1.1~§1.2`이며, 본 ADR은 그 결정을 LMS-FE 구현 결정 기록으로 요약·고정한다.

## 결정

| 영역            | 선택                                                                            |
| --------------- | ------------------------------------------------------------------------------- |
| React           | 19.x                                                                            |
| 빌드 도구       | Vite 6.x                                                                        |
| 언어            | TypeScript 5.x (strict)                                                         |
| 라우터          | React Router v7                                                                 |
| 서버 상태       | TanStack Query v5                                                               |
| 클라이언트 상태 | Zustand v5                                                                      |
| 폼              | React Hook Form v7 + Zod v3 (`@hookform/resolvers`)                             |
| HTTP            | Axios v1 + interceptor                                                          |
| 차트            | Recharts v2                                                                     |
| 테스트          | Vitest + Testing Library (RTL)                                                  |
| 코드 품질       | ESLint v9 (flat) + Prettier + prettier-plugin-tailwindcss + Husky + lint-staged |
| 패키지 / 런타임 | pnpm v9 · Node 20 LTS                                                           |
| UI              | Tailwind CSS v4 + `@theme` 토큰 (UI 라이브러리 세부 결정은 ADR 0003)            |
| API mock        | MSW                                                                             |

## 근거 (요약 — 상세는 §1.2)

- **Vite**: 인증 필수 사내 도구라 SSR/SEO 이점 적음 → Next.js 불필요. esbuild dev 즉시 시작·HMR 안정.
- **TS strict**: 도메인 복잡도에서 타입 안전이 런타임 버그를 원천 차단. 처음부터 strict라야 전환 비용 회피.
- **React Router v7**: v6와 사용 패턴 동일·생태계가 v7로 이동 중 → v6 신규 채택은 곧 마이그레이션 비용.
- **TanStack Query**: 마트 읽기·증명서 미리보기·지표 카드의 캐싱·재검증·background refetch가 빈번.
- **Zustand**: 사이드바·모달·auth store 수준 경량 상태에 적수(Provider·보일러플레이트 최소).
- **RHF + Zod**: 폼 다수(출결·프로젝트 마법사·기록 등록)에 uncontrolled 리렌더 최소 + 스키마로 타입·검증 통합. 호환 안정성 위해 Zod는 v3.
- **Axios**: 401·세션 만료·에러 표준화에 interceptor 패턴이 자연스러움.
- **Vitest**: Vite 네이티브·Jest API 호환·ESM 기본·실행 속도.
- **pnpm v9 / Node 20 LTS**: 설치 속도·디스크 절약·워크스페이스 + LTS 안정성.

## 결과

- **장점**: 최신 stable이라 마이그레이션 부담 없음, 타입 안전, 캐싱·폼 검증을 라이브러리에 위임, 툴링 자동화로 리뷰 부담↓.
- **주의 / 후속**: Zod v4 마이그레이션은 안정화 후 별도 검토. commitlint는 1주차 보류(§2). RHF+Zod·Recharts 등 일부는 도입 시점이 후속 증분(폼 배선은 2주차 이후).
- **재결정**: UI 라이브러리(Tailwind v4 + shadcn/ui)는 2026-06-02 수동 컴포넌트 유지로 재결정 → **ADR 0003**. 서버 상태·폼은 본 결정대로 도입.
