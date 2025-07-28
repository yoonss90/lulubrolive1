import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '*.config.js', '*.d.ts'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.react, // React 관련 규칙 추가
    ],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      globals: {
        ...globals.browser,
        ...globals.node, // Node.js 환경에서도 사용될 수 있는 전역 변수
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react/jsx-key': 'warn', // React key 경고
      'react-hooks/rules-of-hooks': 'error', // Hooks 규칙 검사
      'react-hooks/exhaustive-deps': 'warn', // 의존성 배열 검사
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // any 타입 사용 경고 (필요시 조정)
      '@typescript-eslint/no-unused-vars': 'warn', // 사용되지 않는 변수 경고
    },
  }
);
