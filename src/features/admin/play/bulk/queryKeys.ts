// 운영 PLAY 타자 일괄 업로드 캐시 키 — 기능 로컬(shared 미오염).
export const playBulkKeys = {
  all: ['admin-play-bulk'] as const,
  preview: () => [...playBulkKeys.all, 'preview'] as const,
} as const
