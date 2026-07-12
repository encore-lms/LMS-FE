import {
  Book,
  CircleCheck,
  Clipboard,
  Eye,
  FileArchive,
  FileText,
  Film,
  Globe,
  Info,
  Link2,
  Pencil,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { STACK_CATALOG, type Tone } from '../types'

export const card = 'border-border bg-surface rounded-2xl border p-6'
export const CHIP_ON: Record<Tone, string> = {
  brand: 'border-brand bg-brand text-white',
  info: 'border-info bg-info text-white',
  warning: 'border-warning bg-warning text-white',
  danger: 'border-danger bg-danger text-white',
  accent: 'border-accent-strong bg-accent-strong text-white',
  success: 'border-success bg-success text-white',
}
// 카탈로그 스택 → 그룹 톤(정적). 커스텀 스택은 그룹 매칭으로 보강.
export const STACK_TONE = new Map<string, Tone>()
STACK_CATALOG.forEach((g) =>
  g.items.forEach((it) => STACK_TONE.set(it, g.tone)),
)

// 도메인 아이콘 — Figma 349:1185(도메인 행) 기준. lucide로 매핑.
export const DOMAIN_ICON: Record<string, LucideIcon> = {
  커머스: FileArchive, // file-earmark-zip-fill
  핀테크: Clipboard, // clipboard-fill
  '미디어·콘텐츠': Video, // camera-video-fill
  '교육·학습': Book, // book-fill
  헬스케어: CircleCheck, // check-circle-fill
  '소셜·커뮤니티': Eye, // eye
  '생산성 도구': Pencil, // pencil-fill
  기타: Info, // info-circle-fill
}

// 산출물 형태 아이콘·톤 — Figma 산출물 카드/요약 칩 기준.
export const DELIVERABLE_META: Record<
  string,
  { icon: LucideIcon; tone: Tone }
> = {
  'GitHub 리포지토리': { icon: Link2, tone: 'info' }, // link-45deg
  '배포 URL': { icon: Globe, tone: 'brand' },
  '기술 문서·회고': { icon: FileText, tone: 'accent' }, // file-earmark-text-fill
  '발표 자료': { icon: Video, tone: 'warning' }, // camera-video-fill
  '데모 영상': { icon: Film, tone: 'success' },
}
