import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildLmsFeGithubProject,
  fetchLmsFeGithubProject,
} from './lmsFeGithubApi'

const repository = {
  full_name: 'encore-lms/LMS-FE',
  html_url: 'https://github.com/encore-lms/LMS-FE',
  description: 'LMS-FE',
  created_at: '2026-05-07T10:38:05Z',
  pushed_at: '2026-07-21T02:18:06Z',
  language: 'TypeScript',
  default_branch: 'main',
  private: false,
}

function commit(date: string, login = 'junseok-dev') {
  return {
    sha: date,
    html_url: `https://github.com/encore-lms/LMS-FE/commit/${date}`,
    author: { login },
    commit: {
      author: { date },
      committer: { date },
      message: `feat(cert): ${date} 작업`,
    },
  }
}

describe('LMS-FE GitHub 프로젝트 활동 집계', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('develop 커밋 응답을 최근 12주 일별 활동으로 변환한다', () => {
    const result = buildLmsFeGithubProject(
      repository,
      [
        commit('2026-05-07T12:00:00Z'),
        commit('2026-05-07T15:00:00Z'),
        commit('2026-05-08T12:00:00Z'),
        commit('2026-05-10T12:00:00Z'),
        commit('2026-05-11T12:00:00Z'),
        commit('2026-05-13T12:00:00Z'),
        commit('2026-04-01T12:00:00Z'),
        commit('2026-07-22T12:00:00Z'),
        commit('2026-06-01T12:00:00Z', 'another-user'),
        commit('2026-06-02T12:00:00Z', 'another-user'),
      ],
      new Date('2026-07-21T12:00:00Z'),
    )

    expect(result.fullName).toBe('encore-lms/LMS-FE')
    expect(result.activityBranch).toBe('develop')
    expect(result.authorLogin).toBe('junseok-dev')
    expect(result.grid).toHaveLength(12)
    expect(result.grid.every((week) => week.length === 7)).toBe(true)
    expect(result.totalCommits).toBe(6)
    expect(result.activeDays).toBe(5)
    expect(result.totalDays).toBe(76)
    expect(result.longestStreak).toBe(2)
    expect(result.weeklyAverage).toBe(0.5)
    expect(result.projectCommitCount).toBe(10)
    expect(result.authorCommitCount).toBe(8)
    expect(result.commitContributionRate).toBe(80)
    expect(
      result.grid.flat().find((day) => day.date === '2026-05-07')?.count,
    ).toBe(2)
  })

  it('GitHub 저장소 생성 전 날짜와 오늘 이후 날짜를 집계 대상에서 제외한다', () => {
    const result = buildLmsFeGithubProject(
      repository,
      [],
      new Date('2026-07-21T12:00:00Z'),
    )
    const days = result.grid.flat()

    expect(days.find((day) => day.date === '2026-05-06')).toMatchObject({
      isBeforeRepository: true,
    })
    expect(days.find((day) => day.date === '2026-05-07')).toMatchObject({
      isBeforeRepository: false,
    })
    expect(days.find((day) => day.date === '2026-07-22')).toMatchObject({
      isFuture: true,
    })
  })

  it('Link 헤더로 전체·개인 커밋 수를 세고 최근 활동을 집계한다', async () => {
    const personalCommit = commit('2026-07-21T02:00:00Z')
    personalCommit.sha = 'abcdef1234567890'
    const requestedUrls: string[] = []
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      requestedUrls.push(url)

      if (url.endsWith('/repos/encore-lms/LMS-FE')) {
        return new Response(JSON.stringify(repository), { status: 200 })
      }
      if (url.includes('per_page=1')) {
        const isAuthor = url.includes('author=junseok-dev')
        const lastPage = isAuthor ? 80 : 250
        return new Response(JSON.stringify([personalCommit]), {
          status: 200,
          headers: {
            Link: `<https://api.github.com/repositories/1/commits?page=${lastPage}>; rel="last"`,
          },
        })
      }
      if (url.includes('per_page=100')) {
        return new Response(JSON.stringify([personalCommit]), { status: 200 })
      }
      throw new Error(`예상하지 못한 URL: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchLmsFeGithubProject(
      undefined,
      new Date('2026-07-21T12:00:00Z'),
    )

    expect(result.projectCommitCount).toBe(250)
    expect(result.authorCommitCount).toBe(80)
    expect(result.commitContributionRate).toBe(32)
    expect(
      requestedUrls.some(
        (url) => url.includes('author=junseok-dev') && url.includes('since='),
      ),
    ).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })
})
