// 증명서 6축·파생 계산 (결정 함수) — 순수 TS, FE 의존성 0(React·컴포넌트 import 금지).
// 나중에 서버로 그대로 추출. AI는 이 값을 소비만 하고 재투입 금지(점수는 여기서만 산정).
// 근거: 6축 확정 공식(성취도60+CS20+코테20 등) · 가공 세부 규칙 보편안.
import type {
  ExamScore,
  PeerEval,
  SixAxis,
  StudentDerived,
  StudentRaw,
} from './types'

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const round1 = (v: number) => Math.round(v * 10) / 10
const mean = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0

/** 상호평가 5축 집계 — 축별 평가자 평균(0~100) */
export function peerAgg(peers: PeerEval[]) {
  return {
    협업: round1(mean(peers.map((p) => p.collaboration))),
    소통: round1(mean(peers.map((p) => p.communication))),
    책임감: round1(mean(peers.map((p) => p.responsibility))),
    문제해결: round1(mean(peers.map((p) => p.problemSolving))),
    기술기여: round1(mean(peers.map((p) => p.techContribution))),
  }
}

const MAX_SLOPE = 10 // 정규화 상한 기울기(점/회) — 가공 세부 규칙(보편안, 팀 확정 전)

/** 성장 추세 — 시험 점수 시간순 선형회귀 기울기 → 0=50, 상승=100/하락=0. 2회 미만 중립 50 */
export function growthTrend(exams: ExamScore[]) {
  if (exams.length < 2) return { slope: 0, normalized: 50 }
  const xs = exams.map((_, i) => i)
  const ys = exams.map((e) => e.score)
  const mx = mean(xs)
  const my = mean(ys)
  const denom = xs.reduce((a, x) => a + (x - mx) ** 2, 0)
  const slope =
    denom === 0
      ? 0
      : xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / denom
  const normalized = clamp(50 + (slope / MAX_SLOPE) * 50)
  return { slope: round1(slope), normalized: round1(normalized) }
}

/** 6축 점수 (확정 공식) */
export function computeSixAxis(raw: StudentRaw): SixAxis {
  const p = peerAgg(raw.peerEvals)
  return {
    기술: round1(0.6 * raw.achievement + 0.2 * raw.cs + 0.2 * raw.codingTest),
    성장: growthTrend(raw.exams).normalized,
    팀워크: round1(mean([p.협업, p.소통, p.책임감, p.문제해결, p.기술기여])),
    책임감: round1(0.8 * raw.attendanceRate + 0.2 * p.책임감),
    소통: p.소통,
    문제해결: clamp(raw.certifiedTsCount * 15), // 1건당 15, 상한 100
  }
}

const GRADE_BANDS: [number, string][] = [
  [90, 'A'],
  [80, 'B'],
  [70, 'C'],
  [60, 'D'],
]
/** 6축 종합 점수 → 등급 (등급_체계 보편 구간) */
export function gradeFrom(score: number) {
  return GRADE_BANDS.find(([min]) => score >= min)?.[1] ?? 'F'
}

/**
 * 파생 전체 조립. 6축·상호평가 집계·성장 추세·등급은 계산.
 * 백분위(코호트)·분포·도메인·교차 신호는 추가 raw가 필요해 지금은 placeholder(추후 확장).
 */
export function derive(raw: StudentRaw): StudentDerived {
  const sixAxis = computeSixAxis(raw)
  const overall = mean(Object.values(sixAxis))
  return {
    studentId: raw.studentId,
    sixAxis,
    percentile: {}, // 코호트 표본 필요 → 추후
    grade: gradeFrom(overall),
    peerAgg: peerAgg(raw.peerEvals),
    achieveDist: {}, // 카테고리별 raw 필요 → 추후
    growthTrend: growthTrend(raw.exams),
    problem3: { 데이터처리: 0, 모델튜닝: 0, 인프라배포: 0 }, // 트슈 카테고리 raw 필요 → 추후
    domainWeight: {}, // 프로젝트 raw 필요 → 추후
    cross: {
      tsCategoryDist: {},
      projectStackFreq: {},
      achieveBySubjectTime: [],
      tsDiversity: 0,
      tsDaysTrend: 0,
    },
  }
}
