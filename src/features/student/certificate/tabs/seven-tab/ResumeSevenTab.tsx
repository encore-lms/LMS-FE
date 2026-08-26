import type { CertificateSevenTabs } from '../../analysis'
import { EmptyPanel, ResumeContent, SevenTabShell } from './SevenTabPrimitives'

export function ResumeSevenTab({
  tab,
}: {
  tab: CertificateSevenTabs['resume']
}) {
  const resume = tab.payload.resume

  return (
    <SevenTabShell
      no={6}
      title="이력서"
      sub="인증 시점에 완료된 이력서의 공개 가능 항목만 동결해 보여줍니다."
      tab={tab}
    >
      {resume ? (
        <div className="flex flex-col gap-4">
          <header className="border-divider bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4">
            <div>
              <span className="text-brand text-[10px] font-bold">
                완료 이력서
              </span>
              <h3 className="text-fg mt-1 text-[16px] font-bold">
                {resume.title}
              </h3>
            </div>
            <span className="text-fg-subtle text-[11px]">
              최종 수정 {resume.updatedAt}
            </span>
          </header>
          <ResumeContent content={resume.content} />
        </div>
      ) : (
        <EmptyPanel>인증에 포함된 완료 이력서가 없습니다.</EmptyPanel>
      )}
    </SevenTabShell>
  )
}
