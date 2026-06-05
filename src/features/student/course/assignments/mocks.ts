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
    evaluationType: '피드백제',
  },
  {
    id: 'as2',
    title: '주문 도메인 REST API 구현',
    subject: '백엔드 심화',
    status: 'submitted',
    dueLabel: '마감 D-5',
    dueTone: 'normal',
    evaluationType: '피드백제',
  },
  {
    id: 'as3',
    title: '단위 테스트 작성 과제',
    subject: '백엔드 기초',
    status: 'reviewed',
    dueLabel: '마감 5/9 종료',
    dueTone: 'ended',
    evaluationType: '피드백제',
    hasFeedback: true,
  },
  {
    id: 'as4',
    title: 'Docker 컨테이너 배포 실습',
    subject: '인프라',
    status: 'not_submitted',
    dueLabel: '마감 D-1',
    dueTone: 'soon',
    evaluationType: '완료 확인제',
  },
  {
    id: 'as5',
    title: '트랜잭션 격리 수준 정리',
    subject: '백엔드 심화',
    status: 'reviewed',
    dueLabel: '마감 5/7 종료',
    dueTone: 'ended',
    evaluationType: '완료 확인제',
    hasFeedback: true,
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
    feedbackExample: {
      statusLabel: '검토 완료',
      evaluationType: '피드백제',
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
