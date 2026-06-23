import { http, HttpResponse } from 'msw'
import type {
  CodingTest,
  PlayOverview,
  QuizBattle,
  TypingSession,
} from './types'

// PLAY mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// Figma 게임 선택(418:2172)·타자(428:3015)·코딩 스피드(4911:6913)·CS 퀴즈 배틀(4911:7000) 시안 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

const mockOverview: PlayOverview = {
  stats: [
    { label: '이번 주 플레이', value: '14회', sub: '3개 게임 참여' },
    { label: '최고 점수', value: '92,400', sub: '사내 계산 기준' },
    { label: '랭킹', value: '9위', sub: '백엔드 부트캠프 3기' },
    { label: '보상 예정', value: '3,000M', sub: '상위 기록 보상' },
  ],
  games: [
    {
      key: 'typing',
      name: '타자 게임',
      desc: '제시문을 정확하고 빠르게 입력해 tpm, cpm, wpm, score를 기록합니다.',
      status: 'available',
      progress: '이번 주 최고 612타 · 정확도 97.2%',
      progressPct: 80,
    },
    {
      key: 'coding-speed',
      name: '코딩 테스트',
      desc: '언어별 5문제를 빈칸·출력 예측·핵심 코드 작성으로 풀어 점수를 겨룹니다.',
      status: 'available',
      progress: '이번 주 최고 4/5 해결 · 8,200점',
      progressPct: 80,
    },
    {
      key: 'cs-quiz',
      name: 'CS 퀴즈 배틀',
      desc: '제한 시간 안에 CS 문제를 풀고 콤보로 점수를 쌓아 상대와 겨룹니다.',
      status: 'available',
      progress: '이번 주 최고 콤보 ×6 · 정답률 80%',
      progressPct: 70,
    },
  ],
  records: [
    {
      when: '오늘 15:02',
      game: 'CS 퀴즈',
      detail: '정답 8/10 · 콤보 ×6',
      score: '9,750',
    },
    {
      when: '오늘 14:16',
      game: '코딩 테스트',
      detail: 'Java 4/5 해결',
      score: '8,200',
    },
    {
      when: '어제 18:45',
      game: '타자 게임',
      detail: '588타 · 96.8%',
      score: '88,100',
    },
    {
      when: '5/12 11:20',
      game: '코딩 테스트',
      detail: 'Python 5/5 해결',
      score: '7,500',
    },
  ],
  ranking: [
    { rank: 1, name: '이서연', score: '98,300', me: false },
    { rank: 2, name: '박지호', score: '95,700', me: false },
    { rank: 3, name: '김민준', score: '92,400', me: true },
    { rank: 4, name: '최유나', score: '90,100', me: false },
    { rank: 5, name: '정하늘', score: '87,600', me: false },
  ],
}

const mockTyping: TypingSession = {
  stats: [
    { label: '남은 시간', value: '03:00', sub: '세션 진행 중' },
    { label: '현재 타수', value: '0타', sub: '실시간 입력 기준' },
    { label: '정확도', value: '100%', sub: '오타 0회' },
    { label: '예상 점수', value: '0', sub: '제출 시 서버 재계산' },
  ],
  level: '중급 · 450자',
  text: '동시성 제어는 공유 자원에 대한 접근 순서를 명확히 정의하는 과정입니다. 여러 요청이 동시에 같은 데이터를 변경할 때는 트랜잭션 경계와 잠금 전략을 신중하게 선택해야 합니다.',
  sessionId: 'GS-20260515-018',
  promptName: 'Java Stream API',
  basis: '서버 재계산',
  reward: '랭킹 반영 후 지급',
  durationSec: 180,
  personalBest: 90000,
  otherPrompts: [
    {
      title: 'Spring Transaction',
      meta: '고급 · 620자',
      text: '스프링의 선언적 트랜잭션은 프록시를 통해 메서드 경계에서 시작과 커밋을 제어합니다. 전파 옵션과 격리 수준을 잘못 조합하면 예상치 못한 잠금이나 롤백이 발생할 수 있으므로 경계를 명확히 설계해야 합니다.',
    },
    {
      title: 'HTTP Cache 전략',
      meta: '중급 · 510자',
      text: '효율적인 캐시 전략은 응답 시간을 줄이고 서버 부하를 낮춥니다. 캐시 제어 헤더와 검증 토큰을 적절히 사용하면 변경된 자원만 다시 내려받게 만들어 대역폭을 아낄 수 있습니다.',
    },
    {
      title: 'DB Index 설계',
      meta: '고급 · 580자',
      text: '인덱스는 조회 성능을 높이지만 쓰기 비용과 저장 공간을 늘립니다. 자주 사용하는 조회 조건과 정렬 순서를 분석해 복합 인덱스의 컬럼 순서를 신중하게 결정해야 합니다.',
    },
  ],
}

