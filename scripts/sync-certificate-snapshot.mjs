import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const feRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const aiRoot = resolve(
  process.env.LMS_AI_DIR ?? resolve(feRoot, '..', 'LMS-AI'),
)
const pythonPath =
  process.env.LMS_AI_PYTHON ??
  resolve(
    aiRoot,
    '.venv',
    process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
  )
const studentId =
  process.env.VITE_CERTIFICATE_STUDENT_ID ??
  'd9552119-7a27-5be5-b2a4-1d82a709cfb9'
const outputPath = resolve(
  feRoot,
  'src/features/student/certificate/ai/stubs/certificate.snapshot.json',
)

if (!existsSync(pythonPath)) {
  throw new Error(`LMS-AI Python 실행 파일을 찾을 수 없습니다: ${pythonPath}`)
}

const source = `
import json
from fastapi.testclient import TestClient
from lms_ai.app import app

client = TestClient(app)
student_id = ${JSON.stringify(studentId)}
paths = ("scores", "tabs", "analysis")
responses = {path: client.get(f"/{path}/{student_id}") for path in paths}
failed = {path: response.status_code for path, response in responses.items() if response.status_code != 200}
if failed:
    raise RuntimeError(f"LMS-AI snapshot endpoint failure: {failed}")
print(json.dumps({
    "score": responses["scores"].json(),
    "tabs": responses["tabs"].json(),
    "analysis": responses["analysis"].json(),
}, ensure_ascii=False))
`

const raw = execFileSync(pythonPath, ['-c', source], {
  cwd: aiRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1',
  },
})
const snapshot = JSON.parse(raw)

if (snapshot.score.policyVersion !== '2026.08.05-six-axis-four-rater-v2') {
  throw new Error(
    `지원하지 않는 점수 정책 버전입니다: ${snapshot.score.policyVersion}`,
  )
}

writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
console.log(`certificate snapshot synced: ${studentId} -> ${outputPath}`)
