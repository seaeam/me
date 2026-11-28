import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  assetsInclude: ['**/*.md'],
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@content': fileURLToPath(new URL('./content', import.meta.url)),
    },
  },
  test: {
    include: ['**/__SPEC__/**/*.{test,spec}.{ts,js,tsx,jsx,mts,cts,mjs,cjs}'],
    restoreMocks: true,
    unstubGlobals: true,
  },
})
