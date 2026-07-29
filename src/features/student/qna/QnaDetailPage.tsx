import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Eye, MessageSquare } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/components/ui/Avatar'
import { buttonClass } from '@/components/ui/buttonClass'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Markdown } from '@/components/ui/Markdown'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader, useAuth } from '@/shared/store'
import {
  useAcceptAnswer,
  useCreateAnswer,
  useCreateComment,
  useDeleteAnswer,
  useDeleteComment,
  useDeleteQuestion,
  useQnaDetail,
} from '../api/qna'
import { useQnaBase } from './useQnaBase'
import { MarkdownEditor } from './components/MarkdownEditor'
import type { QnaAnswer, QnaDetail, Tone } from './types'

// 상세는 클릭 대상이 아닌 읽기 컨테이너라 그림자 없이 flat(간격만으로 구분).
// flat이라 카드 경계가 안 보이므로 좌우 패딩을 두지 않고 페이지 컨테이너 라인에 정렬한다.
const card = 'bg-surface rounded-2xl'
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger/10 text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
const ROLE_CHIP: Record<string, string> = {
  강사: 'bg-brand/10 text-brand',
  멘토: 'bg-accent-bg text-accent-strong',
  수강생: 'bg-surface-muted text-fg-muted',
}

// 멘션 자동완성 후보 — 이 스레드의 실제 참여자(질문 작성자·답변자·댓글 작성자). 현재 사용자 제외.
// BE가 멘션 이름을 스레드 참여자로만 해석해 알림을 보내므로(이름만으론 임의 사용자를 특정 불가),
// 후보도 동일 범위여야 실제로 알림이 간다.
function threadMentionNames(detail: QnaDetail, self: string): string[] {
  const names = new Set<string>([detail.authorName])
  for (const answer of detail.answers) {
    names.add(answer.authorName)
    for (const comment of answer.comments) {
      names.add(comment.authorName)
    }
  }
  names.delete(self)
  return [...names]
}

// 작성자 전용 삭제 버튼 — 클릭 시 인라인 확인(파괴적이라 즉시 삭제 방지). 모달 없이 경량 처리.
function DeleteButton({
  onConfirm,
  pending,
  confirmText,
}: {
  onConfirm: () => void
  pending: boolean
  confirmText: string
}) {
  const [confirming, setConfirming] = useState(false)
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-fg-subtle hover:text-danger text-[11px] font-semibold transition-colors"
      >
        삭제
      </button>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
      <span className="text-fg-muted">{confirmText}</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={pending}
        className="text-danger font-bold disabled:opacity-50"
      >
        {pending ? '삭제 중…' : '삭제'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-fg-subtle hover:text-fg"
      >
        취소
      </button>
    </span>
  )
}

