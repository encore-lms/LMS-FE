// 이력서 관리 — 수강생 이력서 작성 현황 로스터(목업). BE 연동 전 화면 구현용.
export type ResumeStatus = '미작성' | '작성 중' | '작성 완료'

export interface RosterRow {
  id: string
  name: string
  cohort: string
  /** 이력서 수 */
  resumeCount: number
  /** 최고 완성도(%) — 미작성이면 null */
  completion: number | null
  status: ResumeStatus
  /** 최종 수정일 — 미작성이면 null */
  updatedAt: string | null
  /** 피드백 수 — 없으면 null */
  feedback: number | null
}

export const PROGRAM = 'SK네트웍스 Family AI 캠프'
export const COHORTS = [
  '29기',
  '21기',
  '22기',
  '23기',
  '24기',
  '25기',
  '26기',
  '27기',
  '28기',
  '31기',
]
export const ACTIVE_COHORT = '29기'

// 29기 로스터 — 23명(작성 완료 0 · 작성 중 11 · 미작성 12).
export const ROSTER: RosterRow[] = [
  {
    id: '김은진',
    name: '김은진',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
  {
    id: '김재홍',
    name: '김재홍',
    cohort: '29기',
    resumeCount: 1,
    completion: 9,
    status: '작성 중',
    updatedAt: '2026/05/06 20:00',
    feedback: null,
  },
  {
    id: '김정민',
    name: '김정민',
    cohort: '29기',
    resumeCount: 1,
    completion: 9,
    status: '작성 중',
    updatedAt: '2026/03/24 14:05',
    feedback: null,
  },
  {
    id: '김지훈',
    name: '김지훈',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
  {
    id: '김진욱',
    name: '김진욱',
    cohort: '29기',
    resumeCount: 1,
    completion: 18,
    status: '작성 중',
    updatedAt: '2026/03/24 14:11',
    feedback: null,
  },
  {
    id: '박상현',
    name: '박상현',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
  {
    id: '박준희',
    name: '박준희',
    cohort: '29기',
    resumeCount: 1,
    completion: 0,
    status: '작성 중',
    updatedAt: '2026/03/27 10:00',
    feedback: null,
  },
  {
    id: '성주연',
    name: '성주연',
    cohort: '29기',
    resumeCount: 1,
    completion: 0,
    status: '작성 중',
    updatedAt: '2026/03/24 16:11',
    feedback: null,
  },
  {
    id: '송민지',
    name: '송민지',
    cohort: '29기',
    resumeCount: 1,
    completion: 18,
    status: '작성 중',
    updatedAt: '2026/04/01 15:24',
    feedback: null,
  },
  {
    id: '양정현',
    name: '양정현',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
  {
    id: '우석현',
    name: '우석현',
    cohort: '29기',
    resumeCount: 1,
    completion: 73,
    status: '작성 중',
    updatedAt: '2026/05/17 19:50',
    feedback: 2,
  },
  {
    id: '윤대성',
    name: '윤대성',
    cohort: '29기',
    resumeCount: 1,
    completion: 9,
    status: '작성 중',
    updatedAt: '2026/03/24 14:44',
    feedback: null,
  },
  {
    id: '윤승혁',
    name: '윤승혁',
    cohort: '29기',
    resumeCount: 1,
    completion: 18,
    status: '작성 중',
    updatedAt: '2026/04/15 11:44',
    feedback: null,
  },
  {
    id: '이동윤',
    name: '이동윤',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
  {
    id: '이지현',
    name: '이지현',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
  {
    id: '임준',
    name: '임준',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
  {
    id: '임준억',
    name: '임준억',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
  {
    id: '정승',
    name: '정승',
    cohort: '29기',
    resumeCount: 1,
    completion: 0,
    status: '작성 중',
    updatedAt: '2026/04/03 12:42',
    feedback: null,
  },
  {
    id: '정영석',
    name: '정영석',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
  {
    id: '최원빈',
    name: '최원빈',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
  {
    id: '최지용',
    name: '최지용',
    cohort: '29기',
    resumeCount: 1,
    completion: 9,
    status: '작성 중',
    updatedAt: '2026/03/24 16:00',
    feedback: null,
  },
  {
    id: '한경찬',
    name: '한경찬',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
  {
    id: '한예나',
    name: '한예나',
    cohort: '29기',
    resumeCount: 0,
    completion: null,
    status: '미작성',
    updatedAt: null,
    feedback: null,
  },
]

// 피드백 항목 — 운영자/멘토가 학생 이력서에 남긴 피드백(피드백 관리 탭).
export interface FeedbackItem {
  id: string
  studentName: string
  /** 대상 이력서 이름 */
  resumeName: string
  /** 피드백 섹션(자기소개서·핵심역량 등) */
  category: string
  date: string
  body: string
  /** 작성자(운영자/멘토) */
  author: string
  read: boolean
}

export const FEEDBACK: FeedbackItem[] = [
  {
    id: 'fb-1',
    studentName: '우석현',
    resumeName: '이력서 기본_1',
    category: '자기소개서',
    date: '2026/03/31 10:48',
    body: "핵심역량/강점 부분과 동일하게 '연구자' → 엔지니어/데이터 사이언티스트 등 희망 직무로 수정하면 좋을 것 같아요. 인턴 경험, 데이터 다뤄본 경험, 다중공선성 사례, 구체적인 수치 작성 등 객관적인 사례를 자세하게 적어주셔서 이 부분은 잘 작성하신 것 같습니다. 다만 지금 작성하신 내용으로는 포지션이 조금 제한될 것처럼 느껴져서 앞으로 과정 내에서 진행하는 프로젝트 또는 사이드 프로젝트 등을 통해 연구 → 서비스로 자연스럽게 확장하는 경험으로 이어지면 좋을 것 같습니다! 추천 예시 등) 저는 데이터 수집부터 전처리, 모델링, 검증까지 전 과정을 설계하며 현실적인 데이터 문제를 해결해온 경험이 있습니다. 현재는 이러한 경험을 바탕으로, 모델을 실제 서비스 환경에서 활용 가능한 형태로 구현하는 역량을 강화하고 있습니다. 입사 후에는 데이터 품질 문제를 해결하는 것을 넘어, 서비스 환경에서도 안정적으로 동작하는 AI 시스템을 구축하는 데 기여하고 싶습니다. 이력서/자기소개서 쓰느라 너무 고생 많으셨고, 4월에는 나머지 자기소개서 문항도 작성해보시면 좋을 것 같습니다! - 협업 경험, 리더십 역량 등 프로젝트 경험이 더 어필되도록 그 이후에 실제 지원하고 싶은 공고가 있다면 맞춰서 서류 작성하시고 피드백 반복해서 드리면 될 것 같아요!",
    author: '여송희',
    read: true,
  },
  {
    id: 'fb-2',
    studentName: '우석현',
    resumeName: '이력서 기본_1',
    category: '핵심역량/강점',
    date: '2026/03/31 10:42',
    body: "석현님이 적어주신 내용은 전반적으로 데이터 쪽의 강점이 확실히 보이는 것 같습니다. 다만 지금까지는 연구 중심 경험이라, 서비스화 경험을 추가하면 더욱 보완이 될 것 같아요. (Ex. 모델 결과를 API 형태로 제공하고 서비스에 연동하는 구조에 대한 이해 및 구현 경험 확장 중) 지금 첫 문장부터 '연구' 및 '연구원'이 들어가서 실무보다는 연구쪽이 강조되고 있는 것 같아, 연구원 대신 '데이터 사이언티스트' 혹은 'AI 엔지니어' 등 희망 직무로 수정하면 좋을 것 같습니다.",
    author: '여송희',
    read: true,
  },
]

// 이력서 상세(검토) — 로스터에서 이력서 클릭 시 표시. (BE 연동 전 단일 샘플)
export interface ResumeEntry {
  title: string
  meta: string
}
export interface ResumeProject extends ResumeEntry {
  bullets: string
}
export interface ResumeIntro {
  title: string
  body: string
}
export interface ResumeDetail {
  studentName: string
  cohort: string
  resumeName: string
  completion: number
  status: ResumeStatus
  phone: string
  email: string
  birth: string
  coreStrength: string
  careers: ResumeEntry[]
  educations: ResumeEntry[]
  certificates: ResumeEntry[]
  awards: ResumeEntry[]
  projects: ResumeProject[]
  intros: ResumeIntro[]
  sectionStatus: { name: string; done: boolean }[]
}

export const RESUME_DETAIL: ResumeDetail = {
  studentName: '우석현',
  cohort: '29기',
  resumeName: '이력서 기본_1',
  completion: 73,
  status: '작성 중',
  phone: '010-5772-0450',
  email: 'hyun97secret@gmail.com',
  birth: '1997-09-07',
  coreStrength:
    '안녕하세요. 현실 세계의 데이터 전처리를 통한 예측 모델 성능 향상을 연구한 연구원 우석현입니다.\n석사 과정 중 웨어러블/앱 라이프로그 데이터를 직접 수집 및 엔지니어링하여, 단순 대치 대비 재현율을 53.7% 향상시킨 경험이 있습니다.\nPyTorch, Scikit-learn을 능숙하게 다루며, 데이터 전처리 파이프라인 구축부터 모델 최적화까지 전 과정을 주도적으로 수행할 수 있습니다.\n앞으로도 꾸준히 성장하여, Dirty Data에 상관없이 수집하는 모든 데이터로부터 의미있는 결과를 도출할 수 있는 데이터 사이언티스트가 되고자 합니다.\n1. 데이터 품질 엔지니어링 및 파이프라인 설계 역량\n- 결측률 90% 이상의 고난도 데이터 복원 경험 (BRITS, MICE)\n- 데이터 요약 정보 및 생성형 모델 기반 소수 클래스 증강 및 불균형 해소 경험 (TVAE, GCS, Datadescriber)\n- 정적/동적 특성 분리 이중 구조 모델 설계\n- 데이터 수집부터 구조화, 전처리 후 모델링까지 End-to-End 파이프라인 설계 경험\n2. 프로젝트 매니지먼트 및 커뮤니케이션 역량\n- 정부과제 중 기업-교수-학생 간 중간 관리자 역할 수행\n- 188명 규모의 데이터 수집 실험 주도 및 관리\n- 석사과정 기술적 결과의 시각화 및 발표 경험',
  careers: [
    { title: '밸류링크유', meta: '2023.01 ~ 2023.04 | 인턴' },
    { title: '연세대학교 일반대학원', meta: '2025.09 ~ 2025.11 | 연구' },
  ],
  educations: [
    {
      title: '연세대학교(원주)',
      meta: '2017.03 ~ 2023.08 | 졸업 | 패키징및물류학전공, 스마트패키징물류(연계)',
    },
    {
      title: '연세대학교 일반대학원',
      meta: '2023.08 ~ 2025.08 | 졸업 | 전산학',
    },
  ],
  certificates: [
    { title: 'TOEIC 820점', meta: '2024.09' },
    { title: '빅데이터분석기사', meta: '2025.12' },
    { title: 'SQLD', meta: '2026.03' },
    { title: '정보처리기사(필기)', meta: '2026.01' },
  ],
  awards: [
    { title: '우수조교(TA1)', meta: '' },
    { title: '지휘검열 우수상', meta: '2020.05.' },
  ],
  projects: [
    {
      title:
        '대학생 라이프로그 실데이터의 결측·편향 해결 및 우울증 예측 성능 최적화',
      meta: '2024.03 ~ 2025.02 | Python | 3',
      bullets:
        '- 웨어러블/앱 및 측정 기기를 통해 수집된 실데이터의 결측과 클래스 불균형 문제 해결.\n- 재현 데이터 생성 기술을 통해 우울증 탐지 재현율(Recall)을 53.7% 향상시키며 모델의 실효성 입증.\n담당: - 전주기 데이터 파이프라인 구축: 188명 대상, 8주간 41종의 라이프로그 데이터 수집부터 정제까지 End-to-End 프로세스 총괄.\n- 이원화된 결측 복원: 데이터 결측률에 따라 시계열 복원(BRITS)과 통계적 보간(MICE)을 선별 적용하는 전처리 로직 설계.\n- 데이터 증강: TVAE, GCS, Datadescriber 모델을 활용해 소수 클래스인 우울군 데이터를 증강하여 학습 불균형 해소 및 성능 비교.\n- 이중 구조 모델링: 정적 특성(기질)과 동적 특성(생활패턴)을 분리하여 학습하는 이중 구조 모델 개발.',
    },
    {
      title:
        '중고령층 이종 라이프로그 데이터 결합을 통한 우울증 예측 모델 개발',
      meta: '2023.08 ~ 2024.05 | python | 3',
      bullets:
        "- 수집 주기가 서로 다른 설문(정형)과 센서(시계열) 데이터를 통합 분석하는 멀티모달 모델 개발.\n- 데이터 구조화를 통해 단일 모델 대비 정확도를 2.5%p 높여 90.2% 달성.\n담당: - 이종 데이터 구조화: 연/주/일 단위로 제각각인 데이터 수집 주기를 통합 분석하기 위해 'Unit' 단위의 분석 프레임워크 설계.\n- 데이터 무결성 확보: 다중대체법(MICE)을 적용해 데이터 분포를 유지하며 결측치를 보정, 학습 데이터셋 품질 고도화.\n- 이중 구조 모델 설계: 정형 데이터와 시계열 데이터를 각각 처리한 뒤 결합하는 이중 구조 모델을 구현하여 예측 성능 최적화.",
    },
  ],
  intros: [
    {
      title: '지원동기 · 불완전한 데이터에서 신뢰할 수 있는 답을 만드는 연구자',
      body: '물류 포워딩 기업 밸류링크유에서 인턴으로 근무하며, GHG 배출 산정 로직 구조화부터 위성 이미지 데이터 라벨링까지 다양한 데이터 작업을 했습니다.\n그 과정에서 정의되지 않은 변수와 누락된 기준값을 직접 정제해야 했고, 교과서나 모의 환경 같은 깔끔하게 정리된 데이터란 없다는 것을 깨달았습니다.\n석사 연구에서 188명의 데이터를 8주간 수집하고, 41종의 다중 모달리티 데이터를 정제해 87,324건의 통합 DB를 구축했습니다.\n연구 중 초기 모델이 재현율 99%를 기록했을 때, 저는 이 숫자를 그대로 받아들이지 않았습니다. 검증 데이터에서 성능이 급락했고, 원인을 추적하자 변수 간 다중공선성이 나왔습니다. 높은 숫자 대신 신뢰할 수 있는 숫자를 선택한 그 판단이, 지금 제가 데이터를 다루는 방식의 기준이 됐습니다.',
    },
    {
      title:
        '직무와 관련된 성격의 장단점 · 데이터의 무결성을 끝까지 지켜내는 집요함',
      body: '저의 가장 큰 장점은 이상 징후를 발견했을 때 원인이 해결될 때까지 파고드는 집요함입니다.\n군 복무 중 연 1회 장비지휘검열을 준비하면서, 재고 대장과 실물 수량이 맞지 않는 항목들을 발견했습니다. 물자 이동 이력을 역추적하며 불일치 원인을 하나씩 확인하는 쪽을 택했고, 그 결과 부대 전체 재고 데이터가 실물과 완전히 일치하는 상태로 정리됐고 중대장 표창을 수상했습니다.\n석사 연구에서도 이 집요함이 직접적인 성과로 이어졌습니다. 결국 특정 OS 버전의 블루투스 세션 끊김이 원인이었고, 이를 반영해 전처리 프로토콜을 수정해 데이터 완결성을 확보할 수 있었습니다.\n반면, 분석 초기 단계에서 모든 변수를 고려하려다 일정이 뒤로 밀리는 경향이 있습니다. KCC 2025에서는 베이스라인을 먼저 구축하고 병목 구간만 집중 개선하는 순서를 적용해 제한된 기간 안에 핵심 기법의 효과를 명확히 입증하는 발표를 완성했습니다.',
    },
  ],
  sectionStatus: [
    { name: '기본정보', done: true },
    { name: '핵심역량/강점', done: true },
    { name: '학력사항', done: true },
    { name: '경력사항', done: true },
    { name: '자격사항', done: true },
    { name: '수상내역', done: true },
    { name: '교육경험', done: false },
    { name: '기타활동', done: false },
    { name: '기술스택', done: false },
    { name: '프로젝트 경험', done: true },
    { name: '자기소개서', done: true },
  ],
}
