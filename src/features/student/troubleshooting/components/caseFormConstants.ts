import { CheckCircle2, Info, Send } from 'lucide-react'
import { inputClass } from '@/components/ui/inputClass'

// 트러블슈팅 사례 편집 폼(CaseContentForm)과 분해된 섹션 컴포넌트가 공유하는 모듈 상수·헬퍼.
export const card = 'bg-surface rounded-2xl p-6'
export const input = inputClass({ size: 'md' })

// 카테고리 표시명 → 목록 필터 키
export const CATEGORY_KEY: Record<string, string> = {
  DB: 'DB',
  '배포·인프라': 'deploy',
  성능: 'perf',
  '네트워크·API': 'net',
  보안: 'etc',
  기타: 'etc',
}

export const STAR = [
  {
    key: 'situation',
    label: '상황 (Situation)',
    sub: '무엇이 어떻게 잘못되고 있었는지, 사용자/시스템에 어떤 영향이 있었는지',
    Icon: Info,
    box: 'bg-info-bg text-info',
  },
  {
    key: 'resolution',
    label: '해결 (Resolution)',
    sub: '원인 파악부터 실제 조치까지 해결 과정을 기록',
    Icon: Send,
    box: 'bg-accent-bg text-accent-strong',
  },
  {
    key: 'result',
    label: '결과 (Result)',
    sub: '수치로 본 결과와 학습한 점',
    Icon: CheckCircle2,
    box: 'bg-success-bg text-success',
  },
] as const

export interface UploadFile {
  id: string
  name: string
  size: string
  file?: File // 신규 선택 파일(업로드 대기). 서버 저장분은 미포함.
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// 첨부 허용 형식 — 이미지·PDF·로그/텍스트. accept 속성 + 추가 시 확장자/용량 필터로 이중 방어.
export const ACCEPT_TYPES =
  '.png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.log,.txt,.md,.json,.yml,.yaml'
export const ALLOWED_EXT =
  /\.(png|jpe?g|gif|webp|svg|pdf|log|txt|md|json|ya?ml)$/i
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
