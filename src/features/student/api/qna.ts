import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { qnaKeys } from '../qna/queryKeys'
import { useQnaApiBase } from '../qna/useQnaBase'
import type {
  NewCommentInput,
  NewQuestionInput,
  QnaDetail,
  QnaListData,
} from '../qna/types'

// QnA 게시판 훅 — 수강생(/student/qna)과 운영(/admin/qna)이 같은 화면을 공유하므로
// 엔드포인트 base는 useQnaApiBase — 운영 마운트도 /instructor/qna 를 호출한다(admin 미러 삭제).
// 실 BE 연동(learning-service): 목록·상세·작성·답변·댓글·채택·삭제.
export function useQnaList() {
  const base = useQnaApiBase()
  return useQuery({
    queryKey: qnaKeys.list(),
    queryFn: () => apiClient.get<QnaListData>(base).then((r) => r.data),
  })
}

export function useQnaDetail(id: string) {
  const base = useQnaApiBase()
  return useQuery({
    queryKey: qnaKeys.detail(id),
    queryFn: () =>
      apiClient.get<QnaDetail>(`${base}/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

// 새 질문 작성(수강생 전용) — 성공 시 목록 무효화.
export function useCreateQuestion() {
  const base = useQnaApiBase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewQuestionInput & { authorName?: string }) =>
      apiClient.post<QnaDetail>(base, input).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 질문 수정(작성자만) — 성공 시 상세 캐시 즉시 교체 + 목록 무효화.
export function useUpdateQuestion(questionId: string) {
  const base = useQnaApiBase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewQuestionInput) =>
      apiClient
        .put<QnaDetail>(`${base}/${questionId}`, input)
        .then((r) => r.data),
    onSuccess: (detail) => {
      queryClient.setQueryData(qnaKeys.detail(questionId), detail)
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 답변 작성 — 성공 시 해당 질문 상세 캐시 갱신 + 목록(답변 수·상태) 무효화.
export function useCreateAnswer(questionId: string) {
  const base = useQnaApiBase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      content: string
      mentions: string[]
      authorName?: string
    }) =>
      apiClient
        .post<QnaDetail>(`${base}/${questionId}/answers`, input)
        .then((r) => r.data),
    onSuccess: (detail) => {
      queryClient.setQueryData(qnaKeys.detail(questionId), detail)
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 댓글 작성(답변 스레드, 2단계) — @멘션 포함. 상세 갱신 + 목록 무효화.
export function useCreateComment(questionId: string, answerId: string) {
  const base = useQnaApiBase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewCommentInput & { authorName?: string }) =>
      apiClient
        .post<QnaDetail>(
          `${base}/${questionId}/answers/${answerId}/comments`,
          input,
        )
        .then((r) => r.data),
    onSuccess: (detail) => {
      queryClient.setQueryData(qnaKeys.detail(questionId), detail)
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 답변 채택(질문 작성자만) — 질문을 '해결됨'으로 전환. 상세·목록 함께 갱신.
export function useAcceptAnswer(questionId: string) {
  const base = useQnaApiBase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answerId: string) =>
      apiClient
        .post<QnaDetail>(`${base}/${questionId}/answers/${answerId}/accept`)
        .then((r) => r.data),
    onSuccess: (detail) => {
      queryClient.setQueryData(qnaKeys.detail(questionId), detail)
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 질문 삭제(작성자만) — 답변·댓글 cascade. 성공 시 상세 캐시 제거 + 목록 무효화.
export function useDeleteQuestion() {
  const base = useQnaApiBase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) =>
      apiClient.delete<void>(`${base}/${questionId}`).then((r) => r.data),
    onSuccess: (_data, questionId) => {
      queryClient.removeQueries({ queryKey: qnaKeys.detail(questionId) })
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 답변 고쳐 쓰기(작성자만) — 갱신된 상세 반환. 알림은 다시 가지 않는다(BE).
export function useUpdateAnswer(questionId: string) {
  const base = useQnaApiBase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      answerId,
      input,
    }: {
      answerId: string
      input: NewCommentInput
    }) =>
      apiClient
        .put<QnaDetail>(`${base}/${questionId}/answers/${answerId}`, input)
        .then((r) => r.data),
    onSuccess: (detail) => {
      queryClient.setQueryData(qnaKeys.detail(questionId), detail)
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 댓글 고쳐 쓰기(작성자만) — 갱신된 상세 반환.
export function useUpdateComment(questionId: string, answerId: string) {
  const base = useQnaApiBase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      commentId,
      input,
    }: {
      commentId: string
      input: NewCommentInput
    }) =>
      apiClient
        .put<QnaDetail>(
          `${base}/${questionId}/answers/${answerId}/comments/${commentId}`,
          input,
        )
        .then((r) => r.data),
    onSuccess: (detail) => {
      queryClient.setQueryData(qnaKeys.detail(questionId), detail)
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 답변 삭제(작성자만) — 댓글 cascade. 갱신된 상세 반환.
export function useDeleteAnswer(questionId: string) {
  const base = useQnaApiBase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answerId: string) =>
      apiClient
        .delete<QnaDetail>(`${base}/${questionId}/answers/${answerId}`)
        .then((r) => r.data),
    onSuccess: (detail) => {
      queryClient.setQueryData(qnaKeys.detail(questionId), detail)
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}

// 댓글 삭제(작성자만) — 갱신된 상세 반환.
export function useDeleteComment(questionId: string, answerId: string) {
  const base = useQnaApiBase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) =>
      apiClient
        .delete<QnaDetail>(
          `${base}/${questionId}/answers/${answerId}/comments/${commentId}`,
        )
        .then((r) => r.data),
    onSuccess: (detail) => {
      queryClient.setQueryData(qnaKeys.detail(questionId), detail)
      queryClient.invalidateQueries({ queryKey: qnaKeys.list() })
    },
  })
}
