import { http, HttpResponse, type RequestHandler } from 'msw'
import type {
  Role,
  QuizQuestion,
  QuizResult,
  QuizAnswer,
  QuizAttempt,
  AdminDashboardSummary,
  CertReviewQueue,
  CertReviewDetail,
} from '@/shared/types'
// 기능별 mock 자동 수집 — features/**/mocks.ts 가 `export const handlers`를 내보내면 자동 등록된다.
// 새 화면이 늘어도 이 파일을 수정하지 않으므로 머지 충돌이 나지 않는다.
const featureMockModules = import.meta.glob<{ handlers?: RequestHandler[] }>(
  '../features/**/mocks.ts',
  { eager: true },
)
const featureHandlers = Object.values(featureMockModules).flatMap(
  (m) => m.handlers ?? [],
)

// {data} 래핑 헬퍼 — mock 응답은 ApiResponse<T>(= {data:T}) 형태를 지킨다.
const ok = <T>(data: T) => HttpResponse.json({ data })

// 개발용 mock 로그인. 이메일 prefix로 역할을 흉내내 각 shell을 바로 테스트할 수 있다.
//   admin@…→운영(MANAGER) / instructor@…→강사 / mentor@…→멘토 / 그 외→수강생
function roleFromEmail(email: string): Role {
  if (email.startsWith('admin')) return 'MANAGER'
  if (email.startsWith('instructor')) return 'INSTRUCTOR'
  if (email.startsWith('mentor')) return 'MENTOR'
  return 'STUDENT'
}

// 개발용 교육 타입 흉내 — 로그인 ID에 'kdc'가 들어가면 K-디지털 기초역량훈련(온라인형),
// 그 외 수강생은 K-디지털 트레이닝(부트캠프형). 두 진입 화면을 모두 바로 테스트할 수 있다.
function trainingTypeFromEmail(email: string): 'KDT' | 'KDC' {
  return email.toLowerCase().includes('kdc') ? 'KDC' : 'KDT'
}

