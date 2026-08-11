import type { BadgeTone } from '@/components/ui/StatusBadge'
import type { DiagnosisLevel } from './types'

// 등급 → 배지 톤 매핑 — 그룹·개인 리포트 공용.
export const LEVEL_TONE: Record<DiagnosisLevel, BadgeTone> = {
  입문: 'neutral',
  초급: 'warning',
  중급: 'info',
  해결사: 'success',
}
