// 워크스페이스 mock(p1) — 주문 관리 MSA 백엔드(인증 완료 팀 프로젝트).
import type { WorkspaceData } from '../types'

export const mockWorkspace: WorkspaceData = {
  id: 'p1',
  title: '주문 관리 MSA 백엔드',
  meta: '팀 프로젝트 · 4명 · 2026-06-01 ~ 2026-07-15 · PM 김수강',
  status: 'certified',
  banner:
    '프로젝트가 완벽히 종료 되었네요 · 강사·운영 완료 확정 후 3일 안에 팀원 상호평가를 제출해야 내 증명서 협업 근거가 최신화됩니다.',
  stats: [
    {
      label: '작업 진행률',
      value: '58',
      unit: '%',
      sub: '32 / 55 작업 완료',
      tone: 'brand',
    },
    {
      label: '회의록',
      value: '8',
      unit: '건',
      sub: '최근 회의 5/24',
      tone: 'accent',
    },
    {
      label: '산출물',
      value: '12',
      unit: '건',
      sub: '문서 7 · 파일 4 · 위키 1',
      tone: 'info',
    },
    {
      label: '열린 이슈',
      value: '3',
      unit: '건',
      sub: 'P0 1건 · P1 2건',
      tone: 'warning',
    },
  ],
  myTasks: [
    {
      id: 'task-mock-1',
      title: '주문 도메인 트랜잭션 격리 수준 PR 리뷰',
      assignee: '나',
      due: '#42 · 5/28(수) 마감 · D-1',
      tags: [
        { label: '리뷰', tone: 'accent' },
        { label: '긴급', tone: 'danger' },
      ],
    },
    {
      title: 'Kafka dedup 테이블 마이그레이션 작성',
      assignee: '나',
      due: '#48 · 5/29(목) 마감 · D-2',
      tags: [
        { label: '개발', tone: 'success' },
        { label: '긴급', tone: 'danger' },
      ],
    },
    {
      title: '5/24 회의록 결정사항 정리 + 액션 아이템 등록',
      assignee: '나',
      due: '#51 · 5/30(금) 마감 · D-3',
      tags: [{ label: '문서', tone: 'info' }],
    },
    {
      title: '결제 실패 시나리오 단위 테스트 추가',
      assignee: '나',
      due: '#39 · 5/26 완료 · 2일 전',
      tags: [{ label: '테스트', tone: 'success' }],
    },
  ],
  activities: [
    {
      who: '박지호',
      action: '#42 주문 도메인 트랜잭션 격리 수준 PR 리뷰 요청',
      when: '1시간 전',
      kind: '작업',
    },
    {
      who: '최유나',
      action: '5/26 백엔드 회고 회의록 작성 완료 · 결정 4건',
      when: '3시간 전',
      kind: '회의록',
    },
    {
      who: '김수강',
      action: 'GitHub `encore-mart-backend` 메인 브랜치 PR #18 머지',
      when: '어제',
      kind: '산출물',
    },
    {
      who: '한지우',
      action: '#13 결제 콜백 타임아웃 발생 — P1 신규 이슈 등록',
      when: '2일 전',
      kind: '이슈',
    },
    {
      who: '박지호',
      action: '#39 결제 실패 시나리오 단위 테스트 추가 — 완료',
      when: '2일 전',
      kind: '작업',
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
      category: 'API 명세',
    },
    {
      title: 'ERD 설계 문서',
      meta: 'Wiki · 12분 전',
      status: { label: '초안', tone: 'warning' },
      category: '설계 문서',
    },
    {
      title: '중간 발표 자료',
      meta: 'PPTX · 8.4MB',
      status: { label: '검토', tone: 'accent' },
      category: '발표 자료',
    },
    {
      title: '배포 아키텍처',
      meta: 'Wiki · 어제',
      status: { label: '완료', tone: 'success' },
      category: '위키',
    },
    {
      title: '성능 테스트 결과',
      meta: 'CSV · 240KB',
      status: { label: '완료', tone: 'success' },
      category: '첨부 파일',
    },
    {
      title: 'README 정리',
      meta: 'Markdown · 2일 전',
      status: { label: '완료', tone: 'success' },
      category: '위키',
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
      memberId: 'pm-5',
      name: '김수강',
      role: '백엔드 · PM',
      kind: 'PM',
      avatarTone: 'accent',
    },
    {
      memberId: 'pm-1',
      name: '박지호',
      role: '풀스택 · 팀원',
      kind: '팀원',
      avatarTone: 'warning',
    },
    {
      memberId: 'pm-2',
      name: '최유나',
      role: '백엔드 · 팀원',
      kind: '팀원',
      avatarTone: 'info',
    },
    {
      memberId: 'pm-6',
      name: '한지우',
      role: '백엔드 · 팀원',
      kind: '팀원',
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
      label: '결제 실패율',
      before: '8.0%',
      after: '0.4%',
      delta: '-95%',
      good: true,
    },
    {
      label: 'API 응답 P95',
      before: '320ms',
      after: '145ms',
      delta: '-55%',
      good: true,
    },
    {
      label: '중복 처리/주',
      before: '7건',
      after: '0건',
      delta: '-100%',
      good: true,
    },
  ],
  stack: ['Java 17', 'Spring Boot', 'PostgreSQL', 'Apache Kafka', 'Docker'],
  peerDue: 'D-3',
  peerMyStatus: { label: '내 상태: 미제출', tone: 'warning' },
  peerTeamStatus: { label: '팀 제출 3/4', tone: 'info' },
  peerEvalEnabled: true,
  peerTargets: [
    {
      memberId: 'pm-1',
      name: '박지호',
      role: '풀스택',
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
      memberId: 'pm-2',
      name: '최유나',
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
      name: '한지우',
      role: '백엔드',
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
    { label: '트러블슈팅 연결', status: { label: '완료', tone: 'success' } },
    { label: '상호평가 제출 완료', status: { label: '완료', tone: 'success' } },
  ],
  certStatus: { label: '인증 완료', tone: 'success' },
  certInfo: {
    requestedAt: '2026-05-25',
    reviewer: '임수현 강사',
    eta: '2026-05-30',
  },
  certRecentChange: {
    label: '성과 지표 보정 요청',
    status: { label: '승인', tone: 'success' },
    date: '2026-05-28 승인 · 반영 완료',
  },
}
