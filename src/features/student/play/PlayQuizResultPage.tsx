import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { PlayResultView } from './PlayResultView'
import { fmtTime } from './shared'
import type { QuizBattleResult } from './types'

// PLAY CS 퀴즈 배틀 결과 (/student/play/quiz/result) — Figma 4925:7361 · 통일 틀(PlayResultView).
export default function PlayQuizResultPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const result = (state as { result?: QuizBattleResult } | null)?.result
  usePageHeader(
    'CS 퀴즈 배틀 — 결과',
    '최종 정답 수와 콤보로 산정된 배틀 결과입니다. 서버 재계산 기준으로 랭킹에 반영됩니다.',
  )

  if (!result) {
    return (
      <div className="p-8">
        <Empty
          title="표시할 결과가 없어요"
          description="CS 퀴즈 배틀을 플레이하면 종료 후 결과가 여기에 표시됩니다."
          action={
            <Button onClick={() => navigate('/student/play/quiz')}>
              CS 퀴즈 배틀 시작
            </Button>
          }
        />
      </div>
    )
  }

  const accuracy = Math.round((result.correct / result.total) * 100)
  const diff = Math.abs(result.myScore - result.rivalScore).toLocaleString()

  // 게임별 추가 영역 — 문제별 정오(통일 틀 안에 슬림하게).
  const extra = (
    <div className="flex flex-col gap-2">
      <span className="text-fg-subtle text-[12px]">
        문제별 정오 — 정답 {result.correct} · 오답{' '}
        {result.total - result.correct}
      </span>
      <div className="flex flex-wrap gap-2.5">
        {result.reviews.map((r) => (
          <span
            key={r.index}
            title={r.correct ? '정답' : '오답'}
            className={cn(
              'flex size-[30px] items-center justify-center rounded-full text-[12px] font-bold text-white',
              r.correct ? 'bg-brand' : 'bg-danger',
            )}
          >
            {r.index}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <PlayResultView
      stats={[
        {
          label: '플레이 시간',
          value: fmtTime(result.elapsedSec),
          sub: `${result.total}문제`,
        },
        { label: '콤보', value: `×${result.maxCombo}`, sub: '최대 콤보' },
        {
          label: '맞은 문제',
          value: `${result.correct} / ${result.total}`,
          sub: `오답 ${result.total - result.correct}`,
        },
        {
          label: 'Score',
          value: result.myScore.toLocaleString(),
          sub: result.win ? '승리 · 기수 7위' : '패배 · 기수 12위',
        },
      ]}
      cardTitle="배틀 결과"
      badge={
        result.win
          ? { label: '승리', tone: 'success' }
          : { label: '패배', tone: 'danger' }
      }
      message={
        result.win
          ? `${result.total}문제 중 ${result.correct}문제를 맞혀 ${result.rivalName}을(를) ${diff}점 차로 눌렀어요!\n최대 콤보 ×${result.maxCombo} 보너스가 점수에 반영됐습니다.`
          : `아쉽게 ${result.rivalName}에게 ${diff}점 차로 졌어요.\n콤보를 더 길게 이어가면 다음엔 역전할 수 있어요.`
      }
      breakdown={[
        { label: '정답', value: `${result.correct} / ${result.total}` },
        { label: '최대 콤보', value: `×${result.maxCombo}` },
        { label: '명중률', value: `${accuracy}%` },
      ]}
      extra={extra}
      infoTitle="배틀 정보"
      info={[
        { label: '배틀 ID', value: result.battleId },
        { label: '상대', value: result.rivalName },
        { label: '카테고리', value: result.category },
        { label: '내 점수', value: result.myScore.toLocaleString() },
        { label: '상대 점수', value: result.rivalScore.toLocaleString() },
        { label: '보상', value: '랭킹 반영 후 지급' },
      ]}
      recentTitle="최종 스코어보드"
      recent={[
        {
          title: '나 (김민준)',
          detail: `정답 ${result.correct} · 콤보 ×${result.maxCombo} · ${result.myScore.toLocaleString()}점${result.win ? ' · 승' : ''}`,
          me: true,
        },
        {
          title: result.rivalName,
          detail: `정답 ${result.rivalCorrect} · ${result.rivalScore.toLocaleString()}점`,
        },
        {
          title: '승패',
          detail: `${result.win ? '승리' : '패배'} · 기수 ${result.win ? '7' : '12'}위`,
        },
      ]}
      primary={{ label: '다시 도전', to: '/student/play/quiz' }}
    />
  )
}