// 수강생 퀴즈 — 목록은 features/student/quiz/mocks.ts(기능 로컬)로 이동. 응시/결과만 여기 유지.
const quizHandlers = [
  http.get('/api/student/quizzes/:quizId/questions', ({ params }) => {
    const quizId = String(params.quizId)
    // 자료구조 중간 퀴즈 — 20문항(객관식 4지선다). 12번 = 시안(242:27) 이진 탐색 문제.
    const DATA: [
      string,
      [string, string, string, string],
      QuizQuestion['difficulty'],
    ][] = [
      [
        '배열(Array)에 대한 설명으로 옳은 것은?',
        [
          '인덱스로 임의 원소에 O(1) 접근',
          '중간 삽입·삭제가 항상 O(1)',
          '메모리가 비연속적으로 할당된다',
          '크기가 자동으로 늘어난다',
        ],
        'easy',
      ],
      [
        '단일 연결 리스트(Singly Linked List)의 특징으로 옳은 것은?',
        [
          '임의 인덱스 접근이 O(1)',
          '노드마다 다음 노드의 참조를 가진다',
          '뒤에서 앞으로 순회가 가능하다',
          '연속된 메모리 블록이 필요하다',
        ],
        'easy',
      ],
      [
        '스택(Stack)의 자료 처리 방식으로 옳은 것은?',
        [
          'FIFO(선입선출)',
          'LIFO(후입선출)',
          '우선순위가 높은 것부터',
          '임의 순서로 접근',
        ],
        'easy',
      ],
      [
        '큐(Queue)의 자료 처리 방식으로 옳은 것은?',
        [
          'LIFO(후입선출)',
          'FIFO(선입선출)',
          '양쪽 끝에서 삽입·삭제',
          '키 순서대로 정렬',
        ],
        'easy',
      ],
      [
        '원형 큐(Circular Queue)를 사용하는 주된 이유는?',
        [
          '정렬을 자동으로 유지하기 위해',
          '선형 큐의 빈 공간 낭비를 줄이기 위해',
          '임의 접근을 빠르게 하기 위해',
          '중복 원소를 제거하기 위해',
        ],
        'normal',
      ],
      [
        '높이가 h인 이진 트리가 가질 수 있는 최대 노드 수는?',
        ['h', '2h', '2^h − 1', 'h^2'],
        'normal',
      ],
      [
        '이진 탐색 트리(BST)를 중위 순회(in-order)한 결과는?',
        ['오름차순 정렬', '내림차순 정렬', '레벨 순서', '무작위 순서'],
        'normal',
      ],
      [
        '완전 이진 트리를 1-based 배열로 표현할 때, 노드 i의 왼쪽 자식 인덱스는?',
        ['i + 1', '2i', '2i + 1', 'i / 2'],
        'normal',
      ],
      [
        '최소 힙(Min-Heap)의 루트 노드에 대한 설명으로 옳은 것은?',
        ['항상 최댓값', '항상 최솟값', '항상 중앙값', '삽입 순서상 첫 원소'],
        'normal',
      ],
      [
        '해시 테이블의 평균적인 탐색 시간 복잡도는?',
        ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        'normal',
      ],
      [
        '다음 중 해시 충돌(collision) 해결 방법이 아닌 것은?',
        [
          '체이닝(Chaining)',
          '개방 주소법(Open Addressing)',
          '이중 해싱(Double Hashing)',
          '버블 정렬(Bubble Sort)',
        ],
        'normal',
      ],
      [
        '다음 중 시간 복잡도가 O(log n)에 해당하는 알고리즘으로 가장 적절한 것을 고르시오. 정렬된 배열에서 특정 값의 위치를 찾을 때 일반적으로 사용되는 분할 정복 기반의 탐색 알고리즘은 무엇인지 선택지에서 고르십시오.',
        [
          '선형 탐색 (Linear Search)',
          '이진 탐색 (Binary Search)',
          '깊이 우선 탐색 (DFS)',
          '너비 우선 탐색 (BFS)',
        ],
        'normal',
      ],
      [
        '정점이 V개인 그래프를 인접 행렬로 표현할 때 공간 복잡도는?',
        ['O(V)', 'O(E)', 'O(V^2)', 'O(V + E)'],
        'normal',
      ],
      [
        '깊이 우선 탐색(DFS)을 반복문으로 구현할 때 주로 사용하는 자료구조는?',
        ['큐(Queue)', '스택(Stack)', '우선순위 큐', '해시 테이블'],
        'normal',
      ],
      [
        '너비 우선 탐색(BFS)을 구현할 때 주로 사용하는 자료구조는?',
        ['스택(Stack)', '큐(Queue)', '힙(Heap)', '연결 리스트'],
        'normal',
      ],
      [
        '다익스트라(Dijkstra) 알고리즘에서 우선순위 큐를 사용하는 이유는?',
        [
          '음수 가중치를 처리하기 위해',
          '최단 거리 후보를 빠르게 선택하기 위해',
          '사이클을 탐지하기 위해',
          '정점을 정렬하기 위해',
        ],
        'hard',
      ],
      [
        '다음 정렬 알고리즘 중 안정 정렬(stable sort)이 아닌 것은?',
        ['병합 정렬', '삽입 정렬', '버블 정렬', '퀵 정렬'],
        'hard',
      ],
      [
        '병합 정렬(Merge Sort)의 평균 시간 복잡도는?',
        ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
        'normal',
      ],
      [
        '퀵 정렬(Quick Sort)의 최악 시간 복잡도는?',
        ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
        'hard',
      ],
      [
        '동적 계획법(DP)의 핵심 아이디어로 가장 적절한 것은?',
        [
          '모든 경우를 완전 탐색',
          '부분 문제의 해를 저장해 재사용',
          '항상 분할 정복으로 해결',
          '그리디하게 국소 최적 선택',
        ],
        'normal',
      ],
    ]
    const letters = ['a', 'b', 'c', 'd']
    const questions: QuizQuestion[] = DATA.map(
      ([prompt, choices, difficulty], i) => ({
        id: `qq${i + 1}`,
        quizId,
        categoryId: '자료구조',
        type: 'multiple_choice',
        gradingType: 'AUTO',
        prompt,
        maxPoints: 5,
        orderNo: i + 1,
        difficulty,
        choices: choices.map((label, j) => ({ id: letters[j], label })),
      }),
    )
    return ok<QuizQuestion[]>(questions)
  }),

  http.post('/api/student/quizzes/:quizId/attempts', ({ params }) =>
    ok<QuizAttempt>({
      id: 'att1',
      quizId: String(params.quizId),
      attemptNo: 1,
      status: 'in_progress',
      startedAt: '2026-06-03T00:00:00Z',
      expiresAt: '2026-06-03T00:30:00Z',
    }),
  ),

  http.get('/api/student/quizzes/:quizId/result', ({ params }) => {
    const quizId = String(params.quizId)
    // 자료구조 중간 퀴즈 결과 — 20문항(4카테고리). 1·4번 = 시안(243:27), 5번 = 채점 대기(서술).
    const mc = (
      questionId: string,
      categoryId: string,
      prompt: string,
      my: string,
      correct: string,
      earnedPoints: number,
      isCorrect: boolean,
      extra: Partial<QuizAnswer> = {},
    ): QuizAnswer => ({
      questionId,
      prompt,
      categoryId,
      maxPoints: 5,
      answer: { kind: 'multiple_choice', selectedChoiceId: my },
      correctAnswerKey: correct,
      earnedPoints,
      isCorrect,
      ...extra,
    })
    const sa = (
      questionId: string,
      categoryId: string,
      prompt: string,
      my: string,
      correct: string | undefined,
      maxPoints: number,
      earnedPoints: number,
      isCorrect: boolean,
      extra: Partial<QuizAnswer> = {},
    ): QuizAnswer => ({
      questionId,
      prompt,
      categoryId,
      maxPoints,
      answer: { kind: 'short_answer', text: my },
      correctAnswerKey: correct,
      earnedPoints,
      isCorrect,
      ...extra,
    })
    const OOP = '객체지향 설계'
    const JPA = 'JPA 영속성 컨텍스트'
    const TX = '트랜잭션/격리 수준'
    const QD = 'Querydsl & 동적 쿼리'
    const answers: QuizAnswer[] = [
      mc(
        'qq1',
        JPA,
        '다음 중 JPA의 1차 캐시(영속성 컨텍스트)에 대한 설명으로 옳은 것은?',
        '같은 EntityManager 내에서 동일 식별자 조회 시 캐시된 엔티티를 반환한다',
        '같은 EntityManager 내에서 동일 식별자 조회 시 캐시된 엔티티를 반환한다',
        5,
        true,
      ),
      mc(
        'qq2',
        TX,
        '@Transactional의 기본 격리 수준(isolation level)으로 옳은 것은?',
        'READ_UNCOMMITTED',
        'DEFAULT (DB의 격리 수준을 따름)',
        0,
        false,
      ),
      sa(
        'qq3',
        JPA,
        '엔티티 매니저가 영속성 컨텍스트를 비우고 동기화하는 메서드 이름을 쓰시오.',
        'flush()',
        'flush()',
        5,
        5,
        true,
      ),
      sa(
        'qq4',
        QD,
        '지연 로딩(LAZY) 환경에서 N+1 문제를 해결하는 대표 전략 2가지를 쓰시오.',
        'fetch join, EntityGraph',
        'fetch join / @EntityGraph / batch_size (3가지 중 2가지 인정)',
        5,
        4,
        true,
        {
          feedback:
            '두 전략 모두 적절합니다. batch_size 옵션도 함께 익히면 좋습니다.',
        },
      ),
      sa(
        'qq5',
        TX,
        '낙관적 락(Optimistic Lock)과 비관적 락(Pessimistic Lock)의 차이를 200자 이내로 서술하시오.',
        '제출됨 (192자) — 채점 대기 중',
        undefined,
        10,
        0,
        false,
        { pending: true },
      ),
      mc(
        'qq6',
        OOP,
        'SOLID 원칙 중 "확장에는 열려 있고 변경에는 닫혀 있어야 한다"는 무엇인가?',
        'OCP (개방-폐쇄 원칙)',
        'OCP (개방-폐쇄 원칙)',
        5,
        true,
      ),
      mc(
        'qq7',
        OOP,
        '상속보다 합성(composition)을 권장하는 주된 이유는?',
        '결합도를 낮추고 유연한 확장이 가능',
        '결합도를 낮추고 유연한 확장이 가능',
        5,
        true,
      ),
      mc(
        'qq8',
        OOP,
        '다형성(polymorphism)을 활용한 설계의 이점으로 옳은 것은?',
        '구현 교체 시 클라이언트 코드 변경 최소화',
        '구현 교체 시 클라이언트 코드 변경 최소화',
        5,
        true,
      ),
      mc(
        'qq9',
        OOP,
        '의존성 역전 원칙(DIP)에서 의존해야 하는 대상은?',
        '추상(인터페이스)',
        '추상(인터페이스)',
        5,
        true,
      ),
      mc(
        'qq10',
        OOP,
        '디미터 법칙(Law of Demeter)이 줄이려는 것은?',
        '객체 간 과도한 결합',
        '객체 간 과도한 결합',
        3,
        true,
      ),
      mc(
        'qq11',
        JPA,
        '준영속(detached) 상태의 엔티티를 다시 영속화하는 메서드는?',
        'merge()',
        'merge()',
        5,
        true,
      ),
      mc(
        'qq12',
        JPA,
        '쓰기 지연(write-behind)이 가능한 근본 이유는?',
        '영속성 컨텍스트가 SQL을 모았다가 flush 시점에 전송',
        '영속성 컨텍스트가 SQL을 모았다가 flush 시점에 전송',
        3,
        true,
      ),
      mc(
        'qq13',
        JPA,
        'cascade = REMOVE 사용 시 주의점으로 옳은 것은?',
        '고아 객체는 자동으로 유지된다',
        '연관 엔티티가 함께 삭제되어 데이터 유실 위험이 있다',
        0,
        false,
      ),
      mc(
        'qq14',
        TX,
        'REPEATABLE READ에서 기본적으로 방지되지 않는 현상은?',
        '팬텀 리드(Phantom Read)',
        '팬텀 리드(Phantom Read)',
        5,
        true,
      ),
      mc(
        'qq15',
        TX,
        '트랜잭션 전파 옵션 REQUIRES_NEW의 동작으로 옳은 것은?',
        '항상 새 트랜잭션을 시작한다',
        '항상 새 트랜잭션을 시작한다',
        5,
        true,
      ),
      mc(
        'qq16',
        TX,
        '@Transactional(readOnly = true)의 효과로 옳은 것은?',
        '플러시 모드 최적화로 더티 체킹을 생략',
        '플러시 모드 최적화로 더티 체킹을 생략',
        5,
        true,
      ),
      mc(
        'qq17',
        QD,
        'Querydsl에서 동적 조건 조합에 주로 쓰는 것은?',
        'BooleanBuilder / BooleanExpression',
        'BooleanBuilder / BooleanExpression',
        5,
        true,
      ),
      mc(
        'qq18',
        QD,
        'Querydsl의 컴파일 타임 타입 안정성의 근거는?',
        'Q타입(메타모델) 생성',
        'Q타입(메타모델) 생성',
        5,
        true,
      ),
      mc(
        'qq19',
        QD,
        'fetchJoin()을 사용하는 주된 목적은?',
        'N+1을 줄이고 연관을 한 번에 조회',
        'N+1을 줄이고 연관을 한 번에 조회',
        5,
        true,
      ),
      mc(
        'qq20',
        QD,
        'Querydsl 페이징에서 카운트 쿼리를 분리하는 이유는?',
        '정렬을 보장하기 위해',
        '불필요한 조인을 제거해 카운트 성능을 높이기 위해',
        0,
        false,
      ),
    ]
    return ok<QuizResult>({
      submission: {
        id: 's1',
        quizId,
        attemptNo: 1,
        submittedAt: '2026-05-13T14:32:00Z',
        gradingStatus: 'pending_manual',
        totalScore: 82,
      },
      answers,
    })
  }),
]

