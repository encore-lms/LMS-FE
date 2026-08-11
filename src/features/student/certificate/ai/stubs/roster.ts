import type {
  AiAnalysis,
  CertificateDetailTabsResult,
  CertificateScoreResult,
} from '../types'
import {
  createParkSujinDetailTabs,
  createParkSujinScore,
  PARK_SUJIN_AI_ANALYSIS,
} from './park-sujin'

/**
 * 34기 실제 로스터 — 이름·역량 점검(1·2차) 점수는 배포 BE 실측(2026-08-11 채점 확정)이다.
 * 관리자 증명서 미리보기가 어떤 수강생을 열어도 이름·점수가 실제와 일치하도록,
 * 이 테이블에서 학생별 목데이터를 결정론적으로 파생한다.
 * 황수빈(데모 계정)만 손으로 만든 리치 스텁(park-sujin.ts)을 그대로 쓴다.
 */
export interface RosterEntry {
  id: string
  name: string
  q1: number
  q2: number
  /** 블로그 제출 주 수(실측) */
  blogs: number
  /** 과제 제출 수(실측, 총 10건 기준) */
  assigns: number
}

export const HWANG_SUBIN_ID = 'f074a93b-5ad7-4234-ba35-4e260d9272ea'

export const REAL_ROSTER: RosterEntry[] = [
  { id: '173c1f4a-8f1a-4347-9313-a616928c747e', name: '김건우', q1: 84, q2: 86, blogs: 6, assigns: 6 },
  { id: 'c83424f0-3657-464d-8755-ffbf0bdd4300', name: '김기호', q1: 93, q2: 94, blogs: 5, assigns: 6 },
  { id: '36b5abd6-20b7-4371-8333-0884806535d2', name: '김대호', q1: 83, q2: 72, blogs: 3, assigns: 4 },
  { id: '8fda7ecf-ab02-4c70-b6cb-f99252b97208', name: '김동섭', q1: 92, q2: 83, blogs: 5, assigns: 6 },
  { id: '3e8122dc-2fcd-4965-9482-1461a40071d1', name: '김재현', q1: 63, q2: 60, blogs: 2, assigns: 2 },
  { id: '7a63e4f0-a5cb-4bfb-96d2-d13f3c9eac40', name: '김진화', q1: 82, q2: 90, blogs: 5, assigns: 6 },
  { id: 'fcc3ae0a-a921-4f3a-9a32-0992a225dbee', name: '김태윤', q1: 84, q2: 92, blogs: 5, assigns: 6 },
  { id: 'cc416cf9-ee44-4568-9298-d72e13fbb3f9', name: '김현지', q1: 94, q2: 92, blogs: 5, assigns: 6 },
  { id: 'b8f5bec7-a8e1-4b95-b646-481aeda7acac', name: '노민환', q1: 70, q2: 76, blogs: 3, assigns: 4 },
  { id: '84333024-ae0e-46a1-8199-96c667b95157', name: '문성호', q1: 90, q2: 72, blogs: 3, assigns: 4 },
  { id: 'bbc694f0-9325-426c-a85d-dca6cd4f39bb', name: '송승재', q1: 96, q2: 97, blogs: 5, assigns: 6 },
  { id: 'd9748c45-3779-428a-9509-344272e385f3', name: '윤성호', q1: 65, q2: 72, blogs: 2, assigns: 2 },
  { id: '75130370-ad62-4a2b-b0b3-25d3c9f4995a', name: '이성민', q1: 50, q2: 47, blogs: 1, assigns: 2 },
  { id: '27652d16-2c51-444e-80e9-378e7d88da36', name: '이현준', q1: 90, q2: 78, blogs: 3, assigns: 4 },
  { id: '3745ede2-1a35-4a25-9f50-870b6e256883', name: '이홍규', q1: 64, q2: 74, blogs: 4, assigns: 2 },
  { id: 'bcb748bf-4649-4414-b6bf-cccdbad3d8e6', name: '임형준', q1: 76, q2: 60, blogs: 2, assigns: 2 },
  { id: '272cc951-d4f9-49df-b4b7-900fa5e2478b', name: '전진영', q1: 82, q2: 74, blogs: 3, assigns: 4 },
  { id: '7d369529-546c-4ac3-ba23-bc2bb762e8aa', name: '전진환', q1: 51, q2: 53, blogs: 5, assigns: 2 },
  { id: '1ca3e604-be73-42f8-95ab-cad06f202333', name: '정예린', q1: 56, q2: 64, blogs: 4, assigns: 2 },
  { id: '3f6250fa-91a7-4719-8b30-3abd7d94b37d', name: '채정석', q1: 80, q2: 67, blogs: 2, assigns: 4 },
  { id: '6503f5a9-d91a-4729-a5d9-3345aa2af448', name: '최대원', q1: 81, q2: 75, blogs: 3, assigns: 4 },
  { id: '2ac2a82b-7b1e-4238-9c22-a019e3995569', name: '최성욱', q1: 47, q2: 60, blogs: 3, assigns: 2 },
  { id: '1af5e5c1-2f6b-4fce-9e26-0c36b1266842', name: '최인영', q1: 96, q2: 92, blogs: 5, assigns: 6 },
  { id: '84310db5-c5c5-4f56-8fb1-7780dec1a30b', name: '홍지윤', q1: 76, q2: 78, blogs: 3, assigns: 4 },
  { id: 'f074a93b-5ad7-4234-ba35-4e260d9272ea', name: '황수빈', q1: 100, q2: 96, blogs: 8, assigns: 9 },
  { id: '02b388be-68fa-44b0-9050-14890cf419d1', name: '황호순', q1: 76, q2: 96, blogs: 3, assigns: 6 },
]

