import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier/flat'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const testFilePattern = '*.{test,spec}.{ts,js,tsx,jsx,mts,cts,mjs,cjs}'

export default defineConfig([
  globalIgnores(['dist/**', '.vite-ssg-temp/**', '.taste-skill/**']),
  js.configs.recommended,
  {
    files: ['**/*.{ts,vue}'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['**/*.vue'],
    extends: [vue.configs['flat/essential']],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    rules: {
      'vue/multi-word-component-names': [
        'error',
        { ignores: ['index', 'signature'] },
      ],
    },
  },
  {
    files: ['src/**/*.{js,ts,vue}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.{js,ts}', 'api/**/*.ts', 'build/**/*.ts', 'server/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  prettier,
  {
    files: ['**/' + testFilePattern],
    ignores: ['**/__SPEC__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message: '请将测试移到所属模块的 __SPEC__/ 目录。',
        },
      ],
    },
  },
  {
    files: ['**/components/**/' + testFilePattern],
    ignores: [
      '**/components/__SPEC__/**',
      '!**/components/__SPEC__/components.{test,spec}.*',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message:
            '请将组件测试放在所属 components/__SPEC__/ 下，以组件名命名；需要拆分时，在同名子目录中按行为命名。',
        },
      ],
    },
  },
  {
    files: ['**/*.{js,ts,vue}'],
    rules: {
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'never', prev: 'import', next: 'import' },
        { blankLine: 'always', prev: 'export', next: '*' },
        { blankLine: 'always', prev: '*', next: 'export' },
        { blankLine: 'always', prev: ['const', 'let'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['const', 'let'] },
        {
          blankLine: 'any',
          prev: ['singleline-const', 'singleline-let'],
          next: ['singleline-const', 'singleline-let'],
        },
        { blankLine: 'always', prev: '*', next: ['function', 'return'] },
        {
          blankLine: 'always',
          prev: ['function', 'if', 'for', 'try'],
          next: '*',
        },
        { blankLine: 'any', prev: 'if', next: 'if' },
      ],
    },
  },
])
