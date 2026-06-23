import { Fragment, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Command,
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
import { useToast } from '@/components/ui/use-toast'
import { TestModeFab } from '@/components/dev/TestModeFab'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { patchTsCase } from '../flow'
import { TS_CHANGE_ITEMS, type TsCase } from '../types'

// 트러블슈팅 변경 제안 (/student/troubleshooting/:id/change-requests/new) — Figma 362:1348.
const card = 'border-border bg-surface rounded-2xl border p-6'

// 변경 항목 칩 아이콘 (STAR 아이콘과 정합)
const CHANGE_ICON: Record<string, LucideIcon> = {
  제목: Pencil,
  카테고리: Clipboard,
  상황: Info,
  해결: Send, // Figma 칩·STAR는 send-fill, diff 박스 헤더만 command
  결과: CheckCircle2,
  태그: Flag,
}
// 변경 전/후 비교 — 항목별 아이콘 박스 + 본문
const DIFF: Record<
  string,
  { Icon: LucideIcon; box: string; before: string; after: string }
> = {
  해결: {
    Icon: Command,
    box: 'bg-accent-bg text-accent-strong',
    before:
      '`enable.auto.commit=false` 전환, 외부 키 기반 dedup 테이블 추가, 컨슈머 그룹 ack 정책 정리. 팀 회의에서 격리 수준 재설계를 설득해 합의했습니다.',
    after:
      '`enable.auto.commit=false` 전환, 멱등성 키(Idempotency-Key) 기반 dedup 테이블 추가 후 TTL 24h 운영. 컨슈머 그룹 ack 정책을 manual commit + back-pressure로 재설계하고, 격리 수준은 READ COMMITTED + 도메인 이벤트 outbox로 합의.',
  },
  결과: {
    Icon: CheckCircle2,
    box: 'bg-success-bg text-success',
    before:
      '중복 처리 0건/주, 결제 실패율 8% → 0.4%, 컨슈머 lag 평균 1.2s → 240ms. 학습: 컨슈머 그룹 토폴로지 가시화가 우선이었음을 확인.',
    after:
      '중복 처리 0건/주(8주 누적), 결제 실패율 8% → 0.4%, 컨슈머 lag 평균 1.2s → 240ms (P95 480ms). 학습: 토폴로지 가시화 + 멱등성 키 운영 룰 문서화, 재발 방지 알람 임계치 설정.',
  },
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
  const [selected, setSelected] = useState<string[]>(['해결', '결과'])
  const [reason, setReason] = useState(
    '멱등성 키 도입 이후의 해결 방식을 본문에 정확하게 반영하고, 결과에 재발 방지 조치를 추가하기 위함입니다. 외부 발표에서 받은 피드백으로 격리 수준 관련 수치도 보강합니다.',
  )
  // 근거 자료 — 파일 업로드 + 링크 추가 (실제 기능)
  const [files, setFiles] = useState<UploadFile[]>([
    { id: 'r1', name: 'retro-2026-05-25.md', meta: '4.7 KB · 학습 노트' },
  ])
  const [links, setLinks] = useState<string[]>([
    'https://blog.example.com/kafka-idempotency-key',
  ])
  const [linkInput, setLinkInput] = useState('')
  // 변경 제안 흐름(데모): false = 작성 중, true = 강사 검토 대기(requested).
  // 강사 승인(시뮬)은 테스트 FAB에서 처리해 실제 사례 본문에 반영한다.
  const [requested, setRequested] = useState(false)

  const toggle = (v: string) =>
    setSelected((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))
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

  // 변경 제안 저장 — 강사 검토 큐로 제출(requested). 강사 승인 전까지 추가 변경 불가.
  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.danger('변경 사유를 입력해 주세요.')
      return
    }
    if (selected.length === 0) {
      toast.danger('변경할 항목을 1개 이상 선택해 주세요.')
      return
    }
    setRequested(true)
    toast.success('변경 제안을 보냈어요 · 강사 검토 대기')
  }

  // 강사 변경 승인(시뮬) — 선택 항목의 수정안을 실제 사례 본문에 반영하고 메인 홈으로.
  // BE 연동·강사 검토 화면 연결 시 이 시뮬과 테스트 FAB는 제거한다.
  const approveChange = () => {
    const patch: Partial<TsCase> = { updatedAt: '최근 수정 방금' }
    if (selected.includes('해결') && DIFF['해결'])
      patch.resolution = DIFF['해결'].after
    if (selected.includes('결과') && DIFF['결과'])
      patch.result = DIFF['결과'].after
    patchTsCase(queryClient, id, patch)
    toast.success('강사가 변경을 승인했어요 · 인증 완료에 반영됐어요')
    navigate('/student/troubleshooting')
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
          <span className="text-fg-muted">Kafka 컨슈머 리밸런싱…</span>
          <span className="text-fg-subtle">›</span>
          <span className="text-fg font-semibold">변경 제안</span>
        </nav>
        <span className="text-fg-subtle flex items-center gap-1 text-[11px]">
          {requested ? (
            <>
              <Timer className="size-3" /> 강사 검토 대기
            </>
          ) : (
            <>
              <Pencil className="size-3" /> 신규 작성 · 미저장
            </>
          )}
        </span>
      </div>

      {/* 강사 검토 대기 배너 — 변경 제안 저장 후 강사 승인을 기다리는 상태 */}
      {requested && (
        <div className="border-info/50 bg-info-bg/50 flex items-center gap-2 rounded-xl border p-4">
          <Timer className="text-info size-4 shrink-0" />
          <div className="flex flex-col">
            <span className="text-info text-[13px] font-bold">
              변경 제안을 강사 검토 큐로 보냈어요
            </span>
            <span className="text-fg-muted text-[11px]">
              강사가 승인하면 선택한 항목이 원본 사례에 반영되고 다시 인증
              완료(잠금) 상태가 됩니다.
            </span>
          </div>
        </div>
      )}

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

      {/* 원본 사례 카드 */}
      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="bg-info-bg text-info rounded px-2 py-0.5 text-[11px] font-bold">
              DB
            </span>
            <span className="bg-success-bg text-success flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold">
              <Check className="size-3" /> 인증 완료
            </span>
            <span className="bg-brand/10 text-brand flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold">
              <Flag className="size-3" /> 독립 해결
            </span>
            <span className="text-fg-subtle flex items-center gap-1 text-[11px]">
              <Send className="size-3" /> 프로젝트 연결
            </span>
          </div>
          <span className="text-fg-subtle flex shrink-0 items-center gap-1 text-[11px]">
            <XCircle className="size-3.5" /> 원본 잠금 — 변경 제안만 가능
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-fg text-[15px] font-bold">
            Kafka 컨슈머 리밸런싱으로 메시지 중복 처리
          </h2>
          <span className="text-fg-subtle text-[11px]">
            작성 2026-04-22 · 인증 2026-05-08 · 검토자 임수현 강사
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {[
            {
              label: '상황',
              text: '스케일아웃 시 컨슈머 리밸런싱이 발생하면서 동일 주문 이벤트가 두 번 처리.',
            },
            {
              label: '해결',
              text: '멱등성 키와 dedup 테이블을 추가하고 ack 정책과 격리 수준을 재정리.',
            },
            {
              label: '결과',
              text: '중복 0건/주 · 결제 실패율 8% → 0.4%.',
            },
          ].map((b) => (
            <div
              key={b.label}
              className="bg-surface-muted/50 flex flex-col gap-1 rounded-[10px] p-3"
            >
              <span className="text-fg-subtle text-[11px] font-bold">
                {b.label}
              </span>
              <span className="text-fg-muted text-[12px] leading-5">
                {b.text}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['#Kafka', '#이벤트소싱', '#멱등성'].map((t) => (
            <span key={t} className="text-fg-muted text-[11px]">
              {t}
            </span>
          ))}
        </div>
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
          className="border-border bg-surface text-fg focus:border-brand min-h-[96px] w-full resize-none rounded-[10px] border px-4 py-3 text-[14px] leading-6 focus:outline-none"
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
          const d = DIFF[it]
          const before = d?.before ?? '기존 값'
          const after = d?.after ?? '새 값을 입력하세요'
          const delta = after.length - before.length
          return (
            <div
              key={it}
              className="border-border flex flex-col gap-3 rounded-[12px] border p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {d && (
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        d.box,
                      )}
                    >
                      <d.Icon className="size-4" />
                    </span>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-fg text-[13px] font-bold">
                        {d
                          ? `${it} (${it === '해결' ? 'Resolution' : 'Result'})`
                          : it}
                      </span>
                      <span className="bg-warning-bg text-warning flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold">
                        <Pencil className="size-2.5" /> 변경 예정
                      </span>
                    </div>
                    <span className="text-fg-subtle text-[11px]">
                      좌측 변경 전 (원본) ↔ 우측 변경 후 (수정안)
                    </span>
                  </div>
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
                  <span className="text-fg-muted text-[12px] leading-5">
                    {before}
                  </span>
                </div>
                <div className="border-brand/40 bg-brand/5 flex flex-col gap-1.5 rounded-[10px] border p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-brand text-[11px] font-semibold">
                      변경 후 · 수정안 (편집 가능)
                    </span>
                    <span className="text-brand text-[11px] font-semibold">
                      ▲ {after.length}자 ({delta >= 0 ? '+' : ''}
                      {delta})
                    </span>
                  </div>
                  <span className="text-fg text-[12px] leading-5">{after}</span>
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
              className="text-fg placeholder:text-fg-subtle flex-1 bg-transparent text-[12px] outline-none"
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
            {requested
              ? '변경 제안 제출됨 · 강사 검토 대기'
              : `변경 항목 ${selected.length} / ${TS_CHANGE_ITEMS.length} 선택 · 변경 사유 ${reason.length}자 작성 완료`}
          </span>
          <span className="text-[11px] text-white/70">
            {requested
              ? '강사 승인은 우하단 테스트 버튼(🧪)으로 시뮬레이션할 수 있어요'
              : '저장 시 강사 검토 큐에 `requested` 상태로 등록됩니다 · 검토 진행 중에는 추가 변경 불가'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/student/troubleshooting')}
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            {requested ? '닫기' : '취소'}
          </button>
          {requested ? (
            <span className="bg-brand/40 rounded-lg px-5 py-2.5 text-[13px] font-bold">
              강사 승인 대기 중
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold"
            >
              변경 제안 저장 →
            </button>
          )}
        </div>
      </div>

      {/* 테스트 시뮬레이션 — 강사 변경 승인(요청 → 본문 반영 → 인증 완료). BE 연동·강사 화면 연결 시 제거. */}
      <TestModeFab note="트러블슈팅 변경 제안 (FE 목 · 강사 변경 승인 시뮬)">
        <span className="text-accent-strong w-full text-[11px] font-semibold">
          현재: {requested ? '강사 검토 대기' : '작성 중'}
        </span>
        {requested ? (
          <>
            <button
              type="button"
              onClick={approveChange}
              className="bg-success rounded-lg px-3 py-2 text-[12px] font-bold text-white"
            >
              🧑‍🏫 강사 변경 승인 (시뮬)
            </button>
            <button
              type="button"
              onClick={() => {
                setRequested(false)
                toast.info('변경 제안을 취소했어요 · 다시 작성할 수 있어요')
              }}
              className="border-accent-strong/50 text-accent-strong rounded-lg border px-3 py-2 text-[12px] font-bold"
            >
              ↺ 요청 취소
            </button>
          </>
        ) : (
          <span className="text-fg-subtle text-[11px]">
            먼저 ‘변경 제안 저장’을 보내세요
          </span>
        )}
      </TestModeFab>
    </div>
  )
}
