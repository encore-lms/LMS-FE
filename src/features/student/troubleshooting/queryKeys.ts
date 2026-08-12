// 트러블슈팅 쿼리 키 — 기능 로컬.
export const tsKeys = {
  all: ['student', 'troubleshooting'] as const,
  list: () => [...tsKeys.all, 'list'] as const,
  case: (id: string) => [...tsKeys.all, 'case', id] as const,
  /**
   * 케이스별 변경 제안 상태. case 하위에 두어 케이스를 무효화하면 함께 따라오게 한다
   * (프로젝트 changeRequests 와 같은 규약 — 상태가 케이스에 종속이라 따로 놀면 안 된다).
   */
  changeRequest: (id: string) =>
    [...tsKeys.case(id), 'change-request'] as const,
}
