const GITHUB_API_BASE = 'https://api.github.com'
const OWNER = 'encore-lms'
const REPO = 'LMS-FE'
export const LMS_FE_REPOSITORY = `${OWNER}/${REPO}`
const BRANCH = 'develop'
const AUTHOR_LOGIN = 'junseok-dev'
const ACTIVITY_WEEKS = 12
const COMMITS_PER_PAGE = 100
const MAX_COMMIT_PAGES = 5
const DAY_MS = 24 * 60 * 60 * 1000

interface GithubRepositoryResponse {
  full_name: string
  html_url: string
  description: string | null
  created_at: string
  pushed_at: string
  language: string | null
  default_branch: string
  private: boolean
}

interface GithubCommitResponse {
  sha: string
  html_url: string
  author: { login: string } | null
  commit: {
    author: { date: string | null } | null
    committer: { date: string | null } | null
    message: string
  }
}

export interface GithubActivityDay {
  date: string
  count: number
  isFuture: boolean
  isBeforeRepository: boolean
}

export interface LmsFeGithubProjectData {
  fullName: string
  repositoryUrl: string
  description: string
  createdAt: string
  pushedAt: string
  language: string
  defaultBranch: string
  activityBranch: string
  authorLogin: string
  grid: GithubActivityDay[][]
  totalCommits: number
  activeDays: number
  totalDays: number
  longestStreak: number
  weeklyAverage: number
  projectCommitCount: number
  authorCommitCount: number
  commitContributionRate: number
  windowStart: string
  windowEnd: string
  truncated: boolean
}

export class GithubProjectApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly rateLimitReset: Date | null,
  ) {
    super(message)
    this.name = 'GithubProjectApiError'
  }
}

const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfUtcWeek(date: Date) {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
  result.setUTCDate(result.getUTCDate() - result.getUTCDay())
  return result
}

function parseGithubError(response: Response) {
  const reset = response.headers.get('x-ratelimit-reset')
  const resetDate = reset ? new Date(Number(reset) * 1000) : null

  if (response.status === 403 || response.status === 429) {
    const resetLabel =
      resetDate && !Number.isNaN(resetDate.getTime())
        ? ` ${resetDate.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })} 이후 다시 시도해 주세요.`
        : ' 잠시 후 다시 시도해 주세요.'
    return new GithubProjectApiError(
      `GitHub API 호출 한도에 도달했습니다.${resetLabel}`,
      response.status,
      resetDate,
    )
  }

  if (response.status === 404) {
    return new GithubProjectApiError(
      'LMS-FE 공개 저장소 또는 develop 브랜치를 찾지 못했습니다.',
      response.status,
      resetDate,
    )
  }

  return new GithubProjectApiError(
    `GitHub API 응답을 불러오지 못했습니다. (${response.status})`,
    response.status,
    resetDate,
  )
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const { data } = await getJsonWithResponse<T>(url, signal)
  return data
}

async function getJsonWithResponse<T>(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { headers, signal })
  if (!response.ok) throw parseGithubError(response)
  return { data: (await response.json()) as T, response }
}

function readLastPage(link: string | null) {
  if (!link) return null
  for (const match of link.matchAll(/<([^>]+)>;\s*rel="([^"]+)"/g)) {
    if (match[2] !== 'last' || !match[1]) continue
    const page = Number(new URL(match[1]).searchParams.get('page'))
    return Number.isFinite(page) ? page : null
  }
  return null
}

async function fetchCommitCount(
  since: Date,
  signal?: AbortSignal,
  author?: string,
) {
  const params = new URLSearchParams({
    sha: BRANCH,
    since: since.toISOString(),
    per_page: '1',
    page: '1',
  })
  if (author) params.set('author', author)

  const { data, response } = await getJsonWithResponse<GithubCommitResponse[]>(
    `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/commits?${params}`,
    signal,
  )
  if (data.length === 0) return 0
  return readLastPage(response.headers.get('link')) ?? data.length
}

async function fetchRecentAuthorCommits(since: Date, signal?: AbortSignal) {
  const commits: GithubCommitResponse[] = []
  let truncated = false

  for (let page = 1; page <= MAX_COMMIT_PAGES; page += 1) {
    const params = new URLSearchParams({
      sha: BRANCH,
      author: AUTHOR_LOGIN,
      since: since.toISOString(),
      per_page: String(COMMITS_PER_PAGE),
      page: String(page),
    })
    const pageItems = await getJson<GithubCommitResponse[]>(
      `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/commits?${params}`,
      signal,
    )
    commits.push(...pageItems)

    if (pageItems.length < COMMITS_PER_PAGE) break
    if (page === MAX_COMMIT_PAGES) truncated = true
  }

  return { commits, truncated }
}