export const ROSTER_BY_ID = new Map(REAL_ROSTER.map((s) => [s.id, s]))

/**
 * 팀 인증 프로젝트 — 배포 BE 실측(2026-08-11 강사 인증 완료)과 1:1.
 * id는 실제 프로젝트 uuid라 증명서에서 워크스페이스로 바로 이동한다.
 */
export interface TeamProjectSpec {
  id: string
  name: string
  domain: string
  startedAt: string
  endedAt: string
  techStacks: string[]
  outcomes: string[]
  tasks: string[]
  challenge: string
  action: string
  result: string
  strength: string
}

type TeamKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export const TEAM_PROJECTS: Record<TeamKey, [TeamProjectSpec, TeamProjectSpec]> = {
  A: [
    {
      id: 'e5b34477-2837-4463-8430-c2a8f2bb1169',
      name: '편의점 판매 데이터로 본 상권별 매출 분석',
      domain: '리테일 · 상권 분석',
      startedAt: '2026-06-30',
      endedAt: '2026-07-25',
      techStacks: ['Python', 'pandas', 'SQL', 'Tableau'],
      outcomes: [
        '공공 편의점 판매 데이터와 상권 정보 결합 데이터셋 구축',
        '상권 유형 5개 클러스터 도출 · 시간대별 판매 패턴 규명',
      ],
      tasks: ['상권 정보 결합 및 정제', '상권 유형별 매출 EDA'],
      challenge: '행정동 기준이 서로 다른 두 공공 데이터의 결합',
      action: '행정동 코드 매핑 테이블을 만들어 결합 기준을 통일했습니다.',
      result: '상권 유형별 매출 패턴 리포트를 완성해 강사 인증을 받았습니다.',
      strength: '공공 데이터 결합·정제 경험',
    },
    {
      id: '823ee1c1-c740-4ced-9644-1436c1b98c33',
      name: '중고거래 플랫폼 시세 예측 모델',
      domain: '커머스 · 시세 예측',
      startedAt: '2026-07-28',
      endedAt: '2026-08-08',
      techStacks: ['Python', 'scikit-learn', 'LightGBM', 'FastAPI'],
      outcomes: [
        '허위 매물 제거 기준(IQR 1.5배) 수립 후 시세 데이터 정제',
        'LightGBM 모델로 카테고리별 MAE 개선 · 예측 API 데모 구성',
      ],
      tasks: ['카테고리·상태 파생 변수 설계', 'LightGBM 튜닝'],
      challenge: '허위 호가가 섞인 가격 데이터의 노이즈',
      action: 'IQR 기반 이상 호가 제거 기준을 세워 학습 데이터를 정제했습니다.',
      result: '베이스라인 대비 예측 오차를 줄여 강사 인증을 받았습니다.',
      strength: '노이즈 데이터 정제와 모델 개선',
    },
  ],
  B: [
    {
      id: '97a0c6bc-4add-47f6-9a85-3d41b879905e',
      name: '지역별 만성질환 진료 데이터 분석',
      domain: '헬스케어 · 공공의료 분석',
      startedAt: '2026-06-30',
      endedAt: '2026-07-25',
      techStacks: ['Python', 'pandas', 'geopandas', 'matplotlib'],
      outcomes: [
        '고혈압·당뇨 유병률의 지역·연령 교차 분석',
        '행정구역 지도 시각화로 지역 편차 규명',
      ],
      tasks: ['행정구역 코드 정합', '질환별 유병률 EDA'],
      challenge: '연도마다 바뀌는 행정구역 코드의 정합',
      action: '기준 연도 코드 체계로 통일하는 정합 테이블을 만들었습니다.',
      result: '지역 편차 리포트를 완성해 강사 인증을 받았습니다.',
      strength: '공공 보건 데이터 정합·시각화',
    },
    {
      id: 'c4e68271-501c-4699-bdd6-d90d33bcbf12',
      name: '웨어러블 심박 데이터 이상 탐지',
      domain: 'IoT · 센서 이상 탐지',
      startedAt: '2026-07-28',
      endedAt: '2026-08-08',
      techStacks: ['Python', 'NumPy', 'scikit-learn', 'PyTorch'],
      outcomes: [
        'PhysioNet 공개 심박 데이터 구간 분할·정규화 파이프라인',
        'Isolation Forest 대비 오토인코더 recall 비교 평가',
      ],
      tasks: ['구간 분할·정규화 전처리', '오토인코더 모델 비교'],
      challenge: '이상 구간 라벨이 희소한 시계열의 평가',
      action: 'recall 우선 지표를 합의하고 두 모델을 같은 기준으로 비교했습니다.',
      result: '이상 탐지 비교 리포트를 완성해 강사 인증을 받았습니다.',
      strength: '시계열 전처리와 모델 비교 평가',
    },
  ],
  C: [
    {
      id: 'd361f992-0380-4bc7-96e1-e1a4cdf1adca',
      name: '카드 소비 데이터로 본 세대별 소비 트렌드',
      domain: '금융 · 소비 트렌드 분석',
      startedAt: '2026-06-30',
      endedAt: '2026-07-25',
      techStacks: ['Python', 'pandas', 'SQL', 'Plotly'],
      outcomes: [
        '세대 × 업종 × 분기 3개 축의 소비 변화 분석',
        '업종 분류 체계 정리 후 대시보드 시각화',
      ],
      tasks: ['업종 분류 체계 정리', '세대·업종 EDA'],
      challenge: '카드사마다 다른 업종 분류 체계',
      action: '표준 업종 매핑을 정의해 분류 기준을 통일했습니다.',
      result: '세대별 소비 트렌드 대시보드를 완성해 강사 인증을 받았습니다.',
      strength: '분류 체계 표준화와 대시보드 구성',
    },
    {
      id: 'bb2e7219-cf2a-42bf-821d-efb2ee79acc1',
      name: '신용카드 이상 거래 탐지 모델',
      domain: '핀테크 · 이상 거래 탐지',
      startedAt: '2026-07-28',
      endedAt: '2026-08-08',
      techStacks: ['Python', 'scikit-learn', 'XGBoost', 'imbalanced-learn'],
      outcomes: [
        '사기 비율 0.2% 불균형에서 SMOTE·클래스 가중치 비교 실험',
        '임계값별 정밀도-재현율 분석으로 운영 기준 제시',
      ],
      tasks: ['클래스 불균형 처리 전략 비교', 'XGBoost 학습·튜닝'],
      challenge: '극단적 클래스 불균형(사기 0.2%)에서의 학습',
      action: 'SMOTE와 클래스 가중치를 같은 조건에서 실험해 비교했습니다.',
      result: '임계값 운영 기준까지 담은 리포트로 강사 인증을 받았습니다.',
      strength: '불균형 데이터 실험 설계',
    },
  ],
  D: [
    {
      id: 'b65bb095-7abc-4cb8-ac0a-92c434e087d7',
      name: '지하철 시간대별 혼잡도 분석',
      domain: '교통 · 혼잡도 분석',
      startedAt: '2026-06-30',
      endedAt: '2026-07-25',
      techStacks: ['Python', 'pandas', 'folium', 'matplotlib'],
      outcomes: [
        '서울 1~9호선 상반기 승하차 데이터 혼잡 패턴 분석',
        '환승역 집중 현상 규명 · 노선도 시각화',
      ],
      tasks: ['역·노선 마스터 정리', '시간대별 혼잡 EDA'],
      challenge: '역명 표기가 제각각인 승하차 데이터의 정리',
      action: '역·노선 마스터 테이블을 만들어 표기를 통일했습니다.',
      result: '혼잡도 분석 리포트를 완성해 강사 인증을 받았습니다.',
      strength: '대용량 공공 데이터 정리·시각화',
    },
    {
      id: 'd10e2a86-dbc7-4780-8191-7bf2551b779a',
      name: '택배 배송 소요 시간 예측 모델',
      domain: '물류 · 배송 예측',
      startedAt: '2026-07-28',
      endedAt: '2026-08-08',
      techStacks: ['Python', 'scikit-learn', 'LightGBM', 'pandas'],
      outcomes: [
        '출발·도착 지역 쌍 파생 변수 설계',
        'LightGBM으로 지역 쌍 평균 대비 MAE 개선',
      ],
      tasks: ['출발·도착 지역 파생 변수', 'LightGBM 학습·튜닝'],
      challenge: '지역 쌍 조합이 많아 희소한 학습 데이터',
      action: '지역을 권역으로 묶는 파생 변수로 희소성을 줄였습니다.',
      result: '배송 시간 예측 모델을 완성해 강사 인증을 받았습니다.',
      strength: '파생 변수 설계와 회귀 모델링',
    },
  ],
  E: [
    {
      id: '19fa40b9-afc4-4396-8ba4-25135c97af5b',
      name: '건물 유형별 전력 사용량 패턴 분석',
      domain: '에너지 · 사용량 분석',
      startedAt: '2026-06-30',
      endedAt: '2026-07-25',
      techStacks: ['Python', 'pandas', 'seaborn', 'SQL'],
      outcomes: [
        '주거·상업·산업 계약종별 사용 패턴 비교',
        '계절·시간대 피크 수요 분석',
      ],
      tasks: ['건물 유형 분류 정리', '계절·시간대 EDA'],
      challenge: '계약종별 코드와 실제 건물 유형의 불일치',
      action: '계약종-유형 매핑 규칙을 정의해 비교 기준을 세웠습니다.',
      result: '전력 사용 패턴 리포트를 완성해 강사 인증을 받았습니다.',
      strength: '에너지 데이터 분류·패턴 분석',
    },
    {
      id: '155f21aa-d017-48ca-b43e-d6535b5ac947',
      name: '미세먼지 농도 예측 모델',
      domain: '환경 · 대기질 예측',
      startedAt: '2026-07-28',
      endedAt: '2026-08-08',
      techStacks: ['Python', 'scikit-learn', 'XGBoost', 'pandas'],
      outcomes: [
        '대기질·기상 데이터 결합 · 측정소별 결측 처리',
        '측정소 단위 24시간 후 PM10 예측 모델',
      ],
      tasks: ['측정소별 결측 처리', '시계열 파생 변수 설계'],
      challenge: '측정소마다 다른 결측 구간의 처리',
      action: '측정소별 결측 패턴을 나눠 보간 전략을 달리 적용했습니다.',
      result: 'PM10 예측 모델을 완성해 강사 인증을 받았습니다.',
      strength: '시계열 결측 처리와 예측 모델링',
    },
  ],
  F: [
    {
      id: '98bac45c-90f1-4019-af9a-adab280aea25',
      name: '박스오피스 흥행 요인 분석',
      domain: '미디어 · 흥행 분석',
      startedAt: '2026-06-30',
      endedAt: '2026-07-25',
      techStacks: ['Python', 'pandas', 'BeautifulSoup', 'Plotly'],
      outcomes: [
        '개봉 시기 × 장르 교차 분석으로 흥행 가설 검증',
        '감독·배급사 영향 분석 리포트',
      ],
      tasks: ['개봉 시기·장르 정리', '장르·시즌 교차 분석'],
      challenge: '재개봉·확장판이 섞인 집계 데이터의 중복',
      action: '작품 단위 기준을 정의해 중복 집계를 제거했습니다.',
      result: '흥행 요인 리포트를 완성해 강사 인증을 받았습니다.',
      strength: '가설 검증형 분석 설계',
    },
    {
      id: '0a4e4652-ecda-4e7d-b88e-fa16fdfe60f7',
      name: '뉴스 기사 토픽 분류 모델',
      domain: 'NLP · 텍스트 분류',
      startedAt: '2026-07-28',
      endedAt: '2026-08-08',
      techStacks: ['Python', 'KoNLPy', 'scikit-learn', 'PyTorch'],
      outcomes: [
        '5개 대분류 뉴스 코퍼스 전처리 파이프라인',
        'TF-IDF 베이스라인 대비 KoBERT 파인튜닝 비교',
      ],
      tasks: ['형태소 분석·전처리', 'TF-IDF 베이스라인'],
      challenge: '경제·사회처럼 경계가 흐린 토픽 쌍의 혼동',
      action: '혼동 행렬로 경계 사례를 뽑아 라벨 기준을 재정의했습니다.',
      result: '토픽 분류 비교 리포트를 완성해 강사 인증을 받았습니다.',
      strength: '한국어 텍스트 전처리와 분류 실험',
    },
  ],
}

