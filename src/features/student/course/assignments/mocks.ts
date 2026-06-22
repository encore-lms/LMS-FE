import { http, HttpResponse } from 'msw'
import type { AssignmentDetail, AssignmentListItem } from './types'

// 과제/실습 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// 데이터는 Figma 과제/실습 목록(407:1785) 시안 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

const mockAssignments: AssignmentListItem[] = [
  {
    id: 'as1',
    title: 'JPA 연관관계 매핑 실습',
    subject: '백엔드 심화',
    status: 'not_submitted',
    dueLabel: '마감 D-2',
    dueTone: 'soon',
    evaluationType: '피드백',
  },
  {
    id: 'as2',
    title: '주문 도메인 REST API 구현',
    subject: '백엔드 심화',
    status: 'submitted',
    dueLabel: '마감 D-5',
    dueTone: 'normal',
    evaluationType: '피드백',
  },
  {
    id: 'as3',
    title: '단위 테스트 작성 과제',
    subject: '백엔드 기초',
    status: 'reviewed',
    dueLabel: '마감 5/9 종료',
    dueTone: 'ended',
    evaluationType: '피드백',
    hasFeedback: true,
  },
  {
    id: 'as4',
    title: 'Docker 컨테이너 배포 실습',
    subject: '인프라',
    status: 'not_submitted',
    dueLabel: '마감 D-1',
    dueTone: 'soon',
    evaluationType: '피드백',
  },
  {
    id: 'as5',
    title: '트랜잭션 격리 수준 정리',
    subject: '백엔드 심화',
    status: 'reviewed',
    dueLabel: '마감 5/7 종료',
    dueTone: 'ended',
    evaluationType: '피드백',
    hasFeedback: true,
  },
  {
    id: 'as6',
    title: '게시판 페이징 API 구현',
    subject: '백엔드 심화',
    status: 'not_submitted',
    dueLabel: '마감 D-3',
    dueTone: 'soon',
    evaluationType: '피드백',
  },
  {
    id: 'as7',
    title: 'Spring Security 로그인 구현',
    subject: '백엔드 심화',
    status: 'submitted',
    dueLabel: '마감 D-6',
    dueTone: 'normal',
    evaluationType: '피드백',
  },
  {
    id: 'as8',
    title: 'JUnit 통합 테스트 작성',
    subject: '백엔드 기초',
    status: 'reviewed',
    dueLabel: '마감 5/6 종료',
    dueTone: 'ended',
    evaluationType: '피드백',
    hasFeedback: true,
  },
  {
    id: 'as9',
    title: 'Redis 캐시 적용 실습',
    subject: '인프라',
    status: 'not_submitted',
    dueLabel: '마감 D-4',
    dueTone: 'soon',
    evaluationType: '피드백',
  },
  {
    id: 'as10',
    title: 'QueryDSL 동적 검색 구현',
    subject: '백엔드 심화',
    status: 'submitted',
    dueLabel: '마감 D-7',
    dueTone: 'normal',
    evaluationType: '피드백',
  },
  {
    id: 'as11',
    title: 'ERD 설계 과제',
    subject: '백엔드 기초',
    status: 'reviewed',
    dueLabel: '마감 5/4 종료',
    dueTone: 'ended',
    evaluationType: '피드백',
    hasFeedback: true,
  },
  {
    id: 'as12',
    title: 'CI 파이프라인 구성',
    subject: '인프라',
    status: 'not_submitted',
    dueLabel: '마감 D-9',
    dueTone: 'normal',
    evaluationType: '피드백',
  },
  {
    id: 'as13',
    title: '예외 처리 표준화',
    subject: '백엔드 심화',
    status: 'submitted',
    dueLabel: '마감 D-8',
    dueTone: 'normal',
    evaluationType: '피드백',
  },
  {
    id: 'as14',
    title: 'API 문서화 (Swagger)',
    subject: '백엔드 기초',
    status: 'reviewed',
    dueLabel: '마감 5/2 종료',
    dueTone: 'ended',
    evaluationType: '피드백',
    hasFeedback: true,
  },
  {
    id: 'as15',
    title: '대용량 배치 처리 실습',
    subject: '백엔드 심화',
    status: 'not_submitted',
    dueLabel: '마감 D-5',
    dueTone: 'soon',
    evaluationType: '피드백',
  },
]

// 상세는 목록 항목 + 제출 폼 컨텍스트. 요청 id로 목록에서 찾고, 없으면 기본값으로 합성.
function detailFor(id: string): AssignmentDetail {
  const item = mockAssignments.find((a) => a.id === id) ?? mockAssignments[0]
  const submitted = item.status !== 'not_submitted'
  return {
    id,
    title: item.title,
    description:
      'Spring Boot 게시판 도메인에 Member-Post-Comment 연관관계를 설계하고, N+1 조회를 방지하는 fetch 전략을 함께 정리합니다.',
    subject: item.subject,
    status: item.status,
    dueAtLabel: '2026-05-24 23:59',
    dueBadge: item.dueTone === 'ended' ? '종료' : 'D-2',
    dueTone: item.dueTone,
    evaluationType: item.evaluationType,
    draft: submitted
      ? {
          body: '구현 범위·실행 방법·설계 의도를 정리해 제출했습니다.',
          url: 'https://github.com/lee/jpa-mapping-practice/pull/12',
          assets: ['submission-note.md', 'ERD 캡처.png'],
        }
      : null,
    hasHistory: submitted,
    submittedAtLabel: submitted ? '2026-05-22 14:18' : undefined,
    feedbackExample: {
      statusLabel: '검토 완료',
      evaluationType: '피드백',
      feedback:
        '연관관계 방향 선택 근거가 명확합니다. 다만 댓글 삭제 정책의 cascade 범위는 한 번 더 분리해 주세요.',
    },
  }
}

export const handlers = [
  http.get('/api/student/course/assignments', () =>
    ok<AssignmentListItem[]>(mockAssignments),
  ),
  http.get('/api/student/course/assignments/:assignmentId', ({ params }) =>
    ok<AssignmentDetail>(detailFor(String(params.assignmentId))),
  ),
]