function countLongestStreak(days: GithubActivityDay[]) {
  let current = 0
  let longest = 0

  for (const day of days) {
    if (day.isFuture || day.isBeforeRepository) continue
    if (day.count > 0) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }

  return longest
}

export function buildLmsFeGithubProject(
  repository: GithubRepositoryResponse,
  commits: GithubCommitResponse[],
  now = new Date(),
  truncated = false,
  commitCounts?: { project: number; author: number },
): LmsFeGithubProjectData {
  const currentWeekStart = startOfUtcWeek(now)
  const windowStartDate = new Date(
    currentWeekStart.getTime() - (ACTIVITY_WEEKS - 1) * 7 * DAY_MS,
  )
  const repositoryCreatedAt = new Date(repository.created_at)
  const repositoryStart = new Date(
    Date.UTC(
      repositoryCreatedAt.getUTCFullYear(),
      repositoryCreatedAt.getUTCMonth(),
      repositoryCreatedAt.getUTCDate(),
    ),
  )
  const todayEnd = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  )
  const counts = new Map<string, number>()
  const authorCommits = commits.filter(
    (item) => item.author?.login === AUTHOR_LOGIN,
  )

  for (const item of authorCommits) {
    const rawDate = item.commit.author?.date ?? item.commit.committer?.date
    if (!rawDate) continue
    const commitDate = new Date(rawDate)
    if (commitDate < windowStartDate || commitDate > todayEnd) continue
    const key = toIsoDate(commitDate)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const flatDays = Array.from({ length: ACTIVITY_WEEKS * 7 }, (_, index) => {
    const date = new Date(windowStartDate.getTime() + index * DAY_MS)
    return {
      date: toIsoDate(date),
      count: counts.get(toIsoDate(date)) ?? 0,
      isFuture: date > todayEnd,
      isBeforeRepository: date < repositoryStart,
    }
  })
  const grid = Array.from({ length: ACTIVITY_WEEKS }, (_, week) =>
    flatDays.slice(week * 7, week * 7 + 7),
  )
  const measurableDays = flatDays.filter(
    (day) => !day.isFuture && !day.isBeforeRepository,
  )
  const totalCommits = measurableDays.reduce((sum, day) => sum + day.count, 0)
  const activeDays = measurableDays.filter((day) => day.count > 0).length
  const projectCommitCount = commitCounts?.project ?? commits.length
  const authorCommitCount = commitCounts?.author ?? authorCommits.length
  const commitContributionRate =
    projectCommitCount > 0
      ? Math.round((authorCommitCount / projectCommitCount) * 1000) / 10
      : 0
  return {
    fullName: repository.full_name,
    repositoryUrl: repository.html_url,
    description: repository.description ?? 'LMS 수강역량증명서 프론트엔드',
    createdAt: repository.created_at,
    pushedAt: repository.pushed_at,
    language: repository.language ?? 'TypeScript',
    defaultBranch: repository.default_branch,
    activityBranch: BRANCH,
    authorLogin: AUTHOR_LOGIN,
    grid,
    totalCommits,
    activeDays,
    totalDays: measurableDays.length,
    longestStreak: countLongestStreak(flatDays),
    weeklyAverage: Math.round((totalCommits / ACTIVITY_WEEKS) * 10) / 10,
    projectCommitCount,
    authorCommitCount,
    commitContributionRate,
    windowStart: toIsoDate(windowStartDate),
    windowEnd: toIsoDate(now),
    truncated,
  }
}

export async function fetchLmsFeGithubProject(
  signal?: AbortSignal,
  now = new Date(),
) {
  const repository = await getJson<GithubRepositoryResponse>(
    `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}`,
    signal,
  )
  const currentWeekStart = startOfUtcWeek(now)
  const activitySince = new Date(
    currentWeekStart.getTime() - (ACTIVITY_WEEKS - 1) * 7 * DAY_MS,
  )
  const repositorySince = new Date(repository.created_at)
  const [projectCommitCount, authorCommitCount, commitResult] =
    await Promise.all([
      fetchCommitCount(repositorySince, signal),
      fetchCommitCount(repositorySince, signal, AUTHOR_LOGIN),
      fetchRecentAuthorCommits(activitySince, signal),
    ])
  return buildLmsFeGithubProject(
    repository,
    commitResult.commits,
    now,
    commitResult.truncated,
    { project: projectCommitCount, author: authorCommitCount },
  )
}
