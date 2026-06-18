import { http, HttpResponse } from 'msw'
import type { ProjectListData, ProjectWizardData, WorkspaceData } from './types'

// 프로젝트 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// Figma 프로젝트 목록(337:930)·생성 마법사(340:981 외) 시안 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

const mockList: ProjectListData = {
  headerTitle: '프로젝트 — 백엔드 부트캠프 · 3기',
  headerSub:
    '참여 중인 팀·개인 프로젝트와 인증 상태, 산출물을 정리하고 인증을 요청하세요.',
  stats: [
    {
      key: 'joined',
      label: '참여 프로젝트',
      value: '3',
      unit: '건',
      sub: '팀 2건 · 개인 1건',
      tone: 'brand',
    },
    {
      key: 'certified',
      label: '인증 완료',
      value: '1',
      unit: '건',
      sub: '대표 후보 1건',
      tone: 'success',
    },
    {
      key: 'reviewing',
      label: '검토 중',
      value: '1',
      unit: '건',
      sub: 'D+9 감사 검토 대기',
      tone: 'warning',
    },
    {
      key: 'draft',
      label: '작성 중',
      value: '1',
      unit: '건',
      sub: '개인 프로젝트 진행 중',
      tone: 'accent',
    },
  ],
  filters: [
    { key: 'all', label: '전체', count: 3 },
    { key: 'certified', label: '인증 완료', count: 1 },
    { key: 'reviewing', label: '검토 중', count: 1 },
    { key: 'draft', label: '작성 중', count: 1 },
    { key: 'representative', label: '대표 후보', count: 1 },
  ],
  projects: [
    {
      id: 'p1',
      kind: 'team',
      kindLabel: '팀',
      status: 'certified',
      statusLabel: '인증 완료',
      representative: true,
      accentTone: 'success',
      title: '주문 관리 MSA 백엔드',
      pm: '예칼 PM',
      teamLabel: '팀 4명',
      period: '2026-04-01 ~ 2026-05-30 · 80일 · 종료',
      tags: ['Spring Boot', 'JPA', 'Kafka', 'Docker', 'PostgreSQL'],
      outcomes: [
        '주문/결제 도메인 분리 · 트랜잭션 정합성 정리',
        'Kafka 이벤트 라우팅 · 결제 실패율 8% → 0.4%',
        'API P95 320ms → 145ms (-55%)',
      ],
      actionLabel: '워크스페이스 열기',
    },
    {
      id: 'p2',
      kind: 'team',
      kindLabel: '팀',
      status: 'reviewing',
      statusLabel: '검토 중',
      representative: false,
      accentTone: 'warning',
      title: '실시간 채팅 서버',
      pm: '예칼 팀장',
      teamLabel: '팀 3명',
      period: '2026-03-20 ~ 2026-04-25 · 36일 · 종료',
      tags: ['Spring Boot', 'WebSocket', 'Redis', 'Nginx'],
      outcomes: [
        'WebSocket session sticky · 동시 5천명 안정 운영',
        'Redis Pub/Sub 채번 적용',
        '장애 복구 평균 32s → 8s',
      ],
      actionLabel: '검토 상태 보기',
    },
    {
      id: 'p3',
      kind: 'personal',
      kindLabel: '개인',
      status: 'draft',
      statusLabel: '작성 중',
      representative: false,
      accentTone: 'accent',
      title: '포트폴리오 REST API',
      pm: '예칼 PM',
      teamLabel: '개인 프로젝트',
      period: '2026-05-02 ~ 진행 중 · 24일째 진행 중',
      tags: ['Spring Boot', 'JPA', 'PostgreSQL', 'Spring Security'],
      outcomes: [
        'JWT 인증·인가 + Refresh Token rotation',
        'ERD 정규화 3NF · 인덱스 튜닝',
        'CI/CD GitHub Actions + Docker Compose',
      ],
      actionLabel: '워크스페이스 열기',
    },
  ],
  shownLabel: '3건 모두 표시 · 인증 완료 1 / 검토 중 1 / 작성 중 1',
}