// 인증 검토 큐(/admin/certificates/reviews) — Flow 11 C1.
const certReviewQueue: CertReviewQueue = {
  total: 167,
  byStatus: {
    requested: 24,
    reviewing: 8,
    changes_requested: 3,
    certified: 132,
  },
  unassigned: 6,
  riskFlagged: 5,
  myAssigned: 8,
  avgHours: 4.2,
  items: [
    {
      id: 'rv1',
      student: {
        name: '김민준',
        studentNo: '2024-AIB3-0027',
        cohort: 'AI 캠프 22기',
      },
      status: 'changes_requested',
      requestedAt: '05-17 14:32',
      assignee: '황설현',
      missingCount: 0,
      riskFlags: ['개인정보 위험', '점수 재검토'],
      latestReason: '이력서 연락처 마스킹 누락',
    },
    {
      id: 'rv2',
      student: {
        name: '이서연',
        studentNo: '2024-AIB3-0028',
        cohort: 'AI 캠프 22기',
      },
      status: 'reviewing',
      requestedAt: '05-16 09:11',
      assignee: '황설현',
      missingCount: 2,
      riskFlags: ['결측'],
      latestReason: '평판 항목 2개 미수집',
    },
    {
      id: 'rv3',
      student: {
        name: '박지훈',
        studentNo: '2024-AIB3-0029',
        cohort: 'DA 5기',
      },
      status: 'changes_requested',
      requestedAt: '05-15 17:45',
      assignee: '황설현',
      missingCount: 0,
      riskFlags: ['점수 재검토', '미승인 산출물'],
      latestReason: '프로젝트 산출물 강사 미승인 1건',
    },
    {
      id: 'rv4',
      student: {
        name: '최유진',
        studentNo: '2024-AIB3-0030',
        cohort: 'AI 캠프 22기',
      },
      status: 'requested',
      requestedAt: '05-19 08:42',
      assignee: null,
      missingCount: 0,
      riskFlags: [],
      latestReason: '없음',
    },
    {
      id: 'rv5',
      student: { name: '정하늘', studentNo: '2024-DA5-0014', cohort: 'DA 5기' },
      status: 'requested',
      requestedAt: '05-19 09:12',
      assignee: null,
      missingCount: 1,
      riskFlags: ['결측'],
      latestReason: '자격증 인증서 미첨부',
    },
    {
      id: 'rv6',
      student: {
        name: '한지호',
        studentNo: '2024-AIB3-0032',
        cohort: 'AI 캠프 22기',
      },
      status: 'reviewing',
      requestedAt: '05-18 16:30',
      assignee: '이매니저',
      missingCount: 0,
      riskFlags: [],
      latestReason: '없음',
    },
  ],
}

