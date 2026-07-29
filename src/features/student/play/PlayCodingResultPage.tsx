import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { PlayResultView } from './PlayResultView'
import { recentPlays } from './history'
import { fmtTime } from './shared'
import type { CodingTestResult } from './types'

// PLAY 코딩 테스트 결과 (/student/play/coding/result) — Figma 4917:7092 · 통일 틀(PlayResultView).
export default function PlayCodingResultPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const result = (state as { result?: CodingTestResult } | null)?.result
  usePageHeader(
    '코딩 테스트 — 결과',
    '코딩 테스트 최종 결과입니다. 해결·통과율·점수가 랭킹에 반영됩니다.',
  )

  if (!result) {
    return (
      <div className="p-8">
        <Empty
          title="표시할 결과가 없어요"
          description="코딩 테스트를 플레이하면 종료 후 결과가 여기에 표시됩니다."
          action={
            <Button onClick={() => navigate('/student/play/coding')}>
              코딩 테스트 시작
            </Button>
          }
        />
      </div>
    )
  }

  const passRate = result.total
    ? Math.round((result.solved / result.total) * 100)
    : 0
  const allSolved = result.solved === result.total

  // 문제별 통과 리뷰(통일 틀 안에 슬림하게).
  const extra = (
    <div className="flex flex-col gap-2">
      <span className="text-fg-subtle text-[12px]">
        문제별 통과 — 해결 {result.solved} · 미해결{' '}
        {result.total - result.solved}
      </span>
      <div className="flex flex-col gap-2">
        {result.results.map((r) => (
          <div
            key={r.index}
            className="border-border flex flex-col gap-2 rounded-xl border p-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white',
                  r.solved ? 'bg-brand' : 'bg-danger',
                )}
              >
                {r.index}
              </span>
              <span className="text-fg flex-1 text-[12px] font-semibold">
                {r.title}
              </span>
              <span className="text-fg-subtle text-[11px]">
                {r.points.toLocaleString()}점 · 시도 {r.attempts}회
              </span>
              <span
                className={cn(
                  'text-[11px] font-bold',
                  r.solved ? 'text-success' : 'text-danger',
                )}
              >
                {r.solved ? '통과' : '미해결'}
              </span>
            </div>
            <div className="bg-surface-muted/50 flex items-start gap-2 rounded-lg px-3 py-2">
              <span className="text-fg-subtle shrink-0 text-[11px] font-bold">
                정답
              </span>
              <span className="text-fg font-mono text-[11px] break-all whitespace-pre-wrap">
                {r.solution}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <PlayResultView
      stats={[
        {
          label: '풀이 시간',
          value: fmtTime(result.elapsedSec),
          sub: `제한 ${fmtTime(result.durationSec)}`,
        },
        {
          label: '해결 문제',
          value: `${result.solved} / ${result.total}`,
          sub: `미해결 ${result.total - result.solved}`,
        },
        {
          label: '통과율',
          value: `${passRate}%`,
          sub: `시도 ${result.attempts}회`,
        },
        {
          label: 'Score',
          value: result.score.toLocaleString(),
          sub: '난이도별 배점',
        },
      ]}
      cardTitle="결과 요약"
      badge={
        allSolved
          ? { label: '전체 해결', tone: 'success' }
          : { label: '기록 저장', tone: 'brand' }
      }
      message={
        allSolved
          ? `${result.language} ${result.total}문제를 모두 해결했어요! 난이도별 배점이 점수에 반영됩니다.\n같은 언어로 다시 도전하거나 다른 언어에 도전해 보세요.`
          : `${result.language} ${result.total}문제 중 ${result.solved}문제를 해결했어요. 난이도별 배점과 시도 횟수가 기록됩니다.\n미해결 문제는 다시 도전해 점수를 높여보세요.`
      }
      breakdown={[
        { label: '해결 문제', value: `${result.solved} / ${result.total}` },
        { label: '통과율', value: `${passRate}%` },
        { label: '총 제출', value: `${result.attempts}회` },
      ]}
      extra={extra}
      infoTitle="테스트 정보"
      info={[
        { label: '테스트 ID', value: result.testId },
        { label: '언어', value: result.language },
        { label: '배점 기준', value: '난이도별 차등' },
        { label: '계산 기준', value: '서버 재채점' },
        { label: '보상', value: '랭킹 반영 후 지급' },
      ]}
      recentTitle="최근 코딩 테스트 기록"
      recent={recentPlays('coding')}
      primary={{ label: '다시 플레이', to: '/student/play/coding' }}
    />
  )
}
