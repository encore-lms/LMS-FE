// 프로젝트 쿼리 키 — 기능 로컬.
export const projectKeys = {
  all: ['student', 'projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  wizard: () => [...projectKeys.all, 'wizard'] as const,
  workspace: (id: string) => [...projectKeys.all, 'workspace', id] as const,
  githubConnection: (id: string) =>
    [...projectKeys.all, 'github-connection', id] as const,
}
