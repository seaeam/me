import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier/flat'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

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
    files: ['*.{js,ts}', 'api/**/*.ts', 'server/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  prettier,
  {
    files: ['**/*.{test,spec}.{ts,js,tsx,jsx,mts,cts,mjs,cjs}'],
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