/** 학생 이름 → 팀 — 시딩 실측과 동일한 편성. */
export const TEAM_OF: Record<string, TeamKey> = {
  황수빈: 'A', 최인영: 'A', 이홍규: 'A', 김건우: 'A',
  김기호: 'B', 김대호: 'B', 김동섭: 'B', 김재현: 'B', 김진화: 'B',
  김태윤: 'C', 김현지: 'C', 노민환: 'C', 문성호: 'C', 송승재: 'C',
  윤성호: 'D', 이성민: 'D', 이현준: 'D', 임형준: 'D',
  전진영: 'E', 전진환: 'E', 정예린: 'E', 채정석: 'E',
  최대원: 'F', 최성욱: 'F', 홍지윤: 'F', 황호순: 'F',
}

const TEAM_OWNER: Record<TeamKey, string> = {
  A: '황수빈', B: '김기호', C: '김태윤', D: '윤성호', E: '전진영', F: '최대원',
}

/** 전진환 개인 인증 프로젝트(따릉이) — 팀 2건에 더해 도넛 세 번째 조각이 된다. */
const BIKE_PROJECT: TeamProjectSpec = {
  id: '7c4d0972-35c8-4d0d-9500-4f44276b954e',
  name: '서울시 따릉이 대여 수요 예측',
  domain: '모빌리티 · 수요 예측',
  startedAt: '2026-07-14',
  endedAt: '2026-08-29',
  techStacks: ['Python', 'pandas', 'scikit-learn', 'XGBoost', 'matplotlib'],
  outcomes: [
    '대여 이력·기상 데이터 결합 후 수요 패턴 규명',
    '강수 1mm 이상 시 대여량 62% 감소 등 핵심 요인 도출',
  ],
  tasks: ['시간대·요일·날씨 파생 변수 생성', 'XGBoost 모델 학습 및 튜닝'],
  challenge: '대여소별 편차가 큰 수요의 예측 단위 설정',
  action: '전체 합계 대신 대여소 단위 예측으로 문제를 재정의했습니다.',
  result: '수요 예측 모델을 완성해 강사 인증을 받았습니다.',
  strength: '문제 재정의와 시계열 모델링',
}

