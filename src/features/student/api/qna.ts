import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { qnaKeys } from '../qna/queryKeys'
import type {
  NewCommentInput,
  NewQuestionInput,
  QnaDetail,
  QnaListData,
} from '../qna/types'

// QnA 게시판 훅 — 엔드포인트가 /student/* 라 학생 feature 소유. baseURL /api 라 경로 앞 /api 생략.
// NOTE: 실 BE에는 QnA API가 없다(게시판 폐기). VITE_API_BASE_URL을 비운 mock 모드에서만 동작.
export function useQnaList() {
  return useQuery({
    queryKey: qnaKeys.list(),
    queryFn: () =>
      apiClient.get<QnaListData>('/student/qna').then((r) => r.data),
  })
}

export function useQnaDetail(id: string) {
  return useQuery({
    queryKey: qnaKeys.detail(id),
    queryFn: () =>
      apiClient.get<QnaDetail>(`/student/qna/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

// 새 질문 작성 — 성공 시 목록 무효화(mock이 메모리에 누적하므로 재요청이 신규 질문을 반영).
export function useCreateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewQuestionInput & { authorName?: string }) =>
      apiClient.post<QnaDetail>('/student/qna', input).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 답변 작성 — 성공 시 해당 질문 상세 캐시 갱신 + 목록(답변 수·상태) 무효화.
export function useCreateAnswer(questionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { content: string; authorName?: string }) =>
      apiClient
        .post<QnaDetail>(`/student/qna/${questionId}/answers`, input)
        .then((r) => r.data),
    onSuccess: (detail) => {
      queryClient.setQueryData(qnaKeys.detail(questionId), detail)
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 댓글 작성(답변 스레드, 2단계) — @멘션 포함. 상세 갱신 + 목록 무효화.
export function useCreateComment(questionId: string, answerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewCommentInput & { authorName?: string }) =>
      apiClient
        .post<QnaDetail>(
          `/student/qna/${questionId}/answers/${answerId}/comments`,
          input,
        )
        .then((r) => r.data),
    onSuccess: (detail) => {
      queryClient.setQueryData(qnaKeys.detail(questionId), detail)
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 답변 채택 — 질문을 '해결됨'으로 전환. 상세·목록 함께 갱신.
export function useAcceptAnswer(questionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answerId: string) =>
      apiClient
        .post<QnaDetail>(
          `/student/qna/${questionId}/answers/${answerId}/accept`,
        )
        .then((r) => r.data),
    onSuccess: (detail) => {
      queryClient.setQueryData(qnaKeys.detail(questionId), detail)
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}