const mockWizard: ProjectWizardData = {
  cohortLabel: '백엔드 부트캠프 3기',
  pmName: '김수강',
  pmMeta: '백엔드 부트캠프 · 3기 · 프로젝트 작성자는 PM 역할이 자동 부여됩니다',
  candidates: [
    { id: 'c1', name: '이서연', meta: '백엔드 · 3팀', avatarTone: 'success' },
    { id: 'c2', name: '박지호', meta: '풀스택 · 1팀', avatarTone: 'warning' },
    { id: 'c3', name: '최유나', meta: '백엔드 · 2팀', avatarTone: 'info' },
    { id: 'c4', name: '한지우', meta: '백엔드 · 3팀', avatarTone: 'success' },
    { id: 'c5', name: '정민준', meta: '프론트엔드 · 1팀', avatarTone: 'brand' },
    { id: 'c6', name: '강서윤', meta: '백엔드 · 2팀', avatarTone: 'info' },
    { id: 'c7', name: '윤도현', meta: '데브옵스 · 4팀', avatarTone: 'accent' },
    { id: 'c8', name: '임하준', meta: '풀스택 · 3팀', avatarTone: 'warning' },
    { id: 'c9', name: '송지아', meta: '백엔드 · 1팀', avatarTone: 'danger' },
    {
      id: 'c10',
      name: '오태양',
      meta: '프론트엔드 · 4팀',
      avatarTone: 'brand',
    },
  ],
}