/** 학생의 인증 프로젝트 목록 — 팀 2건 + 개인(전진환 따릉이). 황수빈 개인 건은 park-sujin 정본에 있다. */
export function certifiedProjectsOf(name: string): TeamProjectSpec[] {
  const team = TEAM_OF[name]
  const list: TeamProjectSpec[] = team ? [...TEAM_PROJECTS[team]] : []
  if (name === '전진환') list.push(BIKE_PROJECT)
  return list
}

/** 인증 프로젝트 도메인 분포 — 개수 균등, 합이 정확히 100이 되게 잔여는 첫 항목에. */
export function domainShare(
  labels: string[],
): { label: string; projectCount: number; percentage: number }[] {
  if (labels.length === 0) return []
  const share = Math.floor(1000 / labels.length) / 10
  const first = Math.round((100 - share * (labels.length - 1)) * 10) / 10
  return labels.map((label, i) => ({
    label,
    projectCount: 1,
    percentage: i === 0 ? first : share,
  }))
}

/** 이름 기반 결정론 시드 — 재실행·재렌더에도 같은 값이 나오게 한다. */
export function rosterSeed(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 100_000
  return h
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))
const r1 = (v: number) => Math.round(v * 10) / 10

/** 팀 인증 프로젝트 기여 점수 — 개별 평가가 없어 평균 주변 결정론 변주(데모 추정치). */
export function rosterProjectContribution(entry: RosterEntry) {
  const avg = r1((entry.q1 + entry.q2) / 2)
  const seed = rosterSeed(entry.name)
  return r1(clamp(avg + (((seed >> 8) % 13) - 6), 60, 96))
}