// 코딩 테스트 — 언어별 5문제. 빈칸 채우기·출력 예측·핵심 코드 작성 혼합, 난이도별 배점.
const mockCoding: CodingTest = {
  testId: 'CT-20260623-041',
  durationSec: 1800, // 전체 30분
  basis: '서버 재계산',
  reward: '랭킹 반영 후 지급',
  problems: [
    // ── Java (5) ──
    {
      id: 'java-1',
      language: 'Java',
      format: 'write-code',
      title: '최댓값 함수',
      difficulty: '보통',
      points: 1500,
      prompt: '두 정수의 최댓값을 삼항 연산자로 반환하도록 함수를 완성하세요.',
      code: `int maxOf(int a, int b) {\n    // 여기에 작성하세요\n}`,
      accept: ['return', 'a>b?a:b'],
      solution: 'return a > b ? a : b;',
    },
    {
      id: 'java-2',
      language: 'Java',
      format: 'predict-output',
      title: '반복문 합',
      difficulty: '쉬움',
      points: 1000,
      prompt: '다음 코드를 실행하면 출력되는 값은?',
      code: `int s = 0;\nfor (int i = 1; i <= 3; i++) s += i;\nSystem.out.println(s);`,
      accept: ['6'],
      solution: '6',
    },
    {
      id: 'java-3',
      language: 'Java',
      format: 'fill-blank',
      title: '배열 합 빈칸',
      difficulty: '보통',
      points: 1500,
      prompt: '배열의 모든 원소를 더하는 코드의 빈칸(____)을 채우세요.',
      code: `int sum = 0;\nfor (int x : arr) sum ____ x;`,
      accept: ['+='],
      solution: '+=',
    },
    {
      id: 'java-4',
      language: 'Java',
      format: 'fill-blank',
      title: '리스트 크기',
      difficulty: '쉬움',
      points: 1000,
      prompt: '리스트의 원소 개수를 구하는 코드의 빈칸(____)을 채우세요.',
      code: `int n = list.____;`,
      accept: ['size()'],
      solution: 'size()',
    },
    {
      id: 'java-5',
      language: 'Java',
      format: 'predict-output',
      title: '나눗셈·나머지',
      difficulty: '어려움',
      points: 2500,
      prompt: '다음 코드의 출력은? (정수 나눗셈과 나머지)',
      code: `int a = 5, b = 2;\nSystem.out.println(a / b + "," + a % b);`,
      accept: ['2,1'],
      solution: '2,1',
    },
    // ── Python (5) ──
    {
      id: 'py-1',
      language: 'Python',
      format: 'predict-output',
      title: '반복문 출력',
      difficulty: '쉬움',
      points: 1000,
      prompt: '다음 코드의 출력은? (각 줄에 하나씩)',
      code: `for i in range(3):\n    print(i * 2)`,
      accept: ['0\n2\n4'],
      solution: '0\n2\n4',
    },
    {
      id: 'py-2',
      language: 'Python',
      format: 'fill-blank',
      title: '리스트 뒤집기',
      difficulty: '보통',
      points: 1500,
      prompt: '리스트를 제자리에서 뒤집는 메서드로 빈칸(____)을 채우세요.',
      code: `nums = [3, 1, 2]\nnums.____()\nprint(nums)`,
      accept: ['reverse'],
      solution: 'reverse',
    },
    {
      id: 'py-3',
      language: 'Python',
      format: 'write-code',
      title: '두 수의 합',
      difficulty: '보통',
      points: 1500,
      prompt: '두 수의 합을 반환하는 함수를 한 줄로 완성하세요.',
      code: `def add(a, b):\n    # 여기에 작성하세요`,
      accept: ['return', 'a+b'],
      solution: 'return a + b',
    },
    {
      id: 'py-4',
      language: 'Python',
      format: 'predict-output',
      title: '문자열 길이·반복',
      difficulty: '어려움',
      points: 2500,
      prompt: '다음 코드의 출력은? (각 줄에 하나씩)',
      code: `print(len("hello"))\nprint("ab" * 3)`,
      accept: ['5\nababab'],
      solution: '5\nababab',
    },
    {
      id: 'py-5',
      language: 'Python',
      format: 'fill-blank',
      title: '범위 합',
      difficulty: '쉬움',
      points: 1000,
      prompt: '1부터 5까지의 합을 구하기 위한 빈칸(함수 이름)을 채우세요.',
      code: `total = sum(____(1, 6))`,
      accept: ['range'],
      solution: 'range',
    },
    // ── C (5) ──
    {
      id: 'c-1',
      language: 'C',
      format: 'fill-blank',
      title: '배열 합 빈칸',
      difficulty: '보통',
      points: 1500,
      prompt: '배열의 합을 구하는 코드의 빈칸(____)을 채우세요.',
      code: `int sum = 0;\nfor (int i = 0; i < n; i++)\n    sum ____ arr[i];`,
      accept: ['+='],
      solution: '+=',
    },
    {
      id: 'c-2',
      language: 'C',
      format: 'predict-output',
      title: '뺄셈 출력',
      difficulty: '쉬움',
      points: 1000,
      prompt: '다음 코드의 출력은?',
      code: `int a = 7, b = 3;\nprintf("%d", a - b);`,
      accept: ['4'],
      solution: '4',
    },
    {
      id: 'c-3',
      language: 'C',
      format: 'write-code',
      title: '값 교환(swap)',
      difficulty: '어려움',
      points: 2500,
      prompt: '임시 변수 t를 사용해 a와 b의 값을 교환하는 코드를 작성하세요.',
      code: `int a = 1, b = 2, t;\n// a와 b를 교환하세요`,
      accept: ['t=a', 'a=b', 'b=t'],
      solution: 't = a; a = b; b = t;',
    },
    {
      id: 'c-4',
      language: 'C',
      format: 'predict-output',
      title: '반복문 출력',
      difficulty: '보통',
      points: 1500,
      prompt: '다음 코드의 출력은?',
      code: `int i;\nfor (i = 0; i < 3; i++)\n    printf("%d ", i);`,
      accept: ['0 1 2'],
      solution: '0 1 2',
    },
    {
      id: 'c-5',
      language: 'C',
      format: 'fill-blank',
      title: '변수 초기화',
      difficulty: '쉬움',
      points: 1000,
      prompt: '정수 변수 count를 0으로 초기화하는 빈칸(____)을 채우세요.',
      code: `int count ____ 0;`,
      accept: ['='],
      solution: '=',
    },
  ],
}

