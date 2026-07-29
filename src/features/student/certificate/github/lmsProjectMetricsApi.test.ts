import { describe, expect, it } from 'vitest'
import type { WorkspaceData } from '../../projects/types'
import {
  normalizeGithubRepository,
  resolveLmsProjectMetrics,
} from './lmsProjectMetricsApi'

function workspace(
  id: string,
  repositoryUrl: string | null,
  metrics: WorkspaceData['metrics'] = [],
): WorkspaceData {
  return {
    id,
    title: `프로젝트 ${id}`,
    meta: '',
    status: 'draft',
    stats: [],
    myTasks: [],
    activities: [],
    columns: [],
    calMonth: '',
    calEvents: [],
    upcoming: [],
    meetings: [],
    docCategories: [],
    docs: repositoryUrl
      ? [
          {
            title: 'GitHub 저장소',
            meta: 'GitHub',
            status: { label: '등록', tone: 'info' },
            category: 'API 명세',
            url: repositoryUrl,
          },
        ]
      : [],
    issues: [],
    members: [
      {
        memberId: 'member-1',
        userId: 'student-1',
        name: '수강생',
        role: '프론트엔드 · 팀원',
        kind: '팀원',
        avatarTone: 'info',
      },
    ],
    rolePolicy: [],
    metrics,
    stack: ['React 19', 'TypeScript'],
    peerDue: '',
    peerMyStatus: { label: '', tone: 'info' },
    peerTeamStatus: { label: '', tone: 'info' },
    peerTargets: [],
    peerEvalEnabled: false,
    certChecklist: [],
    certStatus: { label: '', tone: 'info' },
    certRecentChange: {
      label: '',
      status: { label: '', tone: 'info' },
      date: '',
    },
  }
}

describe('GitHub 저장소 기반 LMS 프로젝트 성과지표 매칭', () => {
  it('GitHub URL과 owner/repo 표기를 같은 저장소로 정규화한다', () => {
    expect(normalizeGithubRepository('encore-lms/LMS-FE')).toBe(
      'encore-lms/lms-fe',
    )
    expect(
      normalizeGithubRepository('https://github.com/encore-lms/LMS-FE.git'),
    ).toBe('encore-lms/lms-fe')
    expect(
      normalizeGithubRepository('git@github.com:encore-lms/LMS-FE.git'),
    ).toBe('encore-lms/lms-fe')
  })

  it('GitHub 산출물 URL이 정확히 같은 프로젝트의 역할과 성과지표만 반환한다', () => {
    const metric = {
      label: '렌더링 시간',
      before: '1.2초',
      after: '0.4초',
      delta: '-67%',
      good: true,
    }
    const result = resolveLmsProjectMetrics(
      'encore-lms/LMS-FE',
      [
        workspace('other', 'https://github.com/encore-lms/LMS-BE', [metric]),
        workspace('lms-fe', 'https://github.com/encore-lms/LMS-FE', [metric]),
      ],
      'student-1',
    )

    expect(result).toMatchObject({
      status: 'MATCHED',
      projectId: 'lms-fe',
      projectTitle: '프로젝트 lms-fe',
      role: '프론트엔드 · 팀원',
      techStack: ['React 19', 'TypeScript'],
      metrics: [metric],
    })
  })

  it('등록되지 않은 저장소는 성과지표를 추측하지 않는다', () => {
    const result = resolveLmsProjectMetrics(
      'encore-lms/LMS-FE',
      [workspace('other', 'https://github.com/encore-lms/LMS-BE')],
      'student-1',
    )

    expect(result).toMatchObject({
      status: 'NOT_REGISTERED',
      metrics: [],
      matchedProjectCount: 0,
    })
  })

  it('같은 저장소가 여러 프로젝트에 등록되면 임의 선택하지 않는다', () => {
    const result = resolveLmsProjectMetrics(
      'encore-lms/LMS-FE',
      [
        workspace('one', 'https://github.com/encore-lms/LMS-FE'),
        workspace('two', 'https://github.com/encore-lms/LMS-FE/tree/develop'),
      ],
      'student-1',
    )

    expect(result).toMatchObject({
      status: 'AMBIGUOUS',
      metrics: [],
      matchedProjectCount: 2,
    })
  })
})