/** 실측 퀴즈 평균에서 6축을 파생 — 평가 시스템이 없는 축은 평균 주변 결정론 변주. */
export function rosterAxisScores(entry: RosterEntry) {
  const avg = r1((entry.q1 + entry.q2) / 2)
  const seed = rosterSeed(entry.name)
  const wiggle = (k: number, spread: number) =>
    r1(clamp(avg + (((seed >> k) % (spread * 2 + 1)) - spread), 40, 99))
  return {
    // 역량 점검 70% + 인증 팀 프로젝트 기여 30% — 실측 산식.
    기술: r1(avg * 0.7 + rosterProjectContribution(entry) * 0.3),
    소통: wiggle(2, 8),
    문제해결: wiggle(4, 10),
    책임감: wiggle(6, 6),
    // 실측 산식 — 출석(HRD 100%) 70 + 블로그 30×(주/8) + 과제 가산 3×(건/10).
    학습지속성: r1(
      clamp(70 + 30 * (entry.blogs / 8) + 3 * (entry.assigns / 10), 70, 100),
    ),
    성취도: avg,
  }
}

export function rosterOverall(entry: RosterEntry) {
  const a = rosterAxisScores(entry)
  const values = [a.기술, a.소통, a.문제해결, a.책임감, a.학습지속성, a.성취도]
  return r1(values.reduce((s, v) => s + v, 0) / values.length)
}

