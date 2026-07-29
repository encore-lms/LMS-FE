import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectList } from './ProjectList'
import { TroubleshootingList } from './TroubleshootingList'
import type { DashboardProject, DashboardTroubleshooting } from '../types'

// QA: "헤더에는 '3건 진행 · 1건 인증 완료' 인데 목록은 비어 있다."
// 부제가 고정 문자열이라, 목록이 비어도 자료가 있는 것처럼 보였다.

const project = (id: string, tone: DashboardProject['status']['tone']) =>
  ({
    id,
    title: `프로젝트 ${id}`,
    subtitle: '팀 프로젝트',
    accentTone: 'brand',
    progressPct: 40,
    status: { label: tone === 'success' ? '인증 완료' : '작성 중', tone },
    to: `/student/projects/${id}`,
  }) as DashboardProject

const wrap = (ui: React.ReactNode) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

describe('대시보드 목록 부제', () => {
  it('프로젝트가 없으면 없다고 말한다', () => {
    wrap(<ProjectList projects={[]} />)
    expect(screen.getByText('아직 등록한 프로젝트가 없어요')).toBeInTheDocument()
  })

  it('프로젝트 부제는 실제 건수를 센다', () => {
    wrap(
      <ProjectList
        projects={[
          project('a', 'warning'),
          project('b', 'warning'),
          project('c', 'success'),
        ]}
      />,
    )
    expect(screen.getByText('2건 진행 · 1건 인증 완료')).toBeInTheDocument()
  })

  it('트러블슈팅 부제도 실제 건수를 센다', () => {
    const items: DashboardTroubleshooting[] = [
      {
        id: 't1',
        tag: 'DB',
        tagTone: 'info',
        title: '커넥션 풀 고갈',
        resolved: true,
        dayLabel: '3일',
        to: '/student/troubleshooting/t1',
      },
      {
        id: 't2',
        tag: '배포',
        tagTone: 'info',
        title: '이미지 빌드 실패',
        resolved: false,
        dayLabel: '1일',
        to: '/student/troubleshooting/t2',
      },
    ]
    wrap(<TroubleshootingList items={items} />)
    expect(screen.getByText('2건 · 인증 완료 1')).toBeInTheDocument()
  })
})