// 인증 검토 상세(/admin/certificates/reviews/:reviewId) — Flow 11 C2.
const certReviewDetail: CertReviewDetail = {
  id: 'rev_8b2a',
  student: { name: '이서연', certId: 'def-5678', cohort: 'DA 5기' },
  status: 'reviewing',
  assignee: '황설현',
  requestedAt: '2026-05-16 09:11',
  martStale: true,
  martLastRefreshed: '2026-05-15 23:00',
  metrics: {
    trainingHours: 480,
    attendance: 0.962,
    quizAvg: 84.7,
    submissionRate: 0.91,
    submissionRaw: '32/35건',
  },
  skills: [
    { key: '기술', score: 82, confirmed: true },
    { key: '책임감', score: 76, confirmed: true },
    { key: '소통', score: 88, confirmed: true },
    { key: '성장', score: 79, confirmed: true },
    { key: '팀워크', score: 84, confirmed: true },
    { key: '문제해결', score: 81, confirmed: true },
  ],
  skillAvg: 81.7,
  payloadPreview:
    '{"student":"이서연","course":"DA 5기","trainingHours":480,"attendance":0.962,"averageQuiz":84.7,"submission":0.91,"skills":[{"k":"기술","v":82,"status":"confirmed"}, …]}',
  approvalChecks: [
    {
      key: 'profile',
      label: '프로필',
      detail: '이름·과정·필수 URL 오류 없음',
      pass: true,
    },
    {
      key: 'metric',
      label: '핵심 지표',
      detail: '교육시간·출석률·시험평균 산정 가능',
      pass: true,
    },
    {
      key: 'skill',
      label: '6축 점수',
      detail: 'SkillScore.status = confirmed (6/6)',
      pass: true,
    },
    {
      key: 'evidence',
      label: '대표 근거',
      detail: '프로젝트 1 · 트러블슈팅 1 · 기록실 12',
      pass: true,
    },
    {
      key: 'mart',
      label: '원천 데이터 최신성',
      detail: '인증 요청 이후 미갱신 · 재계산 필요',
      pass: false,
    },
    {
      key: 'privacy',
      label: '개인정보',
      detail: '공개 payload에 민감정보 없음',
      pass: true,
    },
  ],
  riskFlags: [
    { label: '결측', detail: '평판 항목 2개 미수집', count: 2 },
    { label: '개인정보 위험', detail: '공개 payload 안전', count: 0 },
    { label: '점수 재검토', detail: 'SkillScore 재검토 요청 없음', count: 0 },
  ],
  scoreEvidence: [
    { skill: '기술 82점', basis: '프로젝트 v0.3 산출물 + 강사 코멘트 3건' },
    { skill: '책임감 76점', basis: '동료 평판 5건 평균 + 회의록 기여 12건' },
    {
      skill: '소통 88점',
      basis: 'PR 리뷰 코멘트 28건 + 멘토 평가 · 원천 데이터 변경',
    },
    { skill: '성장 79점', basis: '이전 기수 대비 +12점 · 트러블슈팅 14건' },
  ],
  artifactApprovals: [
    {
      title: '프로젝트 v0.3 (LLM 추천)',
      by: '강사 김지훈',
      status: 'approved',
    },
    {
      title: '트러블슈팅 #042 (Airflow)',
      by: '강사 박지영',
      status: 'approved',
    },
    { title: '블로그 12편 일괄', by: '매니저 황설현', status: 'approved' },
    { title: '외부 자격증 OPIc IH', by: '외부 검증', status: 'unverified' },
  ],
  auditLog: [
    { at: '05-19 10:24', actor: '황설현', action: '검토 시작' },
    {
      at: '05-18 16:08',
      actor: '시스템',
      action: '마트 갱신 실패 — 출결 원본 누락',
    },
    {
      at: '05-17 11:42',
      actor: '황설현',
      action: '이전 인증 요청 보완 — 평판 항목 보강',
    },
    {
      at: '05-16 09:11',
      actor: '이서연',
      action: '인증 요청 (certification_requested)',
    },
  ],
}

