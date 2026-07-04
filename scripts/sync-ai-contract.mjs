// LMS-AI ↔ FE 계약 동기화 (codegen 복사, 단방향).
//
// SSOT = LMS-AI/src/contract.ts. 이 스크립트가 그 파일을 FE 로컬로 복사한다.
//   대상: src/features/student/certificate/ai/contract.gen.ts (자동 생성 · 직접 수정 금지)
//
// 사용:
//   pnpm sync:ai-contract          # 복사(재생성)
//   pnpm sync:ai-contract --check  # 드리프트 검사(다르면 exit 1) — 커밋 전/CI용
//
// LMS-AI 위치: 기본은 형제 폴더(../LMS-AI). 다르면 환경변수로 지정:
//   LMS_AI_CONTRACT=/abs/path/contract.ts  또는  LMS_AI_DIR=/abs/path/LMS-AI

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const feRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const srcPath =
  process.env.LMS_AI_CONTRACT ??
  resolve(
    process.env.LMS_AI_DIR ?? resolve(feRoot, '..', 'LMS-AI'),
    'src',
    'contract.ts',
  )

const outPath = resolve(
  feRoot,
  'src/features/student/certificate/ai/contract.gen.ts',
)

const HEADER = `// ⚠️ 자동 생성 파일 — 직접 수정 금지.
// 원본(SSOT): LMS-AI/src/contract.ts
// 재생성: pnpm sync:ai-contract   (LMS-AI가 형제 폴더에 있거나 LMS_AI_DIR 지정)
`

const check = process.argv.includes('--check')

if (!existsSync(srcPath)) {
  console.error(`✗ LMS-AI 계약 원본을 찾을 수 없습니다: ${srcPath}`)
  console.error(
    '  LMS-AI를 형제 폴더로 두거나 LMS_AI_DIR / LMS_AI_CONTRACT 로 경로를 지정하세요.',
  )
  process.exit(1)
}

const generated = HEADER + '\n' + readFileSync(srcPath, 'utf8')

if (check) {
  const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null
  if (current !== generated) {
    console.error(
      '✗ contract.gen.ts 가 LMS-AI 원본과 다릅니다. `pnpm sync:ai-contract` 로 재생성 후 커밋하세요.',
    )
    process.exit(1)
  }
  console.log('✓ contract.gen.ts 가 LMS-AI 원본과 일치합니다.')
  process.exit(0)
}

writeFileSync(outPath, generated)
console.log(`✓ 계약 동기화 완료 → ${outPath}`)