/** 로스터 학생 점수 — 황수빈은 리치 스텁(+팀 도메인 오버레이), 나머지는 실측 파생 generic. */
export function createRosterScore(studentId: string): CertificateScoreResult {
  const entry = ROSTER_BY_ID.get(studentId)
  if (!entry || entry.id === HWANG_SUBIN_ID) {
    const rich = createParkSujinScore(studentId)
    // 황수빈 실측: 개인 인증(채용 스택 지도) + A팀 인증 2건 = 3건.
    return {
      ...rich,
      domainExperience: domainShare([
        rich.domainExperience[0]?.label ?? '데이터 · 채용 시장 분석',
        TEAM_PROJECTS.A[0].domain,
        TEAM_PROJECTS.A[1].domain,
      ]),
    }
  }
  const base = createParkSujinScore(studentId)
  const certified = certifiedProjectsOf(entry.name)
  const contrib = rosterProjectContribution(entry)
  const a = rosterAxisScores(entry)
  const avg = r1((entry.q1 + entry.q2) / 2)
  const scoreOf: Record<string, number> = {
    '기술·기술기여': a.기술,
    '소통·협업·팀워크': a.소통,
    문제해결: a.문제해결,
    책임감: a.책임감,
    학습지속성: a.학습지속성,
    '성취도 평가': a.성취도,
  }
  const blogApplied = r1(30 * (entry.blogs / 8))
  const assignApplied = r1(3 * (entry.assigns / 10))
  const detailOf: Record<string, string> = {
    '기술·기술기여': `역량 점검 평균 ${avg} × 0.7 + 프로젝트 기여 ${contrib} × 0.3 (인증 ${certified.length}건)`,
    '소통·협업·팀워크': '멘토링·Q&A 활동 기반 산정 전 — 데모 추정치',
    문제해결: '인증 트러블슈팅 없음 — 데모 추정치',
    책임감: '출석률 100 × 0.6 + 학습 기록 × 0.4 — 데모 추정치',
    학습지속성: `출석 70점 + 블로그 ${blogApplied}점 + 과제 가산 ${assignApplied}점`,
    '성취도 평가': `역량 점검 2회 평균 ${avg}점 · 1차 ${entry.q1} / 2차 ${entry.q2}`,
  }
  // 학습지속성 KPI 카드는 evidence를 attendance/blog/assignment/study/mentoring
  // 키로 찾는다 — 실측(블로그·과제 제출 수)으로 채워 축 점수와 합이 맞게 한다.
  const persistenceEvidence = [
    {
      key: 'attendance',
      label: '출석률',
      value: 100,
      unit: '%' as const,
      numerator: 6,
      denominator: 6,
      weightPercent: 70,
      appliedScore: 70,
      detail: 'HRD 인정 100% · 70점 반영',
    },
    {
      key: 'blog',
      label: '블로그 제출률',
      value: r1((entry.blogs / 8) * 100),
      unit: '%' as const,
      numerator: entry.blogs,
      denominator: 8,
      weightPercent: 30,
      appliedScore: blogApplied,
      detail: `${entry.blogs}/8주 · ${blogApplied}점 반영`,
    },
    {
      key: 'assignment',
      label: '과제 제출률',
      value: r1((entry.assigns / 10) * 100),
      unit: '%' as const,
      numerator: entry.assigns,
      denominator: 10,
      weightPercent: null,
      appliedScore: assignApplied,
      detail: `${entry.assigns}/10건 · +${assignApplied}점`,
    },
    {
      key: 'study',
      label: '스터디 참여율',
      value: 0,
      unit: '%' as const,
      numerator: 0,
      denominator: 8,
      weightPercent: null,
      appliedScore: 0,
      detail: '참여 기록 없음',
    },
    {
      key: 'mentoring',
      label: '멘토링 참석률',
      value: 0,
      unit: '%' as const,
      numerator: 0,
      denominator: 6,
      weightPercent: null,
      appliedScore: 0,
      detail: '참석 기록 없음',
    },
  ]
  const axes = base.axes.map((axis) => ({
    ...axis,
    score: scoreOf[axis.key] ?? axis.score,
    detail: detailOf[axis.key] ?? axis.detail,
    evidence:
      axis.key === '학습지속성'
        ? persistenceEvidence
        : [
            {
              key: 'rosterDemo',
              label: `${axis.key} 산정`,
              value: scoreOf[axis.key] ?? 0,
              unit: '점' as const,
              numerator: null,
              denominator: null,
              weightPercent: 100,
              appliedScore: scoreOf[axis.key] ?? 0,
              detail: detailOf[axis.key] ?? '',
            },
          ],
  }))
  const overall = rosterOverall(entry)
  return {
    ...base,
    student: {
      ...base.student,
      studentId,
      studentName: entry.name,
    },
    overallScore: overall,
    grade: overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : 'D',
    axes,
    projectNavigation: {
      issuesProjectId: certified[0]?.id ?? base.projectNavigation.issuesProjectId,
      peerEvaluationProjectId:
        certified[0]?.id ?? base.projectNavigation.peerEvaluationProjectId,
    },
    domainExperience: domainShare(certified.map((p) => p.domain)),
    metrics: base.metrics.map((m) => {
      if (m.key === 'assessment')
        return {
          ...m,
          value: avg,
          detail: `역량 점검 2회 · ${entry.q1}점 / ${entry.q2}점`,
        }
      if (m.key === 'attendance') return m // 전원 HRD 100% 동일
      if (m.key === 'blog')
        return {
          ...m,
          value: r1((entry.blogs / 8) * 100),
          detail: `${entry.blogs} / 8주 제출`,
        }
      if (m.key === 'certifiedProject')
        return {
          ...m,
          value: certified.length,
          detail: `팀 프로젝트 ${certified.length}건 인증`,
        }
      // 트러블슈팅·자격증은 이 학생에게 아직 없다.
      if (m.key === 'certifiedTroubleshooting')
        return { ...m, value: 0, detail: '인증 사례 없음' }
      if (m.key === 'certifiedCertificate')
        return { ...m, value: 0, detail: '승인 자격증 없음' }
      return m
    }),
  }
}

/** 로스터 학생 상세 탭 — 평가 이력은 실측 2건, 나머지는 빈 상태. */
export function createRosterDetailTabs(
  studentId: string,
): CertificateDetailTabsResult {
  const entry = ROSTER_BY_ID.get(studentId)
  if (!entry || entry.id === HWANG_SUBIN_ID) {
    return createParkSujinDetailTabs(studentId)
  }
  const base = createParkSujinDetailTabs(studentId)
  const avg = r1((entry.q1 + entry.q2) / 2)
  const assessments = [
    {
      id: `${entry.id}-assessment-1`,
      title: '1차 역량 점검 — Python 기초와 자료구조',
      assessmentType: 'ACHIEVEMENT' as const,
      category: 'Python',
      score: entry.q1,
      submittedAt: '2026-07-03T15:40:00',
      cohortAverageScore: 76.9,
      relativeScore: null,
      comparisonCount: 26,
    },
    {
      id: `${entry.id}-assessment-2`,
      title: '2차 역량 점검 — SQL과 관계형 데이터베이스',
      assessmentType: 'ACHIEVEMENT' as const,
      category: 'SQL',
      score: entry.q2,
      submittedAt: '2026-07-24T15:40:00',
      cohortAverageScore: 76.4,
      relativeScore: null,
      comparisonCount: 26,
    },
  ]
  return {
    ...base,
    tech: {
      ...base.tech,
      averageScore: avg,
      categories: assessments.map((a) => ({
        assessmentType: a.assessmentType,
        label: a.category,
        score: a.score,
        attemptCount: 1,
        topPercent: null,
        populationSize: 26,
      })),
      assessments,
      certifications: [],
      assignments: [],
      limitations: ['자격증·과제 데이터가 아직 없습니다.'],
    },
    problem: {
      ...base.problem,
      certifiedCount: 0,
      independentRate: 0,
      averageDays: 0,
      categories: [],
      cases: [],
      peerEvaluatorCount: 0,
      peerTags: [],
      peerTagCases: [],
      limitations: ['인증된 트러블슈팅 사례가 아직 없습니다.'],
    },
    growth: {
      ...base.growth,
      peerEvaluationCount: 0,
      peerComments: [],
      limitations: ['동료 평가가 아직 수집되지 않았습니다.'],
    },
  }
}