// 운영(admin) — 대시보드 요약(v2)·인증 검토 큐·상세. 나머지 운영 화면은 후속 PR에서 소비.
const adminHandlers = [
  http.get('/api/admin/dashboard', () =>
    ok<AdminDashboardSummary>({
      hero: {
        status: { level: 'normal', label: '운영 정상' },
        riskCount: 3,
        martUpdatedAt: '09:20',
        martNextAt: '09:50',
        todayPending: { value: 45, deltaLabel: '어제 대비 +6' },
        todayDone: { value: 12, avgLabel: '평균 처리 8분' },
      },
      kpis: [
        {
          key: 'request',
          label: '인증 요청',
          value: '18',
          delta: '+3',
          hint: '보완 요청 4건 포함',
          icon: 'request',
        },
        {
          key: 'reviewing',
          label: '검토 중',
          value: '12',
          delta: '—',
          hint: '강사 미확인 2건',
          icon: 'reviewing',
        },
        {
          key: 'changes',
          label: '보완 요청',
          value: '7',
          delta: '+1',
          hint: 'HRD 불일치 3건',
          icon: 'changes',
        },
        {
          key: 'certified',
          label: '인증 완료',
          value: '1,243',
          delta: '−4',
          hint: '누적 마지막 60일',
          icon: 'certified',
        },
        {
          key: 'mart',
          label: '마트 오류',
          value: '2',
          delta: '+2',
          hint: '재계산 필요',
          icon: 'mart',
        },
      ],
      queue: [
        {
          id: 'q1',
          priority: 'P0',
          type: '출결 이상',
          target: 'AI 백엔드 3기 김민준',
          status: 'HRD 퇴실 누락',
          due: '오늘',
          action: { label: '확인', to: '/admin/students' },
        },
        {
          id: 'q2',
          priority: 'P0',
          type: '마트 오류',
          target: '재계산 큐 — 인증 마트',
          status: '원본 동기화 실패',
          due: '오늘',
          action: { label: '재계산', to: '/admin/certificates/reviews' },
        },
        {
          id: 'q3',
          priority: 'P1',
          type: '기록실',
          target: 'Airflow 장애 회고 (블로그)',
          status: '승인 대기',
          due: '오늘',
          action: { label: '검토', to: '/admin/records/review' },
        },
        {
          id: 'q4',
          priority: 'P1',
          type: '마일리지',
          target: '상품권 구매 요청',
          status: '결제 확인',
          due: '오늘',
          action: { label: '처리', to: '/admin/mileage' },
        },
        {
          id: 'q5',
          priority: 'P2',
          type: '퀴즈',
          target: 'SQL 조인 퀴즈',
          status: '채점 예외',
          due: 'D-1',
          action: { label: '재채점', to: '/admin/quizzes' },
        },
        {
          id: 'q6',
          priority: 'P2',
          type: '인증',
          target: 'WeatherAPI 프로젝트',
          status: '보완 재제출',
          due: 'D-2',
          action: { label: '상세', to: '/admin/certificates/reviews' },
        },
      ],
      queueSummary: { total: 6, p0: 2, p1: 2, p2: 2 },
      risks: [
        {
          title: 'HRD 원본 수정 불가',
          desc: '동기화 값은 읽기 전용, 정정은 사유와 증빙을 남김',
        },
        {
          title: '공가 잔여일 부족',
          desc: '출결 폼 승인 시 잔여 공가 자동 차감',
        },
        { title: '강사 확인 지연', desc: '기록실 승인 24시간 초과 2건' },
      ],
      shortcuts: [
        {
          key: 'review',
          title: '인증 검토 큐',
          desc: 'P0 2건 처리 대기',
          to: '/admin/certificates/reviews',
          icon: 'review',
        },
        {
          key: 'accounts',
          title: '사용자·권한',
          desc: '계정·역할·기수 관리',
          to: '/admin/settings',
          icon: 'accounts',
        },
        {
          key: 'csv',
          title: 'CSV 매핑',
          desc: '인입 매핑 검사·재시도',
          to: '/admin/csv-mapping',
          icon: 'csv',
        },
        {
          key: 'reputation',
          title: '평판 관리',
          desc: '5축 평판 최근 7일 12건',
          to: '/admin/reputation',
          icon: 'reputation',
        },
        {
          key: 'quarantine',
          title: '인입 격리 큐',
          desc: '오류 1건 보류',
          to: '/admin/ingestion/quarantine',
          icon: 'quarantine',
        },
      ],
      sync: [
        { name: 'HRD-Net 수강생', at: '05-19 09:10', status: 'normal' },
        { name: '출결 원본', at: '05-19 09:05', status: 'caution' },
        { name: '마일리지 정산', at: '05-18 23:00', status: 'normal' },
        { name: '인증 스냅샷', at: '05-19 08:40', status: 'normal' },
      ],
      decisionLog: [
        {
          at: '09:20',
          text: '출결 이상 2건을 HRD 재동기화 후 수동 확인으로 전환',
        },
        {
          at: '09:05',
          text: '기록실 승인 대기 중 강사 확인 필요 2건 담당자 배정',
        },
        { at: '08:50', text: '퀴즈 채점 예외 3건을 자동 재채점 큐로 이동' },
        {
          at: '08:30',
          text: '인입 격리 큐 1건 — 마일리지 일자 오류, 재시도 예약',
        },
      ],
    }),
  ),

  http.get('/api/admin/certificates/reviews', () =>
    ok<CertReviewQueue>(certReviewQueue),
  ),

  http.get('/api/admin/certificates/reviews/:reviewId', ({ params }) =>
    ok<CertReviewDetail>({ ...certReviewDetail, id: String(params.reviewId) }),
  ),
]

// 로그인 mock — VITE_REAL_AUTH=true면 등록하지 않아 bypass → vite proxy → 실 auth-service(:8081).
// (learning-service가 수용하는 진짜 JWT를 발급받기 위함. 기본은 mock 유지해 dev 흐름 보존.)
const loginMockHandler = http.post('/api/auth/login', async ({ request }) => {
  const body = (await request.json()) as {
    userId?: string
    email?: string
    password: string
  }
  // BE 계약: 로그인 ID 필드는 userId(운영=이메일, 수강생=studentUuid). 구 email도 fallback.
  const loginId = body.userId ?? body.email ?? ''
  return HttpResponse.json({
    data: {
      token: 'mock-token',
      user: {
        id: 'mock-1',
        email: loginId,
        name: '테스트 사용자',
        role: roleFromEmail(loginId),
        trainingType: trainingTypeFromEmail(loginId),
      },
    },
  })
})

export const handlers = [
  ...(import.meta.env.VITE_REAL_AUTH === 'true' ? [] : [loginMockHandler]),
  ...quizHandlers,
  ...adminHandlers,
  ...featureHandlers,
]
