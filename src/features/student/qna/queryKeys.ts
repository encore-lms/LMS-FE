// QnA 게시판 쿼리 키 — 기능 로컬.
export const qnaKeys = {
  all: ['student', 'qna'] as const,
  list: () => [...qnaKeys.all, 'list'] as const,
  detail: (id: string) => [...qnaKeys.all, 'detail', id] as const,
}