export const mockWorkspace: WorkspaceData = {
  id: 'p1',
  title: '주문 관리 MSA 백엔드',
  meta: '팀 프로젝트 · 4명 · 2026-04-01 ~ 2026-05-30 · PM 김민웅',
  banner:
    '프로젝트가 완료되어 종료되었어요 · 인증 요청으로 증명서 대표 후보로 등록할 수 있어요',
  stats: [
    {
      label: '전체 진행률',
      value: '92',
      unit: '%',
      sub: '58 / 63 작업 완료',
      tone: 'brand',
    },
    {
      label: '내 작업',
      value: '4',
      unit: '건',
      sub: '진행 2 · 대기 2',
      tone: 'info',
    },
    {
      label: '열린 이슈',
      value: '3',
      unit: '건',
      sub: 'P0 1 · P1 2',
      tone: 'warning',
    },
    {
      label: '인증까지',
      value: 'D-3',
      unit: '',
      sub: '상호평가 마감 임박',
      tone: 'accent',
    },
  ],
  myTasks: [
    {
      title: '결제 실패 재시도 로직 구현',
      assignee: '나',
      due: 'D-1',
      tags: [
        { label: '백엔드', tone: 'info' },
        { label: '긴급', tone: 'danger' },
      ],
    },
    {
      title: '통합 테스트 시나리오 작성',
      assignee: '나',
      due: 'D-4',
      tags: [
        { label: '테스트', tone: 'accent' },
        { label: '보통', tone: 'warning' },
      ],
    },
    {
      title: '주문 취소 API 설계',
      assignee: '나',
      due: 'D-5',
      tags: [
        { label: '백엔드', tone: 'info' },
        { label: '보통', tone: 'warning' },
      ],
    },
    {
      title: '결제 모듈 단위 테스트',
      assignee: '나',
      due: 'D-3',
      tags: [
        { label: '테스트', tone: 'accent' },
        { label: '보통', tone: 'warning' },
      ],
    },
  ],
  activities: [
    {
      who: '김민웅',
      action: '인증 토큰 만료 처리 PR을 열었습니다',
      when: '10분 전',
    },
    {
      who: '이서연',
      action: 'API 명세서 v2를 승인 후보로 등록했습니다',
      when: '1시간 전',
    },
    {
      who: '박지호',
      action: '장바구니 캐시 무효화 구현을 진행 중으로 옮겼습니다',
      when: '3시간 전',
    },
    {
      who: '최유나',
      action: '스프린트 3 회고 회의록을 작성했습니다',
      when: '어제',
    },
  ],
  columns: [
    {
      key: 'todo',
      label: '할 일',
      tasks: [
        {
          title: '결제 실패 재시도 로직 구현',
          assignee: '나',
          due: 'D-1',
          tags: [
            { label: '백엔드', tone: 'info' },
            { label: '긴급', tone: 'danger' },
          ],
        },
        {
          title: '주문 취소 API 설계',
          assignee: '나',
          due: 'D-5',
          tags: [
            { label: '백엔드', tone: 'info' },
            { label: '보통', tone: 'warning' },
          ],
        },
        {
          title: 'ERD 초안 리뷰 반영',
          assignee: '최유나',
          due: 'D-6',
          tags: [
            { label: '설계', tone: 'accent' },
            { label: '보통', tone: 'warning' },
          ],
        },
      ],
    },
    {
      key: 'doing',
      label: '진행 중',
      tasks: [
        {
          title: '재고 동기화 이벤트 처리',
          assignee: '김민웅',
          due: 'D-2',
          tags: [
            { label: '백엔드', tone: 'info' },
            { label: '보통', tone: 'warning' },
          ],
        },
        {
          title: '통합 테스트 시나리오 작성',
          assignee: '나',
          due: 'D-4',
          tags: [
            { label: '테스트', tone: 'accent' },
            { label: '보통', tone: 'warning' },
          ],
        },
        {
          title: '장바구니 캐시 무효화 구현',
          assignee: '박지호',
          due: 'D-1',
          tags: [
            { label: '백엔드', tone: 'info' },
            { label: '긴급', tone: 'danger' },
          ],
        },
      ],
    },
    {
      key: 'review',
      label: '검토 대기',
      tasks: [
        {
          title: 'API 명세서 업데이트',
          assignee: '최유나',
          due: 'D-1',
          tags: [
            { label: '문서', tone: 'accent' },
            { label: '보통', tone: 'warning' },
          ],
        },
        {
          title: '인증 토큰 만료 처리 PR',
          assignee: '김민웅',
          due: 'D-2',
          tags: [
            { label: '백엔드', tone: 'info' },
            { label: '긴급', tone: 'danger' },
          ],
        },
        {
          title: '결제 모듈 단위 테스트',
          assignee: '나',
          due: 'D-3',
          tags: [
            { label: '테스트', tone: 'accent' },
            { label: '보통', tone: 'warning' },
          ],
        },
      ],
    },
  ],
  calMonth: '2026년 5월',
  calEvents: [
    { day: 4, label: '회의', tone: 'info' },
    { day: 12, label: '회의', tone: 'info' },
    { day: 18, label: '발표', tone: 'warning' },
    { day: 25, label: '회의', tone: 'info' },
  ],
  upcoming: [
    { date: '5/16', label: '스프린트 리뷰', tone: 'info' },
    { date: '5/16', label: '중간 발표', tone: 'warning' },
    { date: '5/23', label: 'API 명세 마감', tone: 'accent' },
    { date: '5/28', label: '인증 요청 준비', tone: 'brand' },
  ],
  meetings: [
    {
      title: '스프린트 3 회고',
      meta: '2026-05-14 · 참석 4명',
      summary: '액션 아이템 5건',
      status: { label: '완료', tone: 'success' },
    },
    {
      title: 'DB 스키마 확정 회의',
      meta: '2026-05-11 · 참석 4명',
      summary: '결정 사항 3건',
      status: { label: '완료', tone: 'success' },
    },
    {
      title: '인증 발표 준비 회의',
      meta: '2026-05-09 · 참석 3명',
      summary: '담당자 배정',
      status: { label: '진행', tone: 'warning' },
    },
    {
      title: '기술 스택 변경 논의',
      meta: '2026-05-06 · 참석 4명',
      summary: 'Kafka 도입 확정',
      status: { label: '완료', tone: 'success' },
    },
  ],
  docCategories: [
    '전체',
    'API 명세',
    '설계 문서',
    '발표 자료',
    '첨부 파일',
    '위키',
  ],
  docs: [
    {
      title: 'API 명세서 v2',
      meta: 'PDF · 1.2MB',
      status: { label: '승인 후보', tone: 'info' },
    },
    {
      title: 'ERD 설계 문서',
      meta: 'Wiki · 12분 전',
      status: { label: '초안', tone: 'warning' },
    },
    {
      title: '중간 발표 자료',
      meta: 'PPTX · 8.4MB',
      status: { label: '검토', tone: 'accent' },
    },
    {
      title: '배포 아키텍처',
      meta: 'Wiki · 어제',
      status: { label: '완료', tone: 'success' },
    },
    {
      title: '성능 테스트 결과',
      meta: 'CSV · 240KB',
      status: { label: '완료', tone: 'success' },
    },
    {
      title: 'README 정리',
      meta: 'Markdown · 2일 전',
      status: { label: '완료', tone: 'success' },
    },
  ],
  issues: [
    {
      title: 'Kafka 컨슈머 지연',
      meta: '성능 · 담당 박지호',
      priority: { label: 'P1', tone: 'warning' },
      status: { label: '열림', tone: 'info' },
    },
    {
      title: '결제 실패 재시도 중복 실행',
      meta: '버그 · 담당 김민웅',
      priority: { label: 'P0', tone: 'danger' },
      status: { label: '진행', tone: 'accent' },
    },
    {
      title: 'Docker 배포 환경변수 누락',
      meta: '배포 · 담당 이서연',
      priority: { label: 'P2', tone: 'info' },
      status: { label: '대기', tone: 'warning' },
    },
    {
      title: 'API 응답 코드 정책 불일치',
      meta: '설계 · 담당 최유나',
      priority: { label: 'P1', tone: 'warning' },
      status: { label: '열림', tone: 'info' },
    },
    {
      title: '주문 조회 정렬 오류',
      meta: '버그 · 담당 김민웅',
      priority: { label: 'P2', tone: 'info' },
      status: { label: '완료', tone: 'success' },
    },
  ],
  members: [
    {
      name: '김민웅',
      role: '백엔드 · 인프라',
      kind: 'PM',
      contrib: 40,
      avatarTone: 'accent',
    },
    {
      name: '이서연',
      role: 'API 문서',
      kind: '팀원',
      contrib: 25,
      avatarTone: 'info',
    },
    {
      name: '박지호',
      role: 'Kafka · 실시간',
      kind: '팀원',
      contrib: 20,
      avatarTone: 'warning',
    },
    {
      name: '최유나',
      role: 'QA · 발표',
      kind: '팀원',
      contrib: 15,
      avatarTone: 'success',
    },
  ],
  rolePolicy: [
    'PM은 인증 요청과 팀원 초대를 관리합니다',
    '팀원은 본인 작업과 산출물을 등록합니다',
    '기여도 합계는 100% 이내로 유지합니다',
    '인증 후 변경은 변경 제안으로 제출합니다',
  ],
  metrics: [
    {
      label: 'API 평균 응답 시간',
      before: '420ms',
      after: '120ms',
      delta: '-71%',
      good: true,
    },
    {
      label: '테스트 커버리지',
      before: '35%',
      after: '82%',
      delta: '+47%p',
      good: true,
    },
    {
      label: '주문 처리 TPS',
      before: '240',
      after: '1,200',
      delta: '+400%',
      good: true,
    },
  ],
  stack: [
    'Spring Boot',
    'JPA',
    'Kafka',
    'Docker',
    'Redis',
    'JUnit5',
    'PostgreSQL',
    'GitHub Actions',
  ],
  peerDue: 'D-3',
  peerMyStatus: { label: '내 상태: 미제출', tone: 'warning' },
  peerTeamStatus: { label: '팀 제출 3/4', tone: 'info' },
  peerTargets: [
    {
      name: '김민웅',
      role: 'PM',
      axes: [
        { key: '협업', score: 4.5 },
        { key: '소통', score: 4.5 },
        { key: '책임감', score: 4.5 },
        { key: '문제해결', score: 4.5 },
        { key: '기술 기여', score: 4.0 },
      ],
      tags: [
        { label: '일정 준수', tone: 'info' },
        { label: '책임감', tone: 'accent' },
      ],
    },
    {
      name: '이서연',
      role: '백엔드',
      axes: [
        { key: '협업', score: 4.5 },
        { key: '소통', score: 4.5 },
        { key: '책임감', score: 4.5 },
        { key: '문제해결', score: 4.5 },
        { key: '기술 기여', score: 4.0 },
      ],
      tags: [
        { label: '문제해결', tone: 'brand' },
        { label: '소통', tone: 'info' },
      ],
    },
    {
      name: '최유나',
      role: '프론트엔드',
      axes: [
        { key: '협업', score: 4.5 },
        { key: '소통', score: 4.5 },
        { key: '책임감', score: 4.5 },
        { key: '문제해결', score: 4.5 },
        { key: '기술 기여', score: 4.0 },
      ],
      tags: [
        { label: '협업', tone: 'success' },
        { label: '기술 기여', tone: 'accent' },
      ],
    },
  ],
  certChecklist: [
    {
      label: '프로젝트 기본 정보 입력',
      status: { label: '완료', tone: 'success' },
    },
    {
      label: '팀원 및 기여도 확인',
      status: { label: '완료', tone: 'success' },
    },
    {
      label: '성과 지표 3개 이상 등록',
      status: { label: '완료', tone: 'success' },
    },
    {
      label: '산출물 공개 범위 확인',
      status: { label: '완료', tone: 'success' },
    },
    { label: '트러블슈팅 연결', status: { label: '필요', tone: 'danger' } },
    { label: '상호평가 제출 완료', status: { label: '진행', tone: 'warning' } },
  ],
  certStatus: { label: '검토 전', tone: 'info' },
  certRecentChange: {
    label: '성과 지표 보정 요청',
    status: { label: '요청됨', tone: 'warning' },
    date: '2026-05-14 제출 · 검토 대기',
  },
}

