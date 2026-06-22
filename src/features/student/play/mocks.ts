import { http, HttpResponse } from 'msw'
import type { PlayOverview, TypingSession } from './types'

// PLAY mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// Figma 게임 선택(418:2172)·타자 게임(428:3015) 시안 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

const mockOverview: PlayOverview = {
  stats: [
    { label: '이번 주 플레이', value: '8회', sub: '타자 게임 참여' },
    { label: '최고 점수', value: '92,400', sub: '사내 계산 기준' },
    { label: '랭킹', value: '12위', sub: '백엔드 부트캠프 3기' },
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
      name: '코딩 스피드',
      desc: '짧은 코드 조각을 완성하는 게임입니다. 현재 과정에서는 비활성화되어 있습니다.',
      status: 'soon',
    },
    {
      key: 'cs-quiz',
      name: 'CS 퀴즈 배틀',
      desc: '기초 CS 문항을 제한 시간 안에 푸는 게임입니다. 추후 확장형 솔루션입니다.',
      status: 'soon',
    },
  ],
  records: [
    {
      when: '오늘 14:16',
      game: '타자 게임',
      detail: '612타 · 97.2%',
      score: '92,400',
    },
    {
      when: '어제 18:45',
      game: '타자 게임',
      detail: '588타 · 96.8%',
      score: '88,100',
    },
    {
      when: '5/12 11:20',
      game: '타자 게임',
      detail: '560타 · 95.9%',
      score: '84,800',
    },
    {
      when: '5/10 16:05',
      game: '타자 게임',
      detail: '541타 · 96.1%',
      score: '81,200',
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
    { label: '남은 시간', value: '02:30', sub: '세션 진행 중' },
    { label: '현재 타수', value: '486타', sub: '실시간 입력 기준' },
    { label: '정확도', value: '96.4%', sub: '오타 7회' },
    { label: '예상 점수', value: '78,200', sub: '제출 시 서버 재계산' },
  ],
  level: '중급 · 450자',
  text: '동시성 제어는 공유 자원에 대한 접근 순서를 명확히 정의하는 과정입니다. 여러 요청이 동시에 같은 데이터를 변경할 때는 트랜잭션 경계와 잠금 전략을 신중하게 선택해야 합니다.',
  sessionId: 'GS-20260515-018',
  promptName: 'Java Stream API',
  basis: '서버 재계산',
  reward: '랭킹 반영 후 지급',
  durationSec: 150,
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

export const handlers = [
  http.get('/api/student/play', () => ok(mockOverview)),
  http.get('/api/student/play/typing', () => ok(mockTyping)),
]