// CS 퀴즈 배틀 — 운영체제·네트워크·자료구조 기초 10문항. [0] = Figma 시안(IPC 파이프).
const mockQuiz: QuizBattle = {
  battleId: 'QB-20260623-088',
  category: 'OS · 네트워크',
  reward: '랭킹 반영 후 지급',
  perQuestionSec: 30, // 문제당 30초 (10문제 ≈ 5분)
  rival: { name: 'AI 페이서 Lv.3', accuracy: 0.72 },
  questions: [
    {
      id: 'q1',
      category: '운영체제',
      difficulty: '보통',
      prompt:
        '프로세스 간 통신(IPC) 방식 중, 커널이 관리하는 버퍼를 통해 한 방향으로 바이트 스트림을 전달하는 방식은 무엇일까요?',
      options: [
        '메시지 큐 (Message Queue)',
        '파이프 (Pipe)',
        '공유 메모리 (Shared Memory)',
        '세마포어 (Semaphore)',
      ],
      answerIndex: 1,
      explanation:
        '파이프는 커널 버퍼를 통해 단방향 바이트 스트림을 전달하는 가장 기본적인 IPC 방식입니다.',
    },
    {
      id: 'q2',
      category: '운영체제',
      difficulty: '보통',
      prompt: '한 프로세스 안의 여러 스레드가 서로 공유하지 않는 영역은?',
      options: [
        '코드(Code) 영역',
        '데이터(Data) 영역',
        '스택(Stack) 영역',
        '힙(Heap) 영역',
      ],
      answerIndex: 2,
      explanation:
        '스택은 함수 호출·지역 변수를 담아 스레드마다 독립적으로 가집니다. 코드·데이터·힙은 공유합니다.',
    },
    {
      id: 'q3',
      category: '운영체제',
      difficulty: '어려움',
      prompt: '교착 상태(Deadlock) 발생의 4가지 필요 조건이 아닌 것은?',
      options: [
        '상호 배제 (Mutual Exclusion)',
        '점유와 대기 (Hold and Wait)',
        '선점 가능 (Preemption)',
        '환형 대기 (Circular Wait)',
      ],
      answerIndex: 2,
      explanation:
        '교착 조건은 상호 배제·점유와 대기·비선점·환형 대기입니다. "선점 가능"은 오히려 교착을 깨는 성질입니다.',
    },
    {
      id: 'q4',
      category: '네트워크',
      difficulty: '쉬움',
      prompt:
        '연결 지향이며 데이터 전송의 신뢰성을 보장하는 전송 계층 프로토콜은?',
      options: ['UDP', 'TCP', 'IP', 'ICMP'],
      answerIndex: 1,
      explanation:
        'TCP는 3-way handshake로 연결을 맺고 순서·재전송을 보장하는 신뢰성 있는 전송 계층 프로토콜입니다.',
    },
    {
      id: 'q5',
      category: '네트워크',
      difficulty: '보통',
      prompt:
        'IP 주소를 기반으로 서로 다른 네트워크 간 경로를 결정하는 장비는?',
      options: [
        '스위치 (L2 Switch)',
        '라우터 (Router)',
        '허브 (Hub)',
        '리피터 (Repeater)',
      ],
      answerIndex: 1,
      explanation:
        '라우터는 네트워크 계층(L3)에서 IP 주소를 보고 최적 경로로 패킷을 포워딩합니다.',
    },
    {
      id: 'q6',
      category: '운영체제',
      difficulty: '보통',
      prompt:
        '참조된 지 가장 오래된 페이지를 우선 교체하는 페이지 교체 기법은?',
      options: ['FIFO', 'LRU', 'LFU', 'OPT'],
      answerIndex: 1,
      explanation:
        'LRU(Least Recently Used)는 가장 오래 참조되지 않은 페이지를 교체합니다.',
    },
    {
      id: 'q7',
      category: '운영체제',
      difficulty: '쉬움',
      prompt: '프로세스가 CPU 할당을 기다리며 준비 큐에서 대기하는 상태는?',
      options: [
        '실행 (Running)',
        '준비 (Ready)',
        '대기 (Blocked)',
        '종료 (Terminated)',
      ],
      answerIndex: 1,
      explanation:
        '준비(Ready) 상태는 실행에 필요한 모든 자원을 갖추고 CPU 스케줄링만 기다리는 상태입니다.',
    },
    {
      id: 'q8',
      category: '네트워크',
      difficulty: '쉬움',
      prompt:
        '요청한 자원을 서버에서 찾을 수 없을 때 반환하는 HTTP 상태 코드는?',
      options: [
        '200 OK',
        '301 Moved Permanently',
        '404 Not Found',
        '500 Internal Server Error',
      ],
      answerIndex: 2,
      explanation:
        '404 Not Found는 서버가 요청한 자원을 찾지 못했음을 나타내는 클라이언트 오류 코드입니다.',
    },
    {
      id: 'q9',
      category: '네트워크',
      difficulty: '쉬움',
      prompt: '도메인 이름을 해당 IP 주소로 변환해 주는 시스템은?',
      options: ['DHCP', 'DNS', 'NAT', 'ARP'],
      answerIndex: 1,
      explanation:
        'DNS(Domain Name System)는 사람이 읽는 도메인 이름을 IP 주소로 해석해 줍니다.',
    },
    {
      id: 'q10',
      category: '자료구조',
      difficulty: '보통',
      prompt: '최근 접근한 데이터에 다시 접근할 확률이 높다는 캐시의 성질은?',
      options: ['공간 지역성', '시간 지역성', '분기 예측', '페이지 폴트'],
      answerIndex: 1,
      explanation:
        '시간 지역성(Temporal Locality)은 최근 사용한 데이터가 곧 다시 사용될 가능성이 높다는 원리입니다.',
    },
    {
      id: 'q11',
      category: '자료구조',
      difficulty: '쉬움',
      prompt: '가장 마지막에 넣은 원소가 가장 먼저 나오는(LIFO) 자료구조는?',
      options: ['큐 (Queue)', '스택 (Stack)', '덱 (Deque)', '힙 (Heap)'],
      answerIndex: 1,
      explanation:
        '스택은 후입선출(LIFO) 구조로, push/pop이 한쪽 끝에서만 일어납니다.',
    },
    {
      id: 'q12',
      category: '자료구조',
      difficulty: '쉬움',
      prompt: '먼저 들어간 원소가 먼저 나오는(FIFO) 자료구조는?',
      options: ['스택 (Stack)', '큐 (Queue)', '트리 (Tree)', '그래프 (Graph)'],
      answerIndex: 1,
      explanation:
        '큐는 선입선출(FIFO) 구조로, 한쪽에서 넣고 반대쪽에서 뺍니다.',
    },
    {
      id: 'q13',
      category: '자료구조',
      difficulty: '보통',
      prompt: '정렬된 배열에서 이진 탐색(Binary Search)의 평균 시간 복잡도는?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      answerIndex: 1,
      explanation:
        '이진 탐색은 탐색 범위를 절반씩 줄여 O(log n)의 시간 복잡도를 가집니다.',
    },
    {
      id: 'q14',
      category: '운영체제',
      difficulty: '보통',
      prompt:
        '실행 중인 프로세스를 교체할 때 기존 상태를 PCB에 저장하고 새 프로세스 상태를 불러오는 작업은?',
      options: ['인터럽트', '컨텍스트 스위칭', '페이징', '스풀링'],
      answerIndex: 1,
      explanation:
        '컨텍스트 스위칭은 CPU가 다른 프로세스로 전환될 때 레지스터·PC 등 상태를 저장·복원하는 과정입니다.',
    },
    {
      id: 'q15',
      category: '운영체제',
      difficulty: '보통',
      prompt:
        '공유 자원에 한 번에 하나의 스레드만 접근하도록 잠그는 동기화 기법은?',
      options: ['뮤텍스 (Mutex)', '파이프', '소켓', '버퍼'],
      answerIndex: 0,
      explanation:
        '뮤텍스는 임계 구역에 하나의 스레드만 진입하도록 잠금(lock)을 거는 상호 배제 도구입니다.',
    },
    {
      id: 'q16',
      category: '운영체제',
      difficulty: '쉬움',
      prompt:
        '물리 메모리보다 큰 주소 공간을 제공하기 위해 디스크를 활용하는 기법은?',
      options: ['캐시 메모리', '가상 메모리', '레지스터', '시스템 버스'],
      answerIndex: 1,
      explanation:
        '가상 메모리는 디스크의 일부를 메모리처럼 사용해 실제 물리 메모리보다 큰 공간을 제공합니다.',
    },
    {
      id: 'q17',
      category: '운영체제',
      difficulty: '보통',
      prompt:
        '실행 중인 프로세스의 CPU를 운영체제가 강제로 회수할 수 있는 스케줄링은?',
      options: ['비선점 스케줄링', '선점 스케줄링', 'FCFS', 'SJF'],
      answerIndex: 1,
      explanation:
        '선점(Preemptive) 스케줄링은 더 높은 우선순위 작업을 위해 실행 중인 프로세스의 CPU를 회수할 수 있습니다.',
    },
    {
      id: 'q18',
      category: '운영체제',
      difficulty: '어려움',
      prompt: '우선순위가 낮은 프로세스가 계속 밀려 CPU를 받지 못하는 현상은?',
      options: ['교착 상태', '기아 (Starvation)', '경쟁 상태', '스래싱'],
      answerIndex: 1,
      explanation:
        '기아는 자원이 특정 프로세스에만 할당되어 다른 프로세스가 무한정 대기하는 현상으로, 에이징으로 완화합니다.',
    },
    {
      id: 'q19',
      category: '네트워크',
      difficulty: '보통',
      prompt: 'OSI 7계층 중 전송 계층(Transport)에 해당하는 프로토콜은?',
      options: ['HTTP', 'IP', 'TCP', 'Ethernet'],
      answerIndex: 2,
      explanation:
        'TCP·UDP가 전송 계층(4계층)에 속합니다. HTTP는 응용, IP는 네트워크, Ethernet은 데이터링크 계층입니다.',
    },
    {
      id: 'q20',
      category: '네트워크',
      difficulty: '보통',
      prompt: 'TCP 연결 수립(3-way handshake) 패킷 순서로 옳은 것은?',
      options: [
        'SYN → ACK → FIN',
        'SYN → SYN/ACK → ACK',
        'FIN → ACK → SYN',
        'ACK → SYN → RST',
      ],
      answerIndex: 1,
      explanation: 'TCP는 SYN → SYN/ACK → ACK 3단계로 연결을 수립합니다.',
    },
    {
      id: 'q21',
      category: '네트워크',
      difficulty: '쉬움',
      prompt:
        'HTTP에 암호화를 더해 보안 통신(HTTPS)을 제공할 때 사용하는 것은?',
      options: ['FTP', 'TLS/SSL', 'SMTP', 'ARP'],
      answerIndex: 1,
      explanation: 'HTTPS는 TLS/SSL로 데이터를 암호화해 도청·변조를 막습니다.',
    },
    {
      id: 'q22',
      category: '네트워크',
      difficulty: '보통',
      prompt: '내부 네트워크용으로 예약된 사설 IP 대역에 해당하는 주소는?',
      options: ['8.8.8.8', '192.168.0.1', '1.1.1.1', '203.0.113.5'],
      answerIndex: 1,
      explanation:
        '192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12가 사설 IP 대역입니다.',
    },
    {
      id: 'q23',
      category: '네트워크',
      difficulty: '쉬움',
      prompt: 'HTTP의 기본 포트 번호는?',
      options: ['21', '22', '80', '443'],
      answerIndex: 2,
      explanation:
        'HTTP는 80번, HTTPS는 443번, SSH는 22번, FTP는 21번 포트를 사용합니다.',
    },
    {
      id: 'q24',
      category: '네트워크',
      difficulty: '쉬움',
      prompt:
        '요청 본문(body)에 데이터를 담아 보내며 자원 생성에 주로 쓰는 HTTP 메서드는?',
      options: ['GET', 'POST', 'HEAD', 'TRACE'],
      answerIndex: 1,
      explanation:
        'POST는 본문에 데이터를 담아 서버로 전송하며, 주로 자원 생성·제출에 사용합니다.',
    },
    {
      id: 'q25',
      category: '자료구조',
      difficulty: '보통',
      prompt: '임의 위치 삽입·삭제는 빠르지만 임의 접근이 O(n)인 자료구조는?',
      options: ['배열', '연결 리스트', '해시 테이블', '스택'],
      answerIndex: 1,
      explanation:
        '연결 리스트는 포인터로 노드를 잇기에 삽입·삭제는 O(1)이지만 특정 위치 접근은 순차 탐색이라 O(n)입니다.',
    },
    {
      id: 'q26',
      category: '자료구조',
      difficulty: '보통',
      prompt: '서로 다른 키가 같은 해시 값을 갖게 되는 현상은?',
      options: ['오버플로', '해시 충돌', '언더플로', '리사이징'],
      answerIndex: 1,
      explanation: '해시 충돌은 체이닝·개방 주소법 등으로 해결합니다.',
    },
    {
      id: 'q27',
      category: '자료구조',
      difficulty: '보통',
      prompt: '이진 트리를 왼쪽 - 루트 - 오른쪽 순서로 방문하는 순회는?',
      options: ['전위 순회', '중위 순회', '후위 순회', '레벨 순회'],
      answerIndex: 1,
      explanation:
        '중위 순회(In-order)는 BST에서 오름차순 정렬 결과를 만듭니다.',
    },
    {
      id: 'q28',
      category: '자료구조',
      difficulty: '보통',
      prompt: '부모가 항상 자식보다 크거나 같은 완전 이진 트리는?',
      options: ['최소 힙', '최대 힙', '이진 탐색 트리', '레드-블랙 트리'],
      answerIndex: 1,
      explanation:
        '최대 힙(Max-Heap)은 루트가 가장 큰 값이며, 우선순위 큐 구현에 쓰입니다.',
    },
    {
      id: 'q29',
      category: '자료구조',
      difficulty: '보통',
      prompt: '균형 잡힌 이진 탐색 트리의 평균 탐색 시간 복잡도는?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
      answerIndex: 1,
      explanation:
        '균형 BST는 높이가 log n이라 탐색·삽입·삭제가 평균 O(log n)입니다.',
    },
    {
      id: 'q30',
      category: '자료구조',
      difficulty: '쉬움',
      prompt: '그래프를 너비 우선 탐색(BFS)할 때 사용하는 자료구조는?',
      options: ['스택', '큐', '힙', '트리'],
      answerIndex: 1,
      explanation:
        'BFS는 큐로 가까운 정점부터 차례로 방문합니다. (DFS는 스택/재귀)',
    },
  ],
}

export const handlers = [
  http.get('/api/student/play', () => ok(mockOverview)),
  http.get('/api/student/play/typing', () => ok(mockTyping)),
  http.get('/api/student/play/coding', () => ok(mockCoding)),
  http.get('/api/student/play/quiz', () => ok(mockQuiz)),
]