// 실시간 채팅 서버(p2) — 검토 중 팀 프로젝트. 식별·인물 관련 필드만 재정의하고
// 캘린더·역할 정책 등 일반 구조는 p1에서 재사용.
export const mockWorkspaceP2: WorkspaceData = {
  ...mockWorkspace,
  id: 'p2',
  title: '실시간 채팅 서버',
  meta: '팀 프로젝트 · 3명 · 2026-03-20 ~ 2026-04-25 · PM 예칼',
  banner:
    '인증 검토 중이에요 · 담당 강사가 산출물과 발표 내용을 확인하고 있어요 (D+9 감사 검토 대기)',
  stats: [
    {
      label: '전체 진행률',
      value: '100',
      unit: '%',
      sub: '42 / 42 작업 완료',
      tone: 'brand',
    },
    {
      label: '내 작업',
      value: '0',
      unit: '건',
      sub: '모두 완료',
      tone: 'info',
    },
    {
      label: '열린 이슈',
      value: '1',
      unit: '건',
      sub: 'P2 1',
      tone: 'warning',
    },
    {
      label: '인증까지',
      value: '검토 중',
      unit: '',
      sub: 'D+9 감사 검토',
      tone: 'accent',
    },
  ],
  myTasks: [
    {
      title: 'WebSocket 세션 sticky 검증',
      assignee: '나',
      due: '완료',
      tags: [
        { label: '백엔드', tone: 'info' },
        { label: '완료', tone: 'success' },
      ],
    },
    {
      title: '부하 테스트 리포트 정리',
      assignee: '나',
      due: '완료',
      tags: [
        { label: '테스트', tone: 'accent' },
        { label: '완료', tone: 'success' },
      ],
    },
  ],
  activities: [
    { who: '예칼', action: '인증 요청을 제출했습니다', when: '2일 전' },
    {
      who: '정해린',
      action: 'Redis Pub/Sub 채번 적용을 완료했습니다',
      when: '5일 전',
    },
    {
      who: '오세훈',
      action: 'Nginx 무중단 배포 설정을 머지했습니다',
      when: '6일 전',
    },
  ],
  columns: [
    { key: 'todo', label: '할 일', tasks: [] },
    { key: 'doing', label: '진행 중', tasks: [] },
    {
      key: 'review',
      label: '검토 대기',
      tasks: [
        {
          title: '인증 발표 자료 보완',
          assignee: '예칼',
          due: 'D-2',
          tags: [
            { label: '문서', tone: 'accent' },
            { label: '보통', tone: 'warning' },
          ],
        },
      ],
    },
  ],
  meetings: [
    {
      title: '인증 발표 리허설',
      meta: '2026-04-23 · 참석 3명',
      summary: '발표 시나리오 점검',
      status: { label: '완료', tone: 'success' },
    },
    {
      title: '부하 테스트 결과 공유',
      meta: '2026-04-20 · 참석 3명',
      summary: '동시 5천명 안정 운영 확인',
      status: { label: '완료', tone: 'success' },
    },
    {
      title: '스프린트 최종 회고',
      meta: '2026-04-18 · 참석 3명',
      summary: '액션 아이템 2건',
      status: { label: '완료', tone: 'success' },
    },
  ],
  docs: [
    {
      title: '채팅 프로토콜 명세',
      meta: 'PDF · 0.8MB',
      status: { label: '완료', tone: 'success' },
    },
    {
      title: '부하 테스트 결과',
      meta: 'CSV · 180KB',
      status: { label: '완료', tone: 'success' },
    },
    {
      title: '배포 아키텍처 (Nginx)',
      meta: 'Wiki · 3일 전',
      status: { label: '완료', tone: 'success' },
    },
    {
      title: '인증 발표 자료',
      meta: 'PPTX · 6.1MB',
      status: { label: '검토', tone: 'accent' },
    },
  ],
  issues: [
    {
      title: '재접속 시 중복 메시지 수신',
      meta: '버그 · 담당 정해린',
      priority: { label: 'P2', tone: 'info' },
      status: { label: '열림', tone: 'info' },
    },
  ],
  members: [
    {
      name: '예칼',
      role: 'PM · 백엔드',
      kind: 'PM',
      contrib: 45,
      avatarTone: 'accent',
    },
    {
      name: '정해린',
      role: 'WebSocket · Redis',
      kind: '팀원',
      contrib: 30,
      avatarTone: 'info',
    },
    {
      name: '오세훈',
      role: '인프라 · Nginx',
      kind: '팀원',
      contrib: 25,
      avatarTone: 'warning',
    },
  ],
  metrics: [
    {
      label: '동시 접속자',
      before: '500',
      after: '5,000',
      delta: '+900%',
      good: true,
    },
    {
      label: '장애 복구 시간',
      before: '32s',
      after: '8s',
      delta: '-75%',
      good: true,
    },
    {
      label: '메시지 지연(P95)',
      before: '180ms',
      after: '60ms',
      delta: '-67%',
      good: true,
    },
  ],
  stack: ['Spring Boot', 'WebSocket', 'Redis', 'Nginx', 'JUnit5', 'Docker'],
  peerDue: '마감 종료',
  peerMyStatus: { label: '내 상태: 제출 완료', tone: 'success' },
  peerTeamStatus: { label: '팀 제출 3/3', tone: 'success' },
  peerTargets: [
    {
      name: '예칼',
      role: 'PM',
      axes: [
        { key: '협업', score: 4.5 },
        { key: '소통', score: 4.5 },
        { key: '책임감', score: 5.0 },
        { key: '문제해결', score: 4.5 },
        { key: '기술 기여', score: 4.5 },
      ],
      tags: [
        { label: '리더십', tone: 'accent' },
        { label: '일정 준수', tone: 'info' },
      ],
    },
    {
      name: '오세훈',
      role: '인프라',
      axes: [
        { key: '협업', score: 4.5 },
        { key: '소통', score: 4.0 },
        { key: '책임감', score: 4.5 },
        { key: '문제해결', score: 4.5 },
        { key: '기술 기여', score: 4.5 },
      ],
      tags: [
        { label: '문제해결', tone: 'brand' },
        { label: '기술 기여', tone: 'accent' },
      ],
    },
  ],
  certChecklist: [
    {
      label: '프로젝트 기본 정보 입력',
      status: { label: '완료', tone: 'success' },
    },
    {
      label: '팀원 및 기여도 확인',
      status: { label: '완료', tone: 'success' },
    },
    {
      label: '성과 지표 3개 이상 등록',
      status: { label: '완료', tone: 'success' },
    },
    {
      label: '산출물 공개 범위 확인',
      status: { label: '완료', tone: 'success' },
    },
    { label: '트러블슈팅 연결', status: { label: '완료', tone: 'success' } },
    { label: '상호평가 제출 완료', status: { label: '완료', tone: 'success' } },
  ],
  certStatus: { label: '검토 중', tone: 'warning' },
  certRecentChange: {
    label: '발표 자료 보완 요청',
    status: { label: '검토 중', tone: 'warning' },
    date: '2026-04-26 제출 · 감사 검토 중',
  },
}

