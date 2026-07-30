import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { playKeys } from '../play/queryKeys'
import type {
  CodingTest,
  PlayOverview,
  QuizBattle,
  TypingSession,
} from '../play/types'

// PLAY 훅 — 엔드포인트가 /student/* 라 학생 feature 소유. baseURL /api 라 경로 앞 /api 생략.
export function usePlayOverview() {
  return useQuery({
    queryKey: playKeys.overview(),
    queryFn: () =>
      apiClient.get<PlayOverview>('/student/play').then((r) => r.data),
  })
}

export function usePlayTyping() {
  return useQuery({
    queryKey: playKeys.typing(),
    queryFn: () =>
      apiClient.get<TypingSession>('/student/play/typing').then((r) => r.data),
  })
}

/** 타자 결과 제출 바디 — 클라이언트 측정값(서버는 범위 검증 후 저장·집계). */
export interface TypingResultSubmission {
  promptName: string
  durationSec: number
  elapsedSec: number
  cpm: number
  wpm: number
  accuracy: number
  typos: number
  backspaces: number
  comboBonus: number
  score: number
}

/** 제출 응답 — 서버 판정(개인 최고 갱신 여부·기수 랭크). */
export interface TypingResultReceipt {
  best: boolean
  personalBest: number
  rank: number
}

// 타자 결과 제출 — 성공 시 오버뷰(기록·랭킹)·타자 세션(개인 최고)을 무효화한다.
// 예전에는 결과가 localStorage에만 남아 서버 기록·랭킹이 비어 있었다.
export function useSubmitTypingResult() {
  const queryClient = useQueryClient()
  return useMutation<TypingResultReceipt, Error, TypingResultSubmission>({
    mutationFn: (body) =>
      apiClient
        .post<TypingResultReceipt>('/student/play/typing/results', body)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playKeys.overview() })
      void queryClient.invalidateQueries({ queryKey: playKeys.typing() })
    },
  })
}

export function usePlayCoding() {
  return useQuery({
    queryKey: playKeys.coding(),
    queryFn: () =>
      apiClient.get<CodingTest>('/student/play/coding').then((r) => r.data),
  })
}

export function usePlayQuizBattle() {
  return useQuery({
    queryKey: playKeys.quiz(),
    queryFn: () =>
      apiClient.get<QuizBattle>('/student/play/quiz').then((r) => r.data),
  })
}
