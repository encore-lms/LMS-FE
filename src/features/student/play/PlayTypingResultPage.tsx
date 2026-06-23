import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { PlayResultView } from './PlayResultView'
import { recentPlays } from './history'
import { fmtTime } from './shared'
import type { TypingResult } from './types'

// PLAY 타자 게임 결과 (/student/play/typing/result) — Figma 4925:7266 · 통일 틀(PlayResultView).
export default function PlayTypingResultPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const result = (state as { result?: TypingResult } | null)?.result
  usePageHeader(
    '타자 게임 — 결과',
    '서버가 세션 원본을 재계산한 최종 결과입니다. 점수·정확도는 저장 후 랭킹에 반영됩니다.',
  )

  if (!result) {
    return (
      <div className="p-8">
        <Empty
          title="표시할 결과가 없어요"
          description="타자 게임을 플레이하면 완료 후 결과가 여기에 표시됩니다."
          action={
            <Button onClick={() => navigate('/student/play/typing')}>
              타자 게임 시작
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <PlayResultView
      stats={[
        {
          label: '완성 시간',
          value: fmtTime(result.elapsedSec),
          sub: `제한 ${fmtTime(result.durationSec)}`,
        },
        { label: 'CPM', value: String(result.cpm), sub: `WPM ${result.wpm}` },
        {
          label: '정확도',
          value: `${result.accuracy.toFixed(1)}%`,
          sub: `오타 ${result.typos}회`,
        },
        {
          label: 'Score',
          value: result.score.toLocaleString(),
          sub: result.best ? '개인 최고 기록' : '기수 랭킹 반영',
        },
      ]}
      cardTitle="결과 요약"
      badge={
        result.best
          ? { label: '최고 기록 경신', tone: 'success' }
          : { label: '기록 저장', tone: 'brand' }
      }
      message={
        result.best
          ? '정확하게 입력했어요! 이번 세션이 개인 최고 기록이에요.\n저장 후 랭킹에 반영되며, 같은 제시문으로 다시 도전할 수 있어요.'
          : `세션을 마쳤어요. 정확도 ${result.accuracy.toFixed(1)}% · ${result.cpm}타 기록이 저장됩니다.\n같은 제시문으로 다시 도전해 기록을 높여보세요.`
      }
      breakdown={[
        { label: '정확 타수', value: `${result.cpm}타` },
        { label: '백스페이스', value: `${result.backspaces}회` },
        {
          label: '콤보 보너스',
          value: `+${result.comboBonus.toLocaleString()}`,
        },
      ]}
      infoTitle="세션 정보"
      info={[
        { label: '세션 ID', value: result.sessionId },
        { label: '제시문', value: result.promptName },
        { label: '계산 기준', value: '서버 재계산' },
        { label: '보상', value: '랭킹 반영 후 지급' },
      ]}
      recentTitle="최근 타자 게임 기록"
      recent={recentPlays('typing')}
      primary={{ label: '다시 플레이', to: '/student/play/typing' }}
    />
  )
}