// 답변 1건 + 댓글 스레드 + 댓글 작성기(멘션). 답변별 작성 상태를 자체 보유.
function AnswerItem({
  answer,
  questionId,
  resolved,
  canAccept,
  onAccept,
  acceptPending,
  selfName,
  mentionNames,
}: {
  answer: QnaAnswer
  questionId: string
  resolved: boolean
  /** 채택은 질문 작성자만 가능(BE OwnershipGuard). 운영자·타 수강생에겐 숨긴다. */
  canAccept: boolean
  onAccept: (answerId: string) => void
  acceptPending: boolean
  selfName: string
  /** 멘션 후보 — 스레드 실제 참여자(부모가 전체 스레드 기준으로 계산). */
  mentionNames: string[]
}) {
  const toast = useToast()
  const createComment = useCreateComment(questionId, answer.id)
  const deleteAnswer = useDeleteAnswer(questionId)
  const deleteComment = useDeleteComment(questionId, answer.id)
  const [draft, setDraft] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  const submit = () => {
    if (!draft.trim() || createComment.isPending) return
    createComment.mutate(
      { content: draft.trim(), mentions, authorName: selfName },
      {
        // 멘션·댓글 알림은 BE가 발행한다(수신자에게 실제로 전달·영속).
        // 예전엔 여기서 addLocalNotification으로 내 브라우저에만 표시하던 목업이었다.
        onSuccess: () => {
          toast.success('댓글을 등록했어요')
          setDraft('')
          setMentions([])
        },
        onError: () => toast.danger('댓글 등록에 실패했어요'),
      },
    )
  }

  return (
    <section
      className={cn(
        card,
        'flex flex-col gap-3',
        answer.isAccepted && 'border-success ring-success/20 ring-1',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={answer.authorName} size={24} />
          <span className="text-fg text-[13px] font-bold">
            {answer.authorName}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold',
              ROLE_CHIP[answer.authorRole] ?? 'bg-surface-muted text-fg-muted',
            )}
          >
            {answer.authorRole}
          </span>
          {answer.isAccepted && (
            <span className="bg-success-bg text-success flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
              <CheckCircle2 className="size-3" /> 채택됨
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-fg-subtle text-[11px]">{answer.createdAt}</span>
          {answer.canDelete && (
            <DeleteButton
              pending={deleteAnswer.isPending}
              confirmText="답변·댓글 삭제?"
              onConfirm={() =>
                deleteAnswer.mutate(answer.id, {
                  onSuccess: () => toast.success('답변을 삭제했어요'),
                  onError: () => toast.danger('답변 삭제에 실패했어요'),
                })
              }
            />
          )}
        </div>
      </div>

      <Markdown mentions={answer.mentions}>{answer.content}</Markdown>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-fg-muted hover:text-fg flex items-center gap-1.5 text-[12px] font-semibold"
        >
          <MessageSquare className="size-3.5" />
          댓글 {answer.comments.length}
        </button>
        {canAccept && !resolved && !answer.isAccepted && (
          <button
            type="button"
            onClick={() => onAccept(answer.id)}
            disabled={acceptPending}
            className="border-success text-success hover:bg-success-bg flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50"
          >
            <CheckCircle2 className="size-3.5" />이 답변 채택
          </button>
        )}
      </div>

      {/* 댓글 스레드 — 1단 들여쓰기 */}
      {(open || answer.comments.length > 0) && (
        <div className="border-border ml-1 flex flex-col gap-3 border-l-2 pl-4">
          {answer.comments.map((c) => (
            <div key={c.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Avatar name={c.authorName} size={20} />
                <span className="text-fg text-[12px] font-bold">
                  {c.authorName}
                </span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    ROLE_CHIP[c.authorRole] ?? 'bg-surface-muted text-fg-muted',
                  )}
                >
                  {c.authorRole}
                </span>
                <span className="text-fg-subtle text-[10px]">
                  {c.createdAt}
                </span>
                {c.canDelete && (
                  <span className="ml-auto">
                    <DeleteButton
                      pending={deleteComment.isPending}
                      confirmText="삭제?"
                      onConfirm={() =>
                        deleteComment.mutate(c.id, {
                          onSuccess: () => toast.success('댓글을 삭제했어요'),
                          onError: () => toast.danger('댓글 삭제에 실패했어요'),
                        })
                      }
                    />
                  </span>
                )}
              </div>
              <div className="text-[13px]">
                <Markdown mentions={c.mentions}>{c.content}</Markdown>
              </div>
            </div>
          ))}

          {/* 댓글 작성기(멘션) */}
          <div className="flex flex-col gap-2 pt-1">
            <MarkdownEditor
              value={draft}
              onChange={setDraft}
              minHeight={72}
              maxLength={1000}
              placeholder="댓글 달기 · @로 멘션하면 알림이 가요"
              mentionNames={mentionNames}
              onMentionsChange={setMentions}
              onImageRejected={(msg) => toast.danger(msg)}
            />
            <div className="flex items-center justify-between">
              <span className="text-fg-subtle text-[11px]">
                {mentions.length > 0
                  ? `멘션: @${mentions.join(', @')}`
                  : '마크다운·@멘션 지원'}
              </span>
              <button
                type="button"
                onClick={submit}
                disabled={!draft.trim() || createComment.isPending}
                className={buttonClass({ size: 'sm' })}
              >
                {createComment.isPending ? '등록 중…' : '댓글 등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// QnA 상세 — 수강생(/student/qna/:id)·운영(/admin/qna/:id) 공용. 질문 본문 + 답변 스레드 + 답변/댓글.
// 채택·질문 삭제는 작성자(수강생)만 — data.canDelete로 게이트되어 운영자에겐 노출되지 않는다.
export default function QnaDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const base = useQnaBase()
  const toast = useToast()
  const { user } = useAuth()
  const selfName = user?.name ?? '나'
  const { data, isPending, isError, refetch } = useQnaDetail(id)
  const createAnswer = useCreateAnswer(id)
  const acceptAnswer = useAcceptAnswer(id)
  const deleteQuestion = useDeleteQuestion()
  const [draft, setDraft] = useState('')
  // 답변에도 댓글과 같은 @멘션 — 예전에는 답변 작성기에 멘션이 없어 @이름을 써도 알림이 가지 않았다.
  const [mentions, setMentions] = useState<string[]>([])
  // 질문 삭제는 답변·댓글까지 연쇄 삭제라 인라인 확인 대신 모달로 무게를 준다(답변·댓글은 인라인 유지).
  const [deleteOpen, setDeleteOpen] = useState(false)
  usePageHeader('QnA 게시판', '질문 상세')

  const resolved = data?.status === 'resolved'
  const submitAnswer = () => {
    if (!draft.trim() || createAnswer.isPending) return
    createAnswer.mutate(
      { content: draft.trim(), mentions, authorName: selfName },
      {
        onSuccess: () => {
          toast.success('답변을 등록했어요')
          setDraft('')
          setMentions([])
        },
        onError: () => toast.danger('답변 등록에 실패했어요'),
      },
    )
  }
  const accept = (answerId: string) => {
    if (acceptAnswer.isPending) return
    acceptAnswer.mutate(answerId, {
      onSuccess: () =>
        toast.success('답변을 채택했어요 · 질문이 해결됨으로 바뀌어요'),
      onError: () => toast.danger('채택에 실패했어요'),
    })
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <button
        type="button"
        onClick={() => navigate(base)}
        className="text-fg-muted hover:text-fg flex w-fit items-center gap-1.5 text-[13px] font-semibold"
      >
        <ArrowLeft className="size-4" />
        목록으로
      </button>

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={refetch}
        loadingText="질문을 불러오는 중…"
        errorTitle="질문을 찾을 수 없어요"
        errorDescription="삭제되었거나 잘못된 주소일 수 있어요."
      >
        {data && (
          <>
            {/* 질문 본문 */}
            <section className={cn(card, 'flex flex-col gap-4')}>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-bold',
                    CHIP[data.categoryTone],
                  )}
                >
                  {data.category}
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1.5 text-[11px] font-semibold',
                    resolved
                      ? 'text-success'
                      : data.status === 'answered'
                        ? 'text-info'
                        : 'text-warning',
                  )}
                >
                  {resolved && <CheckCircle2 className="size-3.5" />}
                  {data.statusLabel}
                </span>
                {data.canDelete && (
                  <div className="ml-auto flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/student/qna/${data.id}/edit`)}
                      className="text-fg-subtle hover:text-fg text-[11px] font-semibold transition-colors"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="text-fg-subtle hover:text-danger text-[11px] font-semibold transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>

              <h1 className="text-fg text-[20px] leading-7 font-bold">
                {data.title}
              </h1>

              <div className="text-fg-subtle flex items-center gap-3 text-[12px]">
                <span className="flex items-center gap-2">
                  <Avatar name={data.authorName} size={24} />
                  <span className="text-fg-muted font-semibold">
                    {data.authorName}
                  </span>
                </span>
                <span>{data.createdAt}</span>
                <span className="flex items-center gap-1">
                  <Eye className="size-3.5" />
                  {data.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-3.5" />
                  {data.answers.length}
                </span>
              </div>

              <Markdown>{data.content}</Markdown>

              {data.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {data.tags.map((t) => (
                    <span
                      key={t}
                      className="bg-surface-muted text-fg-muted rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* 질문 삭제 확인 — 답변·댓글 연쇄 삭제라 삭제 범위를 명시하고 danger 톤으로 확인 */}
            <ConfirmDialog
              open={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              onConfirm={() =>
                deleteQuestion.mutate(id, {
                  onSuccess: () => {
                    setDeleteOpen(false)
                    toast.success('질문을 삭제했어요')
                    navigate(base)
                  },
                  onError: () => toast.danger('질문 삭제에 실패했어요'),
                })
              }
              size="md"
              title="질문을 삭제할까요?"
              confirmLabel={deleteQuestion.isPending ? '삭제 중…' : '삭제'}
              confirmDisabled={deleteQuestion.isPending}
              tone="danger"
            >
              <div className="flex flex-col gap-4">
                <p className="text-fg-muted text-[13px] leading-6">
                  질문을 삭제하면 달린 답변과 댓글도 함께 삭제되며 되돌릴 수
                  없어요.
                </p>
                <div className="border-border bg-surface-muted/50 flex flex-col gap-1.5 rounded-[12px] border p-4">
                  <span className="text-fg text-[14px] font-bold">
                    {data.title}
                  </span>
                  <span className="text-fg-subtle text-[11px]">
                    답변 {data.answers.length}개 · 댓글{' '}
                    {data.answers.reduce((n, a) => n + a.comments.length, 0)}개
                  </span>
                </div>
              </div>
            </ConfirmDialog>

            {/* 답변 목록 */}
            <div className="flex items-center gap-2 pt-1">
              <h2 className="text-fg text-[16px] font-bold">답변</h2>
              <span className="text-fg-subtle text-[12px]">
                {data.answers.length}개
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {data.answers.length === 0 && (
                <div className="text-fg-subtle rounded-2xl p-10 text-center text-[13px]">
                  아직 답변이 없어요. 첫 답변을 남겨보세요.
                </div>
              )}
              {data.answers.map((a) => (
                <AnswerItem
                  key={a.id}
                  answer={a}
                  questionId={id}
                  resolved={resolved}
                  canAccept={data.canDelete}
                  onAccept={accept}
                  acceptPending={acceptAnswer.isPending}
                  selfName={selfName}
                  mentionNames={threadMentionNames(data, selfName)}
                />
              ))}
            </div>

            {/* 답변 작성 */}
            <section className={cn(card, 'flex flex-col gap-3')}>
              <span className="text-fg text-[14px] font-bold">답변 작성</span>
              <MarkdownEditor
                value={draft}
                onChange={setDraft}
                minHeight={120}
                maxLength={2000}
                placeholder="도움이 될 만한 답변을 남겨주세요. @로 멘션하면 알림이 가요."
                mentionNames={threadMentionNames(data, selfName)}
                onMentionsChange={setMentions}
                onImageRejected={(msg) => toast.danger(msg)}
              />
              <div className="flex items-center justify-end gap-2">
                <span className="text-fg-subtle mr-auto text-[11px]">
                  {mentions.length > 0
                    ? `멘션: @${mentions.join(', @')}`
                    : '마크다운·코드 블록·이미지·@멘션 지원'}
                </span>
                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={!draft.trim() || createAnswer.isPending}
                  className={buttonClass({ size: 'md' })}
                >
                  {createAnswer.isPending ? '등록 중…' : '답변 등록'}
                </button>
              </div>
            </section>
          </>
        )}
      </DataBoundary>
    </div>
  )
}