/** 팀 인증 프로젝트 스냅샷 — AI 분석 프로젝트 탭에 실측 그대로 얹는다. */
function teamProjectSnapshot(
  spec: TeamProjectSpec,
  order: number,
  role: 'OWNER' | 'MEMBER',
  scope: string,
) {
  return {
    projectId: spec.id,
    order,
    name: spec.name,
    period: { startedAt: spec.startedAt, endedAt: spec.endedAt },
    certificationStatus: 'CERTIFIED' as const,
    status: 'READY' as const,
    membershipRole: role,
    teamContext: {
      domain: spec.domain,
      scope,
      techStacks: spec.techStacks,
      outcomes: spec.outcomes,
    },
    personalEvidence: {
      tasks: spec.tasks,
      workCategories: order === 1 ? ['데이터 정제·EDA'] : ['모델링·평가'],
      technologies: spec.techStacks,
      peerObservations: [],
      troubleshootingCases: [],
      artifacts: ['GitHub 저장소', '최종 발표자료'],
    },
    analysis: spec.result,
    recruiterInsight: {
      role: role === 'OWNER' ? `팀 PM · ${scope}` : `팀원 · ${scope}`,
      challenge: spec.challenge,
      action: spec.action,
      outcome: spec.result,
      strength: spec.strength,
      summary: `${spec.domain} 도메인의 강사 인증 프로젝트입니다.`,
      evidenceCodes: [],
      generatedBy: 'FALLBACK' as const,
    },
    evidenceCodes: [],
    limitations: [],
    generatedBy: 'FALLBACK' as const,
  }
}

