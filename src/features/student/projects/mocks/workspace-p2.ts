// 워크스페이스 mock(p2) — 실시간 채팅 서버(검토 중 팀 프로젝트).
import type { WorkspaceData } from '../types'
import { mockWorkspace } from './workspace-p1'

// 실시간 채팅 서버(p2) — 검토 중 팀 프로젝트. 식별·인물 관련 필드만 재정의하고
// 캘린더·역할 정책 등 일반 구조는 p1에서 재사용.
export const mockWorkspaceP2: WorkspaceData = {
  ...mockWorkspace,
  id: 'p2',
  status: 'reviewing',
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
      id: 'task-mock-1',
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
      category: 'API 명세',
    },
    {
      title: '부하 테스트 결과',
      meta: 'CSV · 180KB',
      status: { label: '완료', tone: 'success' },
      category: '첨부 파일',
    },
    {
      title: '배포 아키텍처 (Nginx)',
      meta: 'Wiki · 3일 전',
      status: { label: '완료', tone: 'success' },
      category: '위키',
    },
    {
      title: '인증 발표 자료',
      meta: 'PPTX · 6.1MB',
      status: { label: '검토', tone: 'accent' },
      category: '발표 자료',
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
      memberId: 'pm-3',
      name: '예칼',
      role: 'PM · 백엔드',
      kind: 'PM',
      avatarTone: 'accent',
    },
    {
      memberId: 'pm-7',
      name: '정해린',
      role: 'WebSocket · Redis',
      kind: '팀원',
      avatarTone: 'info',
    },
    {
      memberId: 'pm-4',
      name: '오세훈',
      role: '인프라 · Nginx',
      kind: '팀원',
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
  isOwner: true,
  peerDue: '마감 종료',
  peerMyStatus: { label: '내 상태: 제출 완료', tone: 'success' },
  peerTeamStatus: { label: '팀 제출 3/3', tone: 'success' },
  peerEvalEnabled: true,
  peerTargets: [
    {
      memberId: 'pm-3',
      name: '예칼',
      role: 'PM',
      axes: [
        { key: '기술/기술기여', score: 4.5 },
        { key: '소통·협업·팀워크', score: 4.5 },
        { key: '문제해결', score: 4.5 },
        { key: '책임감', score: 5.0 },
      ],
      tags: [
        { label: '리더십', tone: 'accent' },
        { label: '일정 준수', tone: 'info' },
      ],
    },
    {
      memberId: 'pm-4',
      name: '오세훈',
      role: '인프라',
      axes: [
        { key: '기술/기술기여', score: 4.5 },
        { key: '소통·협업·팀워크', score: 4.0 },
        { key: '문제해결', score: 4.5 },
        { key: '책임감', score: 4.5 },
      ],
      tags: [
        { label: '문제해결', tone: 'brand' },
        { label: '기술기여', tone: 'accent' },
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
  certInfo: {
    requestedAt: '2026-04-23',
    reviewer: '감사팀 · 임수현 강사',
    eta: 'D+9 (감사 검토 중)',
  },
  certRecentChange: {
    label: '발표 자료 보완 요청',
    status: { label: '검토 중', tone: 'warning' },
    date: '2026-04-26 제출 · 감사 검토 중',
  },
}
