import { http, HttpResponse } from 'msw'
import type { PeerHubData, PeerRepData, PeerTagData } from './types'

// 동료 평가 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// Figma 401:1586·402:1644·404:1719 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

const mockHub: PeerHubData = {
  stats: [
    {
      key: 'gaveTag',
      label: '부여한 PeerTag',
      value: '12',
      unit: '/23명',
      sub: '총 3가지 부여 · 평균 3.1건/인',
      tone: 'success',
    },
    {
      key: 'gaveRep',
      label: '부여한 5축 평가',
      value: '8',
      unit: '/23명',
      sub: '나머지 15명 · 평균 4.5/5.0',
      tone: 'accent',
    },
    {
      key: 'gotTag',
      label: '받은 PeerTag',
      value: '42',
      unit: '건',
      sub: '#논리적설득 12 · #문제해결왕 7',
      tone: 'info',
    },
    {
      key: 'gotRep',
      label: '받은 평판 평균',
      value: '4.6',
      unit: '/5.0',
      sub: '동료 12명 · 5축 평균',
      tone: 'brand',
    },
  ],
  tagProgress: { done: 12, total: 23, remaining: 11 },
  repProgress: { done: 8, total: 23, remaining: 15 },
  receivedReputation: [
    { key: '기술', score: 4.6, sub: 'PR 22 · 코드 리뷰 평균 4.6' },
    { key: '책임감', score: 4.8, sub: '리더십 평가 #1 · 동료 5인 일관' },
    { key: '소통', score: 4.5, sub: '#논리적설득 10회 · #코드리뷰 5회' },
    { key: '성장', score: 4.3, sub: '최근 8주 점수 가속 구간' },
    { key: '팀워크', score: 4.5, sub: 'Encore Mart 백엔드 4인 협업' },
  ],
}

const members: PeerTagData['members'] = [
  {
    id: 'm1',
    name: '이서연',
    role: '백엔드 · 3팀',
    avatarTone: 'success',
    status: 'editing',
    statusLabel: '선택 중 · 작성 중',
  },
  {
    id: 'm2',
    name: '박지호',
    role: '풀스택 · 1팀',
    avatarTone: 'warning',
    status: 'done',
    statusLabel: '부여 완료',
  },
  {
    id: 'm3',
    name: '최유나',
    role: '백엔드 · 2팀',
    avatarTone: 'info',
    status: 'todo',
    statusLabel: '미부여',
  },
  {
    id: 'm4',
    name: '김도현',
    role: 'DevOps · 1팀',
    avatarTone: 'accent',
    status: 'done',
    statusLabel: '부여 완료',
  },
  {
    id: 'm5',
    name: '정민서',
    role: '데이터 · 4팀',
    avatarTone: 'danger',
    status: 'todo',
    statusLabel: '미부여',
  },
  {
    id: 'm6',
    name: '한지우',
    role: '백엔드 · 3팀',
    avatarTone: 'success',
    status: 'done',
    statusLabel: '부여 완료',
  },
]

const mockTag: PeerTagData = {
  progress: { done: 12, total: 23 },
  members,
  maxTags: 5,
}

const mockRep: PeerRepData = {
  progress: { done: 8, total: 23 },
  target: {
    id: 'm1',
    name: '이서연',
    role: '백엔드 · 3팀',
    avatarTone: 'success',
    meta: '같은 프로젝트 Encore Mart에서 협업',
    badges: [
      { label: '함께 프로젝트 1건', tone: 'info' },
      { label: '코드 리뷰 5회', tone: 'accent' },
      { label: 'PeerTag 받음 #논리적설득', tone: 'success' },
    ],
    axes: [
      { key: '기술', desc: '문제 정의·구현 완성도', score: 5 },
      { key: '책임감', desc: '맡은 일에 대한 책임감과 마감 준수', score: 5 },
      { key: '소통', desc: '명확한 의사 전달과 경청', score: 4 },
      { key: '성장', desc: '학습 의지와 변화에 대한 적응', score: 4 },
      { key: '팀워크', desc: '협업 태도와 동료 지원', score: 5 },
    ],
    recommend: '매우 추천',
    comment:
      '디버깅 접근이 논리적이고 팀에 설명을 잘 해서 항상 도움이 됐어요. 꺼리 수준 결정 회의가 인상적이었음.',
  },
  roster: [
    { initial: '김', tone: 'brand', done: true },
    { initial: '이', tone: 'success', done: true },
    { initial: '박', tone: 'warning', done: true },
    { initial: '최', tone: 'info', done: true },
    { initial: '정', tone: 'danger', done: true },
    { initial: '한', tone: 'success', done: true },
    { initial: '오', tone: 'accent', done: true },
    { initial: '송', tone: 'brand', done: true },
    { initial: '윤', tone: 'info', done: false },
    { initial: '임', tone: 'info', done: false },
    { initial: '조', tone: 'info', done: false },
    { initial: '강', tone: 'info', done: false },
    { initial: '장', tone: 'info', done: false },
    { initial: '양', tone: 'info', done: false },
    { initial: '서', tone: 'info', done: false },
    { initial: '권', tone: 'info', done: false },
    { initial: '전', tone: 'info', done: false },
    { initial: '고', tone: 'info', done: false },
    { initial: '문', tone: 'info', done: false },
    { initial: '손', tone: 'info', done: false },
    { initial: '배', tone: 'info', done: false },
    { initial: '백', tone: 'info', done: false },
    { initial: '허', tone: 'info', done: false },
  ],
}

export const handlers = [
  http.get('/api/student/peer/hub', () => ok(mockHub)),
  http.get('/api/student/peer/tag', () => ok(mockTag)),
  http.get('/api/student/peer/reputation', () => ok(mockRep)),
]