/** 로스터 학생 AI 분석 — 황수빈은 리치, 나머지는 실측 근거만으로 최소 구성. */
export function createRosterAiAnalysis(studentId: string): AiAnalysis {
  const entry = ROSTER_BY_ID.get(studentId)
  if (!entry || entry.id === HWANG_SUBIN_ID) {
    return PARK_SUJIN_AI_ANALYSIS
  }
  const base = PARK_SUJIN_AI_ANALYSIS
  const avg = r1((entry.q1 + entry.q2) / 2)
  const certified = certifiedProjectsOf(entry.name)
  const team = TEAM_OF[entry.name]
  const teamSize = Object.values(TEAM_OF).filter((t) => t === team).length
  const isOwner = team ? TEAM_OWNER[team] === entry.name : false
  const snapshots = certified.map((spec, i) =>
    teamProjectSnapshot(
      spec,
      i + 1,
      spec === BIKE_PROJECT || isOwner ? 'OWNER' : 'MEMBER',
      spec === BIKE_PROJECT ? '개인 프로젝트' : `팀 프로젝트 · ${teamSize}명`,
    ),
  )
  const domains = certified.map((p) => p.domain)
  const a = rosterAxisScores(entry)
  const fit = clamp(Math.round(avg * 0.9), 40, 95)
  const role = {
    rank: 1,
    role: '데이터 분석' as const,
    jobLabel: '데이터 분석가',
    roleLabel: '기초 역량 축적 단계',
    workType: '기초 다지기형',
    fitScore: fit,
    confidence: 'MEDIUM' as const,
    summary: `역량 점검 평균 ${avg}점(1차 ${entry.q1} · 2차 ${entry.q2})과 팀 인증 프로젝트 ${certified.length}건을 근거로 한 분석입니다.`,
    evidence: [
      `역량 점검 평균 ${avg}점`,
      `인증 프로젝트 ${certified.length}건 (${domains.join(', ')})`,
      '인증 문제해결 0건',
    ],
    fitEvidence: {
      projectRoles: [],
      troubleshooting: {
        certifiedCaseCount: 0,
        independentCaseCount: 0,
        independentRate: null,
        tags: [],
      },
      highAchievements: [
        { category: 'Python', score: entry.q1 },
        { category: 'SQL', score: entry.q2 },
      ],
    },
    theoryUnderstanding: {
      status: 'READY' as const,
      score: avg,
      level: (avg >= 85 ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM',
      label: avg >= 85 ? '높음' : avg >= 65 ? '보통' : '보완 필요',
      summary: `Python·SQL 역량 점검 2회 평균 ${avg}점 기준입니다.`,
      categories: [
        { key: 'PYTHON', category: 'Python·자료구조', score: entry.q1, weightPercent: 50 },
        { key: 'WEB_DATA', category: 'SQL·관계형 DB', score: entry.q2, weightPercent: 50 },
      ],
    },
    evidenceCodes: [],
    limitations: ['인증 문제해결 사례·동료 평가가 쌓이면 직무 후보가 정밀해집니다.'],
  }
  return {
    ...base,
    jobFit: {
      ...base.jobFit,
      summary: `${entry.name} — 역량 점검 실측만으로 산출한 초기 직무 분석입니다.`,
      primaryRole: role,
      roleCandidates: [role],
      sourceData: {
        interestedJobs: [],
        skillTags: ['Python', 'SQL'],
        projectDomains: domains,
        assessments: [
          { assessmentType: 'ACHIEVEMENT', category: 'Python', score: entry.q1 },
          { assessmentType: 'ACHIEVEMENT', category: 'SQL', score: entry.q2 },
        ],
        theoryCategories: role.theoryUnderstanding.categories,
        certifications: [],
      },
      confidence: 'MEDIUM',
      limitations: ['프로필·프로젝트 데이터가 쌓이면 정밀 분석으로 바뀝니다.'],
    },
    axisAlignment: {
      ...base.axisAlignment,
      summary: `${entry.name}의 축 점수와 실측 근거가 일치합니다.`,
      axes: base.axisAlignment.axes.map((axis) => {
        const score =
          axis.key === '성취도 평가'
            ? a.성취도
            : axis.key === '기술·기술기여'
              ? a.기술
              : axis.key === '소통·협업·팀워크'
                ? a.소통
                : axis.key === '문제해결'
                  ? a.문제해결
                  : axis.key === '책임감'
                    ? a.책임감
                    : a.학습지속성
        return {
          ...axis,
          axisScore: score,
          evidenceScore: score,
          summary: `${axis.key} ${score}점`,
          reason: [],
          evidence: [],
        }
      }),
    },
    projects: {
      ...base.projects,
      status: 'READY',
      summary: `도메인이 다른 팀 프로젝트 ${certified.length}건(${domains.join(', ')})을 강사 인증받았습니다.`,
      groups: [
        {
          key: 'EXPANSION',
          label: '분석 → 모델링 확장',
          summary:
            '1차 데이터 분석 프로젝트에서 2차 ML 모델링 프로젝트로 도메인과 기법을 넓혔습니다.',
          projectIds: certified.map((p) => p.id),
          projectNames: certified.map((p) => p.name),
          evidenceCodes: [],
          confidence: 'MEDIUM',
          limitations: [],
        },
      ],
      projects: snapshots,
      overview: {
        experienceScope: `${domains.join(' · ')} 도메인의 팀 프로젝트`,
        workingStyle: '분석에서 모델링으로 확장하는 협업형',
        overall: `팀 인증 프로젝트 ${certified.length}건으로 데이터 분석과 모델링을 모두 경험했습니다.`,
      },
      recruiterSummary: {
        headline: '도메인이 다른 팀 프로젝트를 완결한 협업형',
        summary: `인증 프로젝트 ${certified.length}건에서 팀 수행 범위와 결과가 확인됩니다.`,
        strengths: certified.map((p) => p.strength),
        evidenceCodes: [],
        generatedBy: 'FALLBACK',
      },
      aggregateAnalysis: {
        ...base.projects.aggregateAnalysis,
        summary: [
          `팀 프로젝트 ${certified.length}건에서 데이터 정제·EDA와 모델링·평가를 모두 수행했습니다.`,
        ],
        rolePatterns: [],
        commonTasks: [],
        selfReviewStatements: [],
        contribution: {
          totalBoardTaskCount: certified.length * 6,
          assignedTaskCount: certified.reduce((s, p) => s + p.tasks.length, 0),
          completedAssignedTaskCount: certified.reduce(
            (s, p) => s + p.tasks.length,
            0,
          ),
          summary: ['작업 보드의 담당 태스크를 모두 완료했습니다.'],
        },
        peerAxes: [],
        projectGrowth: [],
        strengths: certified.map((p) => p.strength),
        evaluationSource: 'PEER_ONLY',
      },
      projectCount: certified.length,
      evidenceCodes: [],
      confidence: 'MEDIUM',
      limitations: ['개별 기여 평가가 쌓이면 분석이 더 정밀해집니다.'],
    },
    troubleshooting: {
      ...base.troubleshooting,
      status: 'NOT_READY',
      summary: '인증된 문제해결 사례가 아직 없습니다.',
      certifiedCaseCount: 0,
      independentCaseCount: 0,
      independentRate: 0,
      sourceData: {
        categories: [],
        cases: [],
        averageDays: 0,
        medianDays: 0,
        independentCaseCount: 0,
        supportedCaseCount: 0,
      },
      axes: [],
      groups: [],
      limitations: ['인증된 사례가 쌓이면 분석합니다.'],
    },
    sentiment: {
      ...base.sentiment,
      status: 'NOT_READY',
      noteCount: 0,
      phases: [],
      bubbles: [],
      trend: '',
      confidence: 'LOW',
      limitations: ['상담·회고 기록이 아직 없습니다.'],
    },
    ontology: {
      ...base.ontology,
      status: 'NOT_READY',
      summary: '학습 이력이 쌓이면 역량 맵을 그립니다.',
      counts: { self: 0, subject: 0, skill: 0, method: 0, project: 0, domain: 0 },
      nodes: [],
      edges: [],
      limitations: [],
    },
  }
}
