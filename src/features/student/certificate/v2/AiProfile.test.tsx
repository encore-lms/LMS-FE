import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AiPersona, AiProfile as AiProfileData } from '../ai'
import { AiProfile } from './AiProfile'

const profile: AiProfileData = {
  rows: [
    {
      label: '업무',
      value: '체계형',
      description:
        '요구사항 정리부터 배포 문서·시연까지 이어 맡으며, 코드 리뷰와 문제 해결 근거가 반복 확인됩니다.',
      dimensions: [
        {
          key: 'STRUCTURING',
          label: '구조화',
          level: 'HIGH',
          score: 75,
          calculation: [
            '설계·정리 업무 프로젝트 3/4개 = 75점 × 45%',
            '구조화 관련 상호평가 4/8건 = 50점 × 30%',
          ],
        },
        {
          key: 'EXECUTION',
          label: '실행·완결',
          level: 'MID',
          score: 62.5,
          calculation: ['완료 수행업무 5/8건 = 62.5점 × 60%'],
        },
        {
          key: 'VERIFICATION',
          label: '검증·정리',
          level: 'HIGH',
          score: 72,
          calculation: ['인증 트러블슈팅 2/2건 = 100점 × 40%'],
        },
      ],
      evidence: ['인증 완료 트러블슈팅 2건'],
      confidence: 'MEDIUM',
      limitations: ['완료 시각 미수집'],
    },
    { label: '리더십', value: '서포터형' },
    {
      label: '학습',
      value: '꾸준형',
      dimensions: [
        { key: 'IMPROVEMENT', label: '향상도', level: 'MID' },
        { key: 'RETENTION', label: '숙련유지도', level: 'NOT_READY' },
        { key: 'PERSISTENCE', label: '학습지속성', level: 'HIGH' },
      ],
    },
    { label: '소통', value: '논리설명형' },
    {
      label: '기술',
      value: '백엔드 심화형',
      evidence: [
        '내부 인증 성취도 평가·CS 평가와 외부 인증 코딩테스트 근거를 함께 확인함',
      ],
      confidence: 'HIGH',
    },
  ],
  summary: '요약',
  strengths: '강점',
  growth: '성장',
}

const personas: AiPersona[] = [
  {
    rank: 1,
    title: '운영 근거를 쌓는 클라우드 운영형',
    subtitle:
      '개인 담당 과업과 인증된 문제해결을 함께 확인해 클라우드·인프라 방향의 경험이 드러납니다.',
    baseCategory: 'DevOps·인프라',
    fitScore: 53.3,
    confidence: 'HIGH',
    components: {
      roleAchievement: 50,
      verifiedProblemSolving: 60,
      personalContribution: 70,
      crossCheckedProject: 30,
      declaredInterest: 20,
    },
    evidence: [
      '배포 과업을 개인 담당 범위로 수행함',
      '인증된 인프라 문제를 해결함',
    ],
    limitations: ['팀 기술스택은 개인 과업으로 교차 확인함'],
  },
]

describe('AiProfile', () => {
  it('업무 유형과 결정 차원·근거를 표시한다', () => {
    const { container } = render(<AiProfile profile={profile} personas={[]} />)

    expect(screen.getByText('체계형')).toBeInTheDocument()
    expect(screen.getByText('근거 충분도 보통')).toBeInTheDocument()
    expect(
      screen.getByText('구조화 높음 · 실행·완결 보통 · 검증·정리 높음'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('향상도 보통 · 숙련유지도 산출 전 · 학습지속성 높음'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '업무 분석 근거 보기' }),
    ).toBeInTheDocument()
    expect(screen.getByText('업무 분석 근거')).toBeInTheDocument()
    expect(screen.getAllByText('사용 데이터').length).toBeGreaterThan(0)
    expect(screen.getAllByText('판단 근거').length).toBeGreaterThan(0)
    expect(screen.getAllByText('계산 흐름').length).toBeGreaterThan(0)
    expect(screen.getAllByText('결과').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/프로젝트 참여 정보, 프로젝트 역할 입력/),
    ).toBeInTheDocument()
    expect(
      screen.getByText('설계·정리 업무 프로젝트 3/4개 = 75점 × 45%'),
    ).toBeInTheDocument()
    expect(screen.getByText('합계 75점 · 70점 이상 → 3칸')).toBeInTheDocument()
    expect(screen.getByText('합계 62.5점 · 45~69점 → 2칸')).toBeInTheDocument()
    expect(screen.getByText(/인증 완료 트러블슈팅 2건/)).toBeInTheDocument()
    expect(screen.getByText(/제한: 완료 시각 미수집/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'PROFILE SUMMARY 분석 근거 보기' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '기술 분석 근거 보기' }),
    ).toBeInTheDocument()
    const technicalTooltip = container.querySelector(
      '[data-profile-axis="기술"] [role="tooltip"]',
    )
    expect(technicalTooltip).toHaveClass('left-3')
    expect(technicalTooltip).toHaveClass('right-3')
    expect(technicalTooltip).not.toHaveClass('w-72')
    expect(technicalTooltip).toHaveClass('[overflow-wrap:anywhere]')
    expect(screen.getByText('핵심 강점')).toBeInTheDocument()
    expect(screen.getByText('강점')).toBeInTheDocument()
    expect(screen.getByText('성장 포인트')).toBeInTheDocument()
    expect(screen.getByText('성장')).toBeInTheDocument()
  })

  it('페르소나 순위와 근거 충분도·판단 근거 4단계를 표시한다', () => {
    render(<AiProfile profile={profile} personas={personas} />)

    expect(
      screen.getByText('운영 근거를 쌓는 클라우드 운영형'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('근거 충분도 높음').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('button', { name: '1순위 페르소나 추천 근거 보기' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1순위 판단 근거')).toBeInTheDocument()
    expect(screen.getAllByText('사용 데이터').length).toBeGreaterThan(0)
    expect(screen.getAllByText('판단 근거').length).toBeGreaterThan(0)
    expect(screen.getAllByText('계산 흐름').length).toBeGreaterThan(0)
    expect(screen.getAllByText('결과').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/직무 연관 성취·CS·코딩테스트 50점 × 30%/),
    ).toBeInTheDocument()
    expect(screen.getByText(/인증 트러블슈팅 60점 × 30%/)).toBeInTheDocument()
    expect(
      screen.queryByText(/인증된 인프라 문제를 해결함/),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/제한: 팀 기술스택은 개인 과업으로 교차 확인함/),
    ).toBeInTheDocument()
  })
})
