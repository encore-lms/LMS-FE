import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      'public/mockServiceWorker.js',
      // 자동 생성(LMS-AI 계약 복사본) — 타입체크(tsc)로만 검증, 린트 제외
      'src/features/student/certificate/ai/contract.gen.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // feature 경계 — 형제 feature의 api 레이어(@/features/*/api)는 비공개.
  // 교차 사용이 필요한 훅은 @/shared/api로 승격하고, 같은 feature 안에서는 상대경로(./api)를 쓴다.
  // (같은 feature의 api는 상대경로라 이 패턴에 걸리지 않는다.) 스코프를 features/ 로 한정해
  // 합성 루트(src/app)·shared는 feature api를 조합할 수 있게 둔다(top-down은 허용).
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/api', '@/features/*/api/*'],
              message:
                'feature의 api 레이어는 비공개입니다. 교차 사용이 필요하면 @/shared/api로 승격하고, 같은 feature 안에서는 상대경로(./api)를 쓰세요.',
            },
          ],
        },
      ],
    },
  },
  // 테스트는 합성된 feature의 내부 모듈을 mock해야 하므로 경계 룰에서 제외.
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['playwright.config.ts', 'e2e/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  // prettier와 충돌하는 포맷 규칙 비활성 (항상 마지막)
  prettier,
)
