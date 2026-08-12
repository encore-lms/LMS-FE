import { Fragment, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Eye,
  FileText,
  Flag,
  Info,
  Link2,
  Pencil,
  Send,
  Timer,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { inputClass } from '@/components/ui/inputClass'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { applyTsStatus, patchTsCase } from '../flow'
import { useCreateTsChangeRequest } from '../api/changeRequests'
import { useTsCase } from '../../api/troubleshooting'

// 변경 항목 → 사례 현재값(before). TsCaseDetail 은 태그를 노출하지 않아 태그는 빈 원본으로 둔다
// (강사가 변경 후 값만 검토 — 태그는 BE 원본 매핑 대상도 아님).
function currentValue(c: TsCaseDetail | undefined, item: string): string {
  if (!c) return ''
  switch (item) {
    case '제목':
      return c.title
    case '카테고리':
      return c.category
    case '상황':
      return c.situation
    case '해결':
      return c.resolution
    case '결과':
      return c.result
    default:
      return ''
  }
}
import { TS_CHANGE_ITEMS, type TsCase, type TsCaseDetail } from '../types'
import { markdownToText } from '@/components/ui/markdownText'

// 트러블슈팅 변경 제안 (/student/troubleshooting/:id/change-requests/new) — Figma 362:1348.
const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

// 변경 항목 칩 아이콘 (STAR 아이콘과 정합)
const CHANGE_ICON: Record<string, LucideIcon> = {
  제목: Pencil,
  카테고리: Clipboard,
  상황: Info,
  해결: Send, // Figma 칩·STAR는 send-fill, diff 박스 헤더만 command
  결과: CheckCircle2,
  태그: Flag,
}
// 처리 흐름 단계
type StepTone = 'warning' | 'success' | 'danger'
const STEP_BG: Record<StepTone, string> = {
  warning: 'bg-warning-bg',
  success: 'bg-success-bg',
  danger: 'bg-danger-bg',
}
const STEP_TEXT: Record<StepTone, string> = {
  warning: 'text-warning',
  success: 'text-success',
  danger: 'text-danger',
}
const STEPS: {
  no: string
  icon: LucideIcon
  title: string
  sub: string
  tone: StepTone
}[] = [
  {
    no: 'STEP 1',
    icon: Timer,
    title: '강사 검토 큐',
    sub: 'D+1 영업일 내 검토',
    tone: 'warning',
  },
  {
    no: 'STEP 2',
    icon: CheckCircle2,
    title: '승인 → 원본 반영',
    sub: '변경 사항 자동 갱신',
    tone: 'success',
  },
  {
    no: 'STEP 3',
    icon: AlertTriangle,
    title: '반려 → 사유 회신',
    sub: '코멘트와 함께 회신',
    tone: 'danger',
  },
]

interface UploadFile {
  id: string
  name: string
  meta: string
}
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
let fileSeq = 0

export default function ChangeRequestPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const createChange = useCreateTsChangeRequest(id)
  // 현재 사례 — 변경 전(before) 값의 원본. 캐시(목록)에서 로드.
  const { data: tsCase } = useTsCase(id)
  const [selected, setSelected] = useState<string[]>([])
  const [reason, setReason] = useState('')
  // 항목별 변경 후(after) 입력값. 처음 선택할 때 현재값으로 채워 수강생이 편집하게 한다.
  const [afterValues, setAfterValues] = useState<Record<string, string>>({})
  const setAfter = (item: string, value: string) =>
    setAfterValues((p) => ({ ...p, [item]: value }))
  // 근거 자료 — 파일 업로드 + 링크 추가 (실제 기능)
  const [files, setFiles] = useState<UploadFile[]>([
    { id: 'r1', name: 'retro-2026-05-25.md', meta: '4.7 KB · 학습 노트' },
  ])
  const [links, setLinks] = useState<string[]>([
    'https://blog.example.com/kafka-idempotency-key',
  ])
  const [linkInput, setLinkInput] = useState('')

  const toggle = (v: string) =>
    setSelected((p) => {
      if (p.includes(v)) return p.filter((x) => x !== v)
      // 처음 선택하는 항목은 현재값으로 after 를 채워 편집 시작점을 준다(이미 입력했으면 유지).
      setAfterValues((av) =>
        av[v] === undefined ? { ...av, [v]: currentValue(tsCase, v) } : av,
      )
      return [...p, v]
    })
  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return
    setFiles((p) => [
      ...p,
      ...Array.from(list).map((f) => ({
        id: `u${++fileSeq}`,
        name: f.name,
        meta: formatSize(f.size),
      })),
    ])
  }
  const removeFile = (id: string) =>
    setFiles((p) => p.filter((f) => f.id !== id))
  const addLink = () => {
    const v = linkInput.trim()
    if (!v || links.includes(v)) return
    setLinks((p) => [...p, v])
    setLinkInput('')
  }
  const removeLink = (url: string) =>
    setLinks((p) => p.filter((l) => l !== url))

  usePageHeader(
    '트러블슈팅 변경 제안',
    '인증 완료된 트러블슈팅 사례의 수정·삭제를 강사에게 제안합니다.',
  )
  const toast = useToast()

  // 변경 제안 저장 — 제안한 변경을 본문에 반영하고 '검토 중'(강사 변경 승인 대기)으로
  // 전환한 뒤 홈으로 간다. 강사 변경 승인(인증)은 여기가 아니라 사례 열기 → 상세(검토 중)의
  // 테스트 FAB에서 한다. 승인되면 다시 인증 완료로 목록에 그대로 남는다.
  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.danger('변경 사유를 입력해 주세요.')
      return
    }
    if (selected.length === 0) {
      toast.danger('변경할 항목을 1개 이상 선택해 주세요.')
      return
    }
    // 변경 후 값이 비어 있으면 막는다(현재값 그대로면 변경 아님).
    const empty = selected.find((it) => !(afterValues[it] ?? '').trim())
    if (empty) {
      toast.danger(`'${empty}'의 변경 후 내용을 입력해 주세요.`)
      return
    }
    // 선택 항목별 실제 diff(현재값 → 입력값)를 BE 로 전송. 강사가 항목별로 검토한다.
    const changes = selected.map((label) => ({
      label,
      before: currentValue(tsCase, label),
      after: afterValues[label] ?? '',
    }))
    createChange.mutate(
      { requestReason: reason, changes },
      {
        onSuccess: () => {
          // 로컬 미러 — 목록·상세가 즉시 '검토 중'으로 보이게(서버 반영과 별개 UX).
          const patch: Partial<TsCase> = { updatedAt: '최근 수정 방금' }
          if (selected.includes('해결')) patch.resolution = afterValues['해결']
          if (selected.includes('결과')) patch.result = afterValues['결과']
          patchTsCase(queryClient, id, patch)
          applyTsStatus(queryClient, id, 'reviewing', 'change')
          toast.success('변경 제안을 보냈어요 · 강사 검토 대기 (검토 중)')
          navigate('/student/troubleshooting')
        },
        onError: () =>
          toast.danger(
            '변경 제안 전송에 실패했어요. 잠시 후 다시 시도해 주세요.',
          ),
      },
    )
  }

  return (
    <div className="flex flex-col gap-5 p-8 pb-28">
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-[12px]">
          <button
            type="button"
            onClick={() => navigate('/student/troubleshooting')}
            className="text-fg-muted hover:text-fg"
          >
            ← 트러블슈팅 목록
          </button>
          <span className="text-fg-subtle">›</span>
          {/* 지금 고치는 사례 제목 — 예시 문구가 박혀 있어 어느 사례인지 헷갈렸다. */}
          <span className="text-fg-muted max-w-[220px] truncate">
            {tsCase?.title || '사례'}
          </span>
          <span className="text-fg-subtle">›</span>
          <span className="text-fg font-semibold">변경 제안</span>
        </nav>
        <span className="text-fg-subtle flex items-center gap-1 text-[11px]">
          <Pencil className="size-3" /> 신규 작성 · 미저장
        </span>
      </div>

      {/* 경고 배너 + 3단계 안내 */}
      <div className="border-warning/50 bg-warning-bg/50 flex flex-col gap-2.5 rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-warning size-4 shrink-0" />
          <span className="text-warning text-[13px] font-bold">
            인증 완료된 사례는 변경 제안으로만 수정 가능합니다
          </span>
          <span className="bg-warning-bg text-warning rounded px-1.5 py-0.5 text-[10px] font-bold">
            certified → 변경 제안
          </span>
        </div>
        <span className="text-fg-muted text-[11px]">
          변경 항목·사유를 작성하면 강사 검토 큐에 등록됩니다. 승인 시 원본
          사례가 갱신되고, 반려 시 사유 코멘트가 전달됩니다.
        </span>
        <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-5">
          {[
            '강사 검토 큐 등록 (D+1 영업일)',
            '승인 시 원본 자동 반영',
            '반려 시 사유 코멘트 회신',
          ].map((t, i) => (
            <span
              key={i}
              className="text-fg-muted flex items-center gap-1.5 text-[11px]"
            >
              <span className="bg-warning flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white">
                {i + 1}
              </span>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* 원본 사례 카드 — 지금 고치려는 그 사례. 예전에는 예시 문구가 박혀 있어
          어느 사례를 고치는지 화면만 봐서는 알 수 없었다. */}
      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {tsCase?.category && (
              <span className="bg-info-bg text-info rounded px-2 py-0.5 text-[11px] font-bold">
                {tsCase.category}
              </span>
            )}
            <span className="bg-success-bg text-success flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold">
              <Check className="size-3" /> {tsCase?.statusLabel ?? '인증 완료'}
            </span>
            {tsCase?.independent && (
              <span className="bg-brand/10 text-brand flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold">
                <Flag className="size-3" /> 독립 해결
              </span>
            )}
            <span className="text-fg-subtle flex items-center gap-1 text-[11px]">
              <Send className="size-3" />
              {tsCase?.projectLink
                ? tsCase.projectLink.projectTitle
                : '프로젝트 미연결'}
            </span>
          </div>
          <span className="text-fg-subtle flex shrink-0 items-center gap-1 text-[11px]">
            <XCircle className="size-3.5" /> 원본 잠금 — 변경 제안만 가능
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-fg text-[15px] font-bold">
            {tsCase?.title || '제목 없는 사례'}
          </h2>
          {tsCase?.certReviewer && (
            <span className="text-fg-subtle text-[11px]">
              {tsCase.certReviewer}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {[
            { label: '상황', text: tsCase?.situation },
            { label: '해결', text: tsCase?.resolution },
            { label: '결과', text: tsCase?.result },
          ].map((b) => (
            <div
              key={b.label}
              className="bg-surface-muted/50 flex flex-col gap-1 rounded-[10px] p-3"
            >
              <span className="text-fg-subtle text-[11px] font-bold">
                {b.label}
              </span>
              {/* 카드 요약은 마크다운 기호를 걷어낸 평문으로 — 3줄 안에 내용만 보여야 한다. */}
              <span className="text-fg-muted line-clamp-3 text-[12px] leading-5">
                {markdownToText(b.text) || '작성된 내용이 없어요'}
              </span>
            </div>
          ))}
        </div>
        {(tsCase?.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tsCase!.tags!.map((t) => (
              <span key={t} className="text-fg-muted text-[11px]">
                {t}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 변경 항목 선택 */}
      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-fg text-[15px] font-bold">
              변경 항목 선택
            </span>
            <span className="text-fg-subtle text-[11px]">
              변경할 항목을 선택하세요 · 선택한 항목만 변경 전/후 비교로
              표시됩니다
            </span>
          </div>
          <span className="bg-brand/10 text-brand flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold">
            <Check className="size-3" /> 선택 {selected.length} /{' '}
            {TS_CHANGE_ITEMS.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TS_CHANGE_ITEMS.map((it) => {
            const on = selected.includes(it)
            const Ic = CHANGE_ICON[it]
            return (
              <button
                key={it}
                type="button"
                onClick={() => toggle(it)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[12px] font-semibold',
                  on
                    ? 'border-brand bg-brand text-white'
                    : 'border-border text-fg-muted hover:border-brand/50',
                )}
              >
                {Ic && <Ic className="size-3.5" />}
                {it}
              </button>
            )
          })}
        </div>
      </section>

      {/* 변경 사유 */}
      <section className={cn(card, 'flex flex-col gap-2')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-fg text-[15px] font-bold">변경 사유</span>
            <span className="bg-danger-bg text-danger rounded px-1.5 py-0.5 text-[10px] font-bold">
              필수
            </span>
          </div>
          <span className="text-fg-subtle text-[11px]">
            {reason.length} / 500
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">
          강사가 변경의 정당성을 판단할 수 있도록 무엇이 어떻게 달라져야 하는지,
          왜 지금 변경이 필요한지 적어주세요.
        </span>
        <textarea
          value={reason}
          maxLength={500}
          onChange={(e) => setReason(e.target.value)}
          className={inputClass({
            size: 'md',
            className: 'min-h-[96px] resize-none leading-6',
          })}
        />
        <div className="text-fg-subtle flex items-center gap-3 text-[11px]">
          <span>Markdown 지원</span>
          <span className="bg-surface-muted rounded px-1.5 py-0.5 font-mono">
            ` ` 인라인 코드
          </span>
        </div>
      </section>

      {/* 변경 전 / 후 비교 */}
      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-fg text-[15px] font-bold">
              변경 전 / 후 비교
            </span>
            <span className="bg-brand/10 text-brand rounded px-2 py-0.5 text-[11px] font-bold">
              선택 {selected.length}건
            </span>
          </div>
          <span className="text-fg-subtle flex items-center gap-1 text-[12px]">
            <Eye className="size-3.5" /> 미리보기 토글
          </span>
        </div>
        {selected.length === 0 && (
          <span className="text-fg-subtle text-[12px]">
            변경 항목을 선택하면 전/후 비교가 표시됩니다.
          </span>
        )}
        {selected.map((it) => {
          const before = currentValue(tsCase, it)
          const after = afterValues[it] ?? ''
          const delta = after.length - before.length
          return (
            <div
              key={it}
              className="border-border flex flex-col gap-3 rounded-[12px] border p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-fg text-[13px] font-bold">{it}</span>
                    <span className="bg-warning-bg text-warning flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold">
                      <Pencil className="size-2.5" /> 변경 예정
                    </span>
                  </div>
                  <span className="text-fg-subtle text-[11px]">
                    좌측 변경 전 (원본) ↔ 우측 변경 후 (직접 입력)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(it)}
                  className="text-fg-subtle hover:text-fg flex shrink-0 items-center gap-1 text-[11px]"
                >
                  <X className="size-3" /> 선택 해제
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="border-border bg-surface-muted/40 flex flex-col gap-1.5 rounded-[10px] border p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-fg-subtle text-[11px]">
                      변경 전 · 원본 (인증 완료)
                    </span>
                    <span className="text-fg-subtle text-[11px]">
                      {before.length}자
                    </span>
                  </div>
                  <span className="text-fg-muted text-[12px] leading-5 whitespace-pre-wrap">
                    {before || '(현재 값 없음)'}
                  </span>
                </div>
                <div className="border-brand/40 bg-brand/5 flex flex-col gap-1.5 rounded-[10px] border p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-brand text-[11px] font-semibold">
                      변경 후 · 수정안 (직접 입력)
                    </span>
                    <span className="text-brand text-[11px] font-semibold">
                      {after.length}자 ({delta >= 0 ? '+' : ''}
                      {delta})
                    </span>
                  </div>
                  <textarea
                    value={after}
                    onChange={(e) => setAfter(it, e.target.value)}
                    rows={
                      it === '제목' || it === '카테고리' || it === '태그'
                        ? 1
                        : 4
                    }
                    aria-label={`${it} 변경 후 내용`}
                    placeholder={`${it}의 변경 후 내용을 입력하세요`}
                    className="text-fg placeholder:text-fg-subtle focus:border-brand border-border/60 w-full resize-y rounded-lg border bg-white p-2 text-[12px] leading-5 outline-none"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* 근거 자료 — 파일 업로드 + 링크 추가 */}
      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center gap-1.5">
          <span className="text-fg text-[15px] font-bold">근거 자료</span>
          <span className="text-fg-subtle text-[11px] font-normal">(선택)</span>
        </div>
        <span className="text-fg-subtle text-[11px]">
          변경의 근거가 되는 자료를 첨부하면 강사 검토 시 참고됩니다
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map((f) => (
            <span
              key={f.id}
              className="border-border flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5"
            >
              <span className="bg-success-bg text-success flex size-8 shrink-0 items-center justify-center rounded-lg">
                <FileText className="size-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-fg truncate text-[12px] font-semibold">
                  {f.name}
                </span>
                <span className="text-fg-subtle text-[11px]">{f.meta}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                aria-label={`${f.name} 제거`}
                className="border-border text-fg-subtle hover:text-fg flex size-6 shrink-0 items-center justify-center rounded-md border"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <label className="border-border text-fg-subtle hover:border-brand/50 flex cursor-pointer items-center justify-center gap-1 rounded-[10px] border border-dashed px-3 py-2.5 text-[12px]">
            + 파일 추가
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        </div>
        {links.map((url) => (
          <span
            key={url}
            className="border-border flex items-center gap-2 rounded-[10px] border px-3 py-2.5 text-[12px]"
          >
            <Link2 className="text-fg-subtle size-3.5 shrink-0" />
            <span className="text-fg-muted flex-1 truncate">{url}</span>
            <button
              type="button"
              onClick={() => removeLink(url)}
              aria-label="링크 제거"
              className="text-fg-subtle hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-2">
          <div className="border-border focus-within:border-brand flex flex-1 items-center gap-2 rounded-[10px] border px-3 py-2.5">
            <Link2 className="text-fg-subtle size-3.5 shrink-0" />
            <input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addLink()
                }
              }}
              placeholder="https:// 링크를 붙여넣고 Enter"
              className="text-fg placeholder:text-fg-subtle flex-1 bg-transparent text-[12px] outline-none focus-visible:shadow-none"
            />
          </div>
          <button
            type="button"
            onClick={addLink}
            className="border-border text-fg-muted hover:bg-surface-muted shrink-0 rounded-[10px] border px-3.5 py-2.5 text-[12px] font-semibold"
          >
            링크 추가
          </button>
        </div>
      </section>

      {/* 제출 후 처리 흐름 */}
      <section className={cn(card, 'flex flex-col gap-3.5')}>
        <div className="flex items-center gap-2">
          <Info className="text-info size-4 shrink-0" />
          <span className="text-fg text-[14px] font-bold">
            제출 후 처리 흐름
          </span>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {STEPS.map((s, i) => (
            <Fragment key={s.no}>
              <div className="flex flex-1 items-center gap-3">
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-[12px]',
                    STEP_BG[s.tone],
                  )}
                >
                  <s.icon className={cn('size-[22px]', STEP_TEXT[s.tone])} />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold tracking-[0.8px]',
                        STEP_BG[s.tone],
                        STEP_TEXT[s.tone],
                      )}
                    >
                      {s.no}
                    </span>
                    <span className="text-fg text-[13px] font-bold whitespace-nowrap">
                      {s.title}
                    </span>
                  </div>
                  <span className="text-fg-muted text-[11px]">{s.sub}</span>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="text-fg-subtle hidden size-3.5 shrink-0 sm:block" />
              )}
            </Fragment>
          ))}
        </div>
      </section>

      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-bold">
            변경 항목 {selected.length} / {TS_CHANGE_ITEMS.length} 선택 · 변경
            사유 {reason.length}자 작성
          </span>
          <span className="text-[11px] text-white/70">
            저장하면 검토 중으로 전환돼 홈으로 가요 · 강사 변경 승인은 사례 열기
            → 상세에서 진행
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/student/troubleshooting')}
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold"
          >
            변경 제안 저장 →
          </button>
        </div>
      </div>
    </div>
  )
}
