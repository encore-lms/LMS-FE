# 수강생 PLAY — 미니게임 (타자 · 코딩 스피드 · CS 퀴즈 배틀)

수강생 영역 `/student/play` 의 학습형 미니게임 3종. 모두 **mock 데이터로 실제 플레이 가능**하며,
플레이 → 게임별 결과 → 다시 플레이의 흐름이 동작한다. 결과 화면 3종은 **하나의 공통 틀(`PlayResultView`)** 을 공유한다.

## 화면 · 라우트 · Figma

| 화면                 | 라우트                                   | Figma node  |
| -------------------- | ---------------------------------------- | ----------- |
| 게임 선택            | `/student/play`                          | `418:2172`  |
| 타자 게임            | `/student/play/typing`                   | `428:3015`  |
| 타자 결과            | `/student/play/typing/result`            | `4925:7266` |
| 코딩 스피드          | `/student/play/coding`                   | `4911:6913` |
| 코딩 결과            | `/student/play/coding/result`            | `4917:7092` |
| CS 퀴즈 배틀         | `/student/play/quiz`                     | `4911:7000` |
| CS 퀴즈 결과         | `/student/play/quiz/result`              | `4925:7361` |
| 결과·예외 상태(모달) | 게임/결과 화면 위 모달(별도 라우트 없음) | `3370:5976` |

> 모든 프레임은 수강생 Pages(`2153:28143`) **Main Flow — 05 마일리지 · PLAY** 밴드(`y=43645`)에
> 가로로 배치(선택→타자→결과카탈로그→코딩→퀴즈→코딩결과→타자결과→퀴즈결과).

## 게임 메커니즘

공통: 상단 4-KPI 스트립(`StatStrip`) + 본문 카드 + 사이드 정보 패널. 모든 지표는 **실시간 계산**.
세션은 매 진입 시 항상 처음부터 시작하며(시간/제출 상태를 들고 오지 않음) **무제한 반복** 가능.

### 타자 게임 (3분)

- 제시문을 그대로 입력. `CharCompare` 가 글자 단위로 비교 — **맞으면 초록, 틀리면 빨강+빨간 밑줄**, 미입력은 회색, 현재 위치는 brand 밑줄.
- 입력 영역 테두리/칩: 오타 0 → 초록 "정확하게 입력 중", 오타 발생 → 빨강 "오타 N자".
- KPI: 남은 시간 · 현재 타수(CPM) · 정확도(오타 수) · 예상 점수 — 전부 실시간.
- 완주(제시문과 완전 일치) 또는 시간 종료 또는 결과 제출 → 결과 계산 후 **결과 모달(서버 계산 결과)** 표시. 모달의 "자세히 보기"로 `/typing/result` 상세 페이지로 이동.

### 코딩 스피드 (10분)

- 타자 게임과 동일 메커니즘, 대상이 **코드 스니펫**(Java/JS/Python, monospace, 들여쓰기·기호까지 일치).
- 다른 스니펫 4종 전환 가능. CharCompare `mono` 모드.

### CS 퀴즈 배틀 (문제당 30초 · 10문제 ≈ 5분)

- 4지선다. 보기 선택 즉시 정/오 공개 + 해설. 정답 시 **점수 = 기본 + 시간 보너스 + 콤보 보너스**, 오답 시 콤보 리셋.
- 문제당 30초 종료 시 미응답 = 오답 처리 후 공개. **AI 페이서**(정답 확률 0.72)가 점수를 따라오며 실시간 스코어보드로 대결.
- 마지막 문제 후 → 승패·문제별 정오·콤보 집계해 `/quiz/result` 이동.

## 점수 산식 (클라 계산, mock 서버 재계산 가정)

- 타자·코딩: `score = round(cpm × accuracy × 1.33) + correctChars × 35(콤보 보너스)`
- 퀴즈: 문제당 `1000 + round(남은시간/30 × 500) + (콤보−1) × 200`

## 결과 화면 (공통 틀 `PlayResultView`)

KPI 4 → 결과 카드(뱃지 + 메시지 콜아웃 + 세부 분석 3-up + 액션) → 정보 패널 → 하단 3-up.

- 타자/코딩: 하단 = **최근 기록**(localStorage `lms.play.history.*`, 최신 강조).
- 퀴즈: 결과 카드에 **문제별 정오** 슬림 스트립, 하단 = **최종 스코어보드**(나/AI/승패).

## 결과·예외 상태 — 모달 (Figma `3370:5976` states 명세)

기존 `/student/play/result` 카탈로그 페이지를 폐기하고, 4개 상태를 **상태에 따라 뜨는 모달**로 분산했다.

| 상태                    | 컴포넌트          | 노출 위치 / 트리거                                                                        |
| ----------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| 서버 계산 결과(정상)    | `PlayResultModal` | 게임 종료 시(타자 적용). KPI 4 + 다시 플레이/PLAY로 돌아가기 + "자세히 보기"(상세 페이지) |
| 결과 저장 실패          | `PlayStateModal`  | 결과 페이지(저장 mutation 실패 가정)                                                      |
| 사용 가능한 제시문 없음 | `PlayStateModal`  | PLAY 허브(활성 제시문 0건 가정)                                                           |
| PLAY 기능 미사용 과정   | `PlayStateModal`  | PLAY 허브(`playEnabled=false` 가정)                                                       |

> 예외 3종은 현재 `PlayStateTestNav`(TestModeFab)로 시뮬레이션한다 — BE 연동 시 각 트리거(저장 실패·제시문 0·`playEnabled`)로 교체하고 테스트 컨트롤은 제거한다. 코딩/CS퀴즈 결과는 아직 페이지 흐름이며 타자와 동일하게 모달화 예정.

## 파일

```
src/features/student/play/
  PlaySelectPage.tsx          선택 화면(게임별 라우팅)
  PlayTypingPage.tsx          타자 게임
  PlayTypingResultPage.tsx    타자 결과
  PlayCodingPage.tsx          코딩 스피드
  PlayCodingResultPage.tsx    코딩 결과
  PlayQuizPage.tsx            CS 퀴즈 배틀
  PlayQuizResultPage.tsx      CS 퀴즈 결과
  PlayResultView.tsx          결과 공통 틀(상세 페이지)
  PlayResultModal.tsx         결과 모달(서버 계산 결과)
  PlayStateModal.tsx          예외 상태 모달(저장 실패·제시문 없음·기능 미사용)
  PlayStateTestNav.tsx        예외 상태 모달 시뮬레이터(TestModeFab, FE 목)
  CharCompare.tsx             글자 단위 초록/빨강 피드백
  StatStrip.tsx               상단 4-KPI
  shared.ts                   card·fmtTime·computeMetrics
  history.ts                  최근 기록(localStorage)
  types.ts / queryKeys.ts / mocks.ts
src/features/student/api/play.ts   usePlayOverview/Typing/Coding/QuizBattle
```

## Mock API

| 엔드포인트                     | 응답                                                  |
| ------------------------------ | ----------------------------------------------------- |
| `GET /api/student/play`        | 게임 선택 개요(stats·games·records·ranking)           |
| `GET /api/student/play/typing` | `TypingSession`(durationSec 180, 제시문 4)            |
| `GET /api/student/play/coding` | `CodingSession`(durationSec 600, 스니펫 4)            |
| `GET /api/student/play/quiz`   | `QuizBattle`(perQuestionSec 30, CS 10문항, AI 페이서) |

> mock 변경은 MSW 워커가 시작 시 등록하므로 **dev 서버 재시작/하드 리프레시** 후 반영된다.
