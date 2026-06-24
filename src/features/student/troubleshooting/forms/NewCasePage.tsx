import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// 트러블슈팅 새 사례 / 이어 작성 — 작성 흐름이 상세(/:id) 단일 페이지로 통일됐다.
// 이 라우트(/troubleshooting/new)는 진입점일 뿐, 작성은 상세 페이지에서 직접 한다.
//   - ?id=<caseId> (이어 작성) → 해당 사례 상세로.
//   - 그 외 (새 사례)          → 새 draft id를 만들어 상세로(빈 작성 폼이 열린다).
export default function NewCasePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  useEffect(() => {
    const editId = params.get('id')
    const id = editId ?? `ts_${Math.random().toString(36).slice(2, 7)}`
    navigate(`/student/troubleshooting/${id}`, { replace: true })
  }, [navigate, params])
  return <div className="text-fg-muted p-8">편집 화면으로 이동 중…</div>
}