// 포트폴리오 REST API(p3) — 진행 중 개인 프로젝트. 팀원이 없어 상호평가는 해당 없음.
export const mockWorkspaceP3: WorkspaceData = {
  ...mockWorkspace,
  id: 'p3',
  title: '포트폴리오 REST API',
  meta: '개인 프로젝트 · 1명 · 2026-05-02 ~ 진행 중 · PM 예칼',
  banner: undefined,
  stats: [
    {
      label: '전체 진행률',
      value: '60',
      unit: '%',
      sub: '18 / 30 작업 완료',
      tone: 'brand',
    },
    {
      label: '내 작업',
      value: '5',
      unit: '건',
      sub: '진행 2 · 대기 3',
      tone: 'info',
    },
    {
      label: '열린 이슈',
      value: '2',
      unit: '건',
      sub: 'P1 1 · P2 1',
      tone: 'warning',
    },
    {
      label: '인증까지',
      value: '작성 중',
      unit: '',
      sub: '진행률 60%',
      tone: 'accent',
    },
  ],
  myTasks: [
    {
      title: 'JWT 인증 필터 작성',
      assignee: '나',
      due: 'D-2',
      tags: [
        { label: '백엔드', tone: 'info' },
        { label: '보통', tone: 'warning' },
      ],
    },
    {
      title: 'Refresh Token rotation 구현',
      assignee: '나',
      due: 'D-3',
      tags: [
        { label: '보안', tone: 'danger' },
        { label: '보통', tone: 'warning' },
      ],
    },
    {
      title: '엔티티 연관관계 리팩터링',
      assignee: '나',
      due: 'D-5',
      tags: [
        { label: '설계', tone: 'accent' },
        { label: '보통', tone: 'warning' },
      ],
    },
  ],
  activities: [
    {
      who: '예칼',
      action: 'JWT 인증 모듈 초안을 커밋했습니다',
      when: '1시간 전',
    },
    { who: '예칼', action: 'ERD 3NF 정규화를 정리했습니다', when: '어제' },
    {
      who: '예칼',
      action: 'GitHub Actions CI 파이프라인을 추가했습니다',
      when: '2일 전',
    },
  ],
  columns: [
    {
      key: 'todo',
      label: '할 일',
      tasks: [
        {
          title: 'Swagger 문서화',
          assignee: '예칼',
          due: 'D-6',
          tags: [
            { label: '문서', tone: 'accent' },
            { label: '보통', tone: 'warning' },
          ],
        },
        {
          title: '통합 테스트 추가',
          assignee: '예칼',
          due: 'D-7',
          tags: [
            { label: '테스트', tone: 'accent' },
            { label: '보통', tone: 'warning' },
          ],
        },
      ],
    },
    {
      key: 'doing',
      label: '진행 중',
      tasks: [
        {
          title: 'JWT 인증 필터 작성',
          assignee: '예칼',
          due: 'D-2',
          tags: [
            { label: '백엔드', tone: 'info' },
            { label: '보통', tone: 'warning' },
          ],
        },
        {
          title: '상품 검색 인덱스 튜닝',
          assignee: '예칼',
          due: 'D-4',
          tags: [
            { label: '성능', tone: 'warning' },
            { label: '보통', tone: 'warning' },
          ],
        },
      ],
    },
    {
      key: 'review',
      label: '검토 대기',
      tasks: [
        {
          title: 'ERD 정규화 검토',
          assignee: '예칼',
          due: 'D-1',
          tags: [
            { label: '설계', tone: 'accent' },
            { label: '보통', tone: 'warning' },
          ],
        },
      ],
    },
  ],
  meetings: [
    {
      title: '멘토 코드 리뷰 세션',
      meta: '2026-05-20 · 참석 2명',
      summary: '인증 흐름 피드백 4건',
      status: { label: '완료', tone: 'success' },
    },
    {
      title: '아키텍처 점검',
      meta: '2026-05-12 · 참석 2명',
      summary: '레이어 분리 방향 확정',
      status: { label: '완료', tone: 'success' },
    },
  ],
  docs: [
    {
      title: 'ERD 설계 문서',
      meta: 'Wiki · 1일 전',
      status: { label: '진행', tone: 'warning' },
    },
    {
      title: 'API 명세 (Swagger)',
      meta: 'Wiki · 작성 중',
      status: { label: '초안', tone: 'info' },
    },
    {
      title: 'README 정리',
      meta: 'Markdown · 3일 전',
      status: { label: '완료', tone: 'success' },
    },
  ],
  issues: [
    {
      title: '게시글 목록 N+1 쿼리 발생',
      meta: '성능 · 담당 예칼',
      priority: { label: 'P1', tone: 'warning' },
      status: { label: '진행', tone: 'accent' },
    },
    {
      title: 'Refresh Token 재사용 탐지 누락',
      meta: '보안 · 담당 예칼',
      priority: { label: 'P2', tone: 'info' },
      status: { label: '열림', tone: 'info' },
    },
  ],
  members: [
    {
      name: '예칼',
      role: '백엔드 (개인)',
      kind: 'PM',
      contrib: 100,
      avatarTone: 'accent',
    },
  ],
  metrics: [
    {
      label: 'API 응답 시간(P95)',
      before: '210ms',
      after: '95ms',
      delta: '-55%',
      good: true,
    },
    {
      label: '테스트 커버리지',
      before: '0%',
      after: '64%',
      delta: '+64%p',
      good: true,
    },
    {
      label: '게시글 조회 쿼리 수',
      before: '21',
      after: '3',
      delta: '-86%',
      good: true,
    },
  ],
  stack: [
    'Spring Boot',
    'JPA',
    'PostgreSQL',
    'Spring Security',
    'JWT',
    'Docker',
    'GitHub Actions',
  ],
  peerDue: '해당 없음',
  peerMyStatus: { label: '개인 프로젝트 · 상호평가 없음', tone: 'info' },
  peerTeamStatus: { label: '팀원 없음', tone: 'info' },
  peerTargets: [],
  certChecklist: [
    {
      label: '프로젝트 기본 정보 입력',
      status: { label: '완료', tone: 'success' },
    },
    {
      label: '팀원 및 기여도 확인',
      status: { label: '완료', tone: 'success' },
    },
    {
      label: '성과 지표 3개 이상 등록',
      status: { label: '진행', tone: 'warning' },
    },
    {
      label: '산출물 공개 범위 확인',
      status: { label: '필요', tone: 'danger' },
    },
    { label: '트러블슈팅 연결', status: { label: '필요', tone: 'danger' } },
    {
      label: '상호평가 제출 완료',
      status: { label: '해당 없음', tone: 'info' },
    },
  ],
  certStatus: { label: '검토 전', tone: 'info' },
  certRecentChange: {
    label: '변경 제안 없음',
    status: { label: '없음', tone: 'info' },
    date: '아직 제출된 변경 제안이 없습니다',
  },
}

// projectId → 워크스페이스. 미등록 id(신규 생성 draft 등)는 p1을 기본값으로 응답.
const workspaces: Record<string, WorkspaceData> = {
  p1: mockWorkspace,
  p2: mockWorkspaceP2,
  p3: mockWorkspaceP3,
}

export const handlers = [
  http.get('/api/student/projects', () => ok(mockList)),
  http.get('/api/student/projects/wizard', () => ok(mockWizard)),
  http.get('/api/student/projects/:projectId', ({ params }) => {
    const id = String(params.projectId)
    return ok(workspaces[id] ?? mockWorkspace)
  }),
]
