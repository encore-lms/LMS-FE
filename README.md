# LMS-FE

역량증명서 LMS 프론트엔드. **설계·정책·도메인·백로그·주차 기록은 LMS-DOCS 리포지터리를 단일 기준(SSOT)으로 한다.** 본 레포는 구현(HOW)과 구현 결정(ADR)만 관리한다.

## 기술 스택

React 19 · Vite 6 · TypeScript 5 (strict) · React Router v7 · TanStack Query v5 · Zustand v5 · React Hook Form + Zod v3 · Axios · Recharts · Tailwind CSS v4 + shadcn/ui · MSW · Vitest + Testing Library · ESLint 9 (flat) + Prettier · pnpm 9 (Node 20 LTS).

> 1주차 부트스트랩 시점에는 React/Vite/TS/ESLint/Prettier/Vitest/Husky 골격만 구성돼 있다. 라우터·상태·HTTP·UI 라이브러리·MSW는 후속 증분에서 추가한다. 결정 근거는 LMS-DOCS `30_설계/10_아키텍처/FE_초기_세팅_결정.md` 참조.

## 시작하기

```bash
corepack enable      # pnpm 9 활성화 (최초 1회)
pnpm install
pnpm dev             # 개발 서버 (http://localhost:5173)
```

Node 버전은 `.nvmrc`(20.x LTS)를 따른다. `nvm use`로 맞출 수 있다.

## 스크립트

| 명령              | 설명                               |
| ----------------- | ---------------------------------- |
| `pnpm dev`        | 개발 서버                          |
| `pnpm build`      | 타입체크(`tsc -b`) + 프로덕션 빌드 |
| `pnpm preview`    | 빌드 결과 로컬 미리보기            |
| `pnpm lint`       | ESLint                             |
| `pnpm format`     | Prettier 포맷 적용                 |
| `pnpm typecheck`  | 타입 검사                          |
| `pnpm test`       | 테스트 1회 실행                    |
| `pnpm test:watch` | 테스트 watch 모드                  |

## 폴더 구조

```text
src/
├─ app/         앱 진입점, Provider, Router 루트
├─ components/  도메인 무관 공통 UI (ui · layout · data)
├─ features/    도메인별 화면+로직 (auth · student · instructor · admin · external)
├─ shared/      공용 헬퍼·타입·상수 (api · hooks · lib · types · constants)
└─ styles/      전역 스타일
```

경로 alias: `@/` → `src/`. 폴더 분리 원칙은 LMS-DOCS `FE_초기_세팅_결정.md` §3 참조.

## 브랜치 / 기여

`main`(배포) ← `develop`(통합) ← `feat/<scope>-<desc>`. 상세는 [CONTRIBUTING.md](./CONTRIBUTING.md).
